from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from app.database import base
from sqlalchemy.sql import func

class User(base):
     __tablename__="userdata"

     id=Column(Integer,primary_key=True,index=True)
     user_name=Column(String(50),nullable=False)
     email=Column(String(250),nullable=False)
     mobile=Column(String(250),nullable=False)
     password=Column(String(300),nullable=False)
     is_admin=Column(Boolean, default=False)
     created_at = Column(DateTime(timezone=True), server_default=func.now())

class Complaint(base):
     __tablename__="complaints"
     id=Column(Integer,primary_key=True)
     user_id=Column(Integer, ForeignKey("userdata.id"), nullable=True)
     title=Column(String(500))
     description=Column(String(1000))
     image=Column(String(500))
     location=Column(String(500))
     status=Column(String(50))
     department=Column(String(100))
     severity=Column(String(50))
     created_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(base):
     __tablename__ = "notifications"

     id = Column(Integer, primary_key=True, index=True)
     user_id = Column(Integer, ForeignKey("userdata.id", ondelete="CASCADE"), nullable=False, index=True)
     complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True, index=True)
     complaint_title = Column(String(500), nullable=False)
     message = Column(String(1000), nullable=False)
     status = Column(String(50), nullable=False)
     is_read = Column(Boolean, nullable=False, default=False)
     created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)