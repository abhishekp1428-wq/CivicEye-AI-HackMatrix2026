from sqlalchemy.orm import Session
from app import models,schemas
from app.utils.security import hash_password,verify_password

def create_user(
        db:Session,
        user:schemas.Userregister
):
   hashed_password = hash_password(user.password)
   new_user=models.User(
     user_name=user.user_name,
       email=user.email,
               mobile=user.mobile,
       password=hashed_password

)
   db.add(new_user)
   db.commit()
   db.refresh(new_user)
   return new_user
def get_user_by_email(db:Session,
                      email:str):
   return db.query(models.User).filter(models.User.email==email).first()


def get_all_users(db:Session):
   return db.query(models.User).all()


def get_user_by_id(db:Session,id:int):
   existing_user=db.query(models.User).filter(models.User.id==id).first()
   return existing_user


def update_user(db:Session,
                id:int,
                user: schemas.UserUpdate):

    existing_user=db.query(models.User).filter(models.User.id==id).first()
    if existing_user is None:
        return None


    existing_user.user_name=user.user_name
    existing_user.email=user.email
    existing_user.mobile=user.mobile
    if user.password:
        existing_user.password= hash_password(user.password)

    db.commit()
    db.refresh(existing_user)
    return existing_user

def delete_user(db:Session,
                id:int):

   existing_user=db.query(models.User).filter(models.User.id==id).first()

   if existing_user is None:
      return None

   db.delete(existing_user)
   db.commit()

   return existing_user
def create_complaint(db:Session,
                        title: str,
                        description: str,
                        image: str,
                        location: str,
                                      department: str,
                        severity: str = None,
                        user_id: int = None):
   new_complaint=models.Complaint(
        title=title,
                               description=description,
                      image=image,
        location=location,
        department=department,
                      severity=severity,
        user_id=user_id,
        status="Pending"
    )
   db.add(new_complaint)
   db.commit()
   db.refresh(new_complaint)
   return new_complaint

def login_user(db:Session,user: schemas.userlogin):
   existing_user=db.query(models.User).filter(models.User.email==user.email).first()
   if existing_user is None:
    return None
   if not verify_password(user.password, existing_user.password):
    return None

   return existing_user

def get_all_complaints(db:Session):
   return db.query(models.Complaint).all()

def get_complaint_by_id(db:Session,
                        id:int):
   existing_com=db.query(models.Complaint).filter(models.Complaint.id==id).first()
   return existing_com
def update_complaint(db:Session,id:int,com:schemas.ComplaintUpdate):
   existing_com=db.query(models.Complaint).filter(models.Complaint.id==id).first()
   if existing_com is None:
      return None
   existing_com.title = com.title
   existing_com.description = com.description
   existing_com.image = com.image
   existing_com.location = com.location
   existing_com.department = com.department
   incoming_severity = getattr(com, "severity", None)
   if incoming_severity is not None:
      existing_com.severity = incoming_severity

   db.commit()
   db.refresh(existing_com)

   return existing_com


def delete_complaint(
        db: Session,
        id: int
):
    existing_com = db.query(models.Complaint).filter(
        models.Complaint.id == id
    ).first()

    if existing_com is None:
        return None

    db.delete(existing_com)
    db.commit()

    return existing_com