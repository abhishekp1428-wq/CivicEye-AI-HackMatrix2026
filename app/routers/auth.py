from fastapi import APIRouter,Depends,status ,HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, crud
from app.utils.jwt_handler import create_access_token

router=APIRouter()

@router.post("/register")
def register(
    user:schemas.Userregister,
    db:Session=Depends(get_db)
):
    existing_user=crud.get_user_by_email(db,user.email)
    if existing_user :
         raise HTTPException(
              status_code=409,
              detail="Email already exists"
         )
    new_user = crud.create_user(db, user)
    return new_user
@router.post("/login")
def login(
    user: schemas.userlogin,
    db: Session = Depends(get_db)
):

    existing_user = crud.login_user(db, user)

    if existing_user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={"sub": existing_user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": existing_user.id,
            "user_name": existing_user.user_name,
            "email": existing_user.email,
            "mobile": existing_user.mobile,
            "is_admin": bool(existing_user.is_admin)
        }
    }