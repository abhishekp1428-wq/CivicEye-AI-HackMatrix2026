from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


def complaint_to_admin_dict(complaint, user):
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
        "user_id": complaint.user_id,
        "user_name": user.user_name if user else "Unknown",
        "user_email": user.email if user else "Unknown",
    }


@router.get("/complaints")
def get_all_complaints_admin(
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    query = db.query(models.Complaint)

    if status and status != "All":
        query = query.filter(models.Complaint.status == status)

    if department and department != "All":
        query = query.filter(models.Complaint.department == department)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (models.Complaint.title.ilike(search_fmt)) |
            (models.Complaint.location.ilike(search_fmt))
        )

    complaints = query.order_by(models.Complaint.id.desc()).all()

    result = []
    for c in complaints:
        user = db.query(models.User).filter(models.User.id == c.user_id).first()
        result.append(complaint_to_admin_dict(c, user))

    return result


@router.put("/complaints/{id}")
def update_complaint_admin(
    id: int,
    payload: schemas.AdminComplaintUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == id).first()

    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if payload.status is not None:
        complaint.status = payload.status

    if payload.department is not None:
        complaint.department = payload.department

    db.commit()
    db.refresh(complaint)

    user = db.query(models.User).filter(models.User.id == complaint.user_id).first()
    return complaint_to_admin_dict(complaint, user)


@router.delete("/complaints/{id}")
def delete_complaint_admin(
    id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == id).first()

    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")

    db.delete(complaint)
    db.commit()

    return {"message": "Complaint deleted successfully"}