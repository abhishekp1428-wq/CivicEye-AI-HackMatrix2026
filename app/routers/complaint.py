from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from typing import Optional
from app import schemas, crud, models
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.ai_service import analyze_image
from app.dependencies import get_current_user
import json
import os

router = APIRouter()

UPLOAD_DIR = "app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def complaint_to_dict(complaint):
    """Convert SQLAlchemy Complaint object to a JSON-safe dict."""
    return {
        "id": complaint.id,
        "title": complaint.title,
        "description": complaint.description,
        "image": complaint.image,
        "location": complaint.location,
        "status": complaint.status,
        "department": complaint.department,
        "severity": complaint.severity,
        "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
    }


@router.post("/complaints")
def create_complaint(
    title: str = Form(...),
    location: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    # Save Image
    file_path = os.path.join(UPLOAD_DIR, image.filename)

    with open(file_path, "wb") as buffer:
        buffer.write(image.file.read())

    # AI Analysis
    try:
        ai_result = analyze_image(file_path)

        print("AI RESPONSE =====>", ai_result)

        if isinstance(ai_result, str):

            ai_result = (
                ai_result
                .replace("<think>", "")
                .replace("</think>", "")
                .strip()
            )

            if "```json" in ai_result:
                ai_result = ai_result.split("```json")[1]
                ai_result = ai_result.split("```")[0]

            ai_result = ai_result.strip()
            ai_result = json.loads(ai_result)

        required_keys = ["problem", "severity", "department", "description"]
        for key in required_keys:
            if key not in ai_result:
                ai_result[key] = "Not Available"

    except Exception as e:
        print("AI ERROR =====>", e)
        raise HTTPException(
            status_code=500,
            detail=f"AI Analysis Failed: {str(e)}"
        )

    # Save Complaint — tagged with the logged-in user's id
    complaint = crud.create_complaint(
        db=db,
        title=title,
        description=ai_result["description"],
        image=file_path,
        location=location,
        department=ai_result["department"],
        severity=ai_result["severity"],
        user_id=current_user.id
    )

    return {
        "message": "Complaint created successfully",
        "ai_analysis": ai_result,
        "complaint": complaint_to_dict(complaint)
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