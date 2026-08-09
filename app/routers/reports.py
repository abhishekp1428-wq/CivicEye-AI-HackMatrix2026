from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_user

router = APIRouter(tags=["Reports"])


@router.get("/reports/summary")
def reports_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    base_query = db.query(models.Complaint).filter(
        models.Complaint.user_id == current_user.id
    )

    total = base_query.count()

    # ---------- Department-wise breakdown ----------
    dept_rows = (
        db.query(
            models.Complaint.department,
            func.count(models.Complaint.id)
        )
        .filter(models.Complaint.user_id == current_user.id)
        .group_by(models.Complaint.department)
        .all()
    )

    department_breakdown = [
        {"department": dept or "Unknown", "count": count}
        for dept, count in dept_rows
    ]

    # ---------- Month-wise breakdown ----------
    # DATE_FORMAT works on MySQL. Groups complaints by "YYYY-MM" of created_at.
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

    # ---------- Status breakdown (bonus, useful for the same page) ----------
    status_rows = (
        db.query(
            models.Complaint.status,
            func.count(models.Complaint.id)
        )
        .filter(models.Complaint.user_id == current_user.id)
        .group_by(models.Complaint.status)
        .all()
    )

    status_breakdown = [
        {"status": status or "Pending", "count": count}
        for status, count in status_rows
    ]

    return {
        "total": total,
        "department_breakdown": department_breakdown,
        "month_breakdown": month_breakdown,
        "status_breakdown": status_breakdown
    }