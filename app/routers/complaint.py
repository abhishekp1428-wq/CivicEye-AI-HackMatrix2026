from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from typing import Optional
from app import schemas, crud, models
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.ai_service import analyze_image
from app.dependencies import get_current_user
import json
from pathlib import Path
from uuid import uuid4

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def complaint_to_dict(complaint):
    """Convert SQLAlchemy Complaint object to a JSON-safe dict."""
    return {
        "id": complaint.id,
        "title": complaint.title,
        "description": complaint.description,
        "image": (
            f"http://127.0.0.1:8000/uploads/{Path(complaint.image).name}"
            if complaint.image else None
        ),
        "location": complaint.location,
        "status": complaint.status,
        "department": complaint.department,
        "severity": complaint.severity,
        "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
    }


STAGING_DIR = Path(__file__).resolve().parents[1] / "staged_uploads"
STAGING_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/complaints/analyze")
def analyze_complaint(
    title: str = Form(...),
    location: str = Form(...),
    image: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """Analyze an image and stage it; this route does not create a complaint."""
    suffix = Path(image.filename or "upload.jpg").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, or WEBP image")

    analysis_id = uuid4().hex
    staged_image = STAGING_DIR / f"{analysis_id}{suffix}"
    metadata_path = STAGING_DIR / f"{analysis_id}.json"
    with staged_image.open("wb") as buffer:
        buffer.write(image.file.read())

    default_ai = {
        "problem": "Not Available",
        "severity": "Medium",
        "department": "General",
        "description": "Automatic analysis unavailable. Please review manually.",
    }
    try:
        ai_result = analyze_image(str(staged_image))
        if isinstance(ai_result, str):
            ai_result = ai_result.replace("<think>", "").replace("</think>", "").strip()
            if "```json" in ai_result:
                ai_result = ai_result.split("```json", 1)[1].split("```", 1)[0].strip()
            ai_result = json.loads(ai_result)
        if not isinstance(ai_result, dict):
            raise ValueError("AI result is not a JSON object")
        for key, value in default_ai.items():
            if not ai_result.get(key):
                ai_result[key] = value
    except Exception as exc:
        print("AI ERROR =====>", exc)
        ai_result = default_ai

    metadata = {
        "user_id": current_user.id,
        "title": title,
        "location": location,
        "image_name": staged_image.name,
        "analysis": ai_result,
    }
    metadata_path.write_text(json.dumps(metadata), encoding="utf-8")
    return {"analysis_id": analysis_id, "ai_analysis": ai_result}


@router.post("/complaints")
def create_complaint(
    payload: schemas.ComplaintSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create the complaint only after the user confirms submission."""
    if not payload.analysis_id.isalnum():
        raise HTTPException(status_code=400, detail="Invalid analysis reference")

    metadata_path = STAGING_DIR / f"{payload.analysis_id}.json"
    if not metadata_path.is_file():
        raise HTTPException(status_code=404, detail="Analysis expired or already submitted. Please analyze again.")

    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        raise HTTPException(status_code=400, detail="Could not read the analysis. Please analyze again.")

    if metadata.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="This analysis belongs to another user")

    staged_image = STAGING_DIR / metadata["image_name"]
    if not staged_image.is_file():
        raise HTTPException(status_code=404, detail="Uploaded image is missing. Please analyze again.")

    final_image = UPLOAD_DIR / staged_image.name
    staged_image.replace(final_image)
    analysis = metadata["analysis"]
    description = analysis["description"]
    if payload.note and payload.note.strip():
        description = f"{description}\n\nAdditional Note: {payload.note.strip()}"

    try:
        complaint = crud.create_complaint(
            db=db,
            title=metadata["title"],
            description=description,
            image=str(final_image),
            location=metadata["location"],
            department=analysis["department"],
            severity=analysis["severity"],
            user_id=current_user.id,
        )
    except Exception:
        db.rollback()
        final_image.replace(staged_image)
        raise

    metadata_path.unlink(missing_ok=True)
    return {
        "message": "Complaint submitted successfully",
        "complaint": complaint_to_dict(complaint),
    }


@router.get("/complaints")
def get_complaints(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    # Only this user's complaints
    query = db.query(models.Complaint).filter(
        models.Complaint.user_id == current_user.id
    )

    if status and status != "All":
        query = query.filter(models.Complaint.status == status)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (models.Complaint.title.ilike(search_fmt)) |
            (models.Complaint.location.ilike(search_fmt)) |
            (models.Complaint.department.ilike(search_fmt))
        )

    complaints = query.order_by(models.Complaint.id.desc()).all()

    return [complaint_to_dict(c) for c in complaints]


@router.get("/complaints/{id}")
def get_complaint_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing_com = crud.get_complaint_by_id(db, id)

    if existing_com is None or existing_com.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return complaint_to_dict(existing_com)


@router.put("/complaints/{id}")
def update_complaint(
    id: int,
    complaint: schemas.ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing_com = crud.get_complaint_by_id(db, id)

    if existing_com is None or existing_com.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Complaint not found")

    updated = crud.update_complaint(db, id, complaint)
    return complaint_to_dict(updated)


@router.delete("/complaints/{id}")
def delete_complaint(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing_com = crud.get_complaint_by_id(db, id)

    if existing_com is None or existing_com.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Complaint not found")

    crud.delete_complaint(db, id)
    return {"message": "Complaint deleted successfully"}
