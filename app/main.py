from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, base
from app import models
from app.routers import auth, user, complaint, dashboard, reports, admin

app = FastAPI(
    title="CivicEye AI API",
    version="1.0.0"
)


base.metadata.create_all(bind=engine)


origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(complaint.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(admin.router)


@app.get("/")
def home():
    return {
        "message": "Welcome to CivicEye AI Backend 🚀",
        "status": "Running Successfully"
    }