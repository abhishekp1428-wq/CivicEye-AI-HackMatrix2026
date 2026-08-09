from pydantic import BaseModel,EmailStr
from typing import Optional
from datetime import datetime

class Userregister(BaseModel):
    user_name:str
    email:str
    mobile:str
    password:str

class userlogin(BaseModel):
    email:str
    password:str

class UserUpdate(BaseModel):
    user_name: str
    email: EmailStr
    mobile: str
    password: Optional[str] = None


class UserResponse(BaseModel):
    id:int
    user_name:str
    email:str
    mobile:str

    class Config:
     from_attributes = True


class ComplaintCreate(BaseModel):
    title: str
    description: str
    image: Optional[str] = None
    location: str
    department: str
    severity: Optional[str] = None


class ComplaintUpdate(BaseModel):
    title: str
    description: str
    image: Optional[str] = None
    location: str
    department: str
    severity: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: int
    title: str
    description: str
    image: Optional[str] = None
    location: str
    status: str
    department: str
    severity: Optional[str] = None
    created_at: Optional[datetime] = None

class AdminComplaintUpdate(BaseModel):
    status: Optional[str] = None
    department: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type:str
class TokenData(BaseModel):
    email: str | None = None

    class Config:
     from_attributes = True