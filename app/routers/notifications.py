from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def notification_to_dict(notification: models.Notification) -> dict:
    return {
        "id": notification.id,
        "complaint_id": notification.complaint_id,
        "complaint_title": notification.complaint_title,
        "message": notification.message,
        "status": notification.status,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
    }


@router.get("")
def get_notifications(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    base_query = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    )
    notifications = (
        base_query
        .order_by(models.Notification.created_at.desc(), models.Notification.id.desc())
        .limit(limit)
        .all()
    )
    unread_count = base_query.filter(models.Notification.is_read.is_(False)).count()

    return {
        "items": [notification_to_dict(notification) for notification in notifications],
        "unread_count": unread_count,
    }


@router.post("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    updated_count = (
        db.query(models.Notification)
        .filter(
            models.Notification.user_id == current_user.id,
            models.Notification.is_read.is_(False),
        )
        .update({models.Notification.is_read: True}, synchronize_session=False)
    )
    db.commit()
    return {"updated_count": updated_count}


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    notification = (
        db.query(models.Notification)
        .filter(
            models.Notification.id == notification_id,
            models.Notification.user_id == current_user.id,
        )
        .first()
    )
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification_to_dict(notification)
