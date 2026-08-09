from fastapi import APIRouter, Depends, HTTPException
from app import schemas, crud, models
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/users/me")
def get_my_profile(
    current_user: models.User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "user_name": current_user.user_name,
        "email": current_user.email,
        "mobile": current_user.mobile
    }


@router.put("/users/{id}")
def update_user(
    id: int,
    user: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # A user can only update their own profile
    if id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to edit this profile")

    existing_user = crud.update_user(db, id, user)
    if existing_user is None:
        raise HTTPException(status_code=404, detail="user not found")

    return {
        "id": existing_user.id,
        "user_name": existing_user.user_name,
        "email": existing_user.email,
        "mobile": existing_user.mobile
    }


@router.delete("/users/{id}")
def delete_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this profile")

    existing_user = crud.delete_user(db, id)
    if existing_user is None:
        raise HTTPException(status_code=404, detail="user not found")

    return {"message": "Account deleted successfully"}