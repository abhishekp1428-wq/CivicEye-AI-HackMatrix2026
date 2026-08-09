from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    base_query = db.query(models.Complaint).filter(
        models.Complaint.user_id == current_user.id
    )

    total = base_query.count()
    pending = base_query.filter(models.Complaint.status == "Pending").count()
    progress = base_query.filter(models.Complaint.status == "In Progress").count()
    resolved = base_query.filter(models.Complaint.status == "Resolved").count()
    rejected = base_query.filter(models.Complaint.status == "Rejected").count()

    recent = base_query.order_by(models.Complaint.id.desc()).limit(5).all()

    # Month-wise counts for the "Issues Overview" chart
    month_rows = (
        db.query(
            func.date_format(models.Complaint.created_at, "%Y-%m").label("month"),
            func.count(models.Complaint.id)
        )
        .filter(
            models.Complaint.user_id == current_user.id,
            models.Complaint.created_at.isnot(None)
        )
        .group_by("month")
        .order_by("month")
        .all()
    )

    month_breakdown = [
        {"month": month, "count": count}
        for month, count in month_rows
    ]

    return {
        "total": total,
        "pending": pending,
        "progress": progress,
        "resolved": resolved,
        "rejected": rejected,
        "month_breakdown": month_breakdown,
        "recent": [
            {
                "id": c.id,
                "title": c.title,
                "location": c.location,
                "status": c.status,
                "severity": c.severity,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in recent
        ]
    }