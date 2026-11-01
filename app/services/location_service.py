"""
location_service.py - live location tracking for CivicEye AI.

Handles: validation, throttled saving of pings, last-known location,
history, distance/ETA, and WebSocket broadcasting to viewers.

Assumes a SQLAlchemy model `LocationPing` in models.py:

    class LocationPing(Base):
        __tablename__ = "location_pings"
        id = Column(Integer, primary_key=True)
        complaint_id = Column(Integer, ForeignKey("complaints.id"), index=True)
        lat = Column(Float, nullable=False)
        lng = Column(Float, nullable=False)
        created_at = Column(DateTime, default=datetime.utcnow, index=True)
"""

import math
import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional

from fastapi import WebSocket
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from models import LocationPing  # adjust import path to your project

# Save to DB at most once per this many seconds per complaint
MIN_SAVE_INTERVAL_SEC = 5
# Assumed average speed for ETA (km/h) - tune for your city/vehicle
DEFAULT_SPEED_KMH = 25.0


# ---------- Schemas ----------

class LocationIn(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class LocationOut(BaseModel):
    lat: float
    lng: float
    created_at: Optional[datetime] = None


# ---------- Geo helpers ----------

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points in kilometres."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def eta_minutes(distance_km: float, speed_kmh: float = DEFAULT_SPEED_KMH) -> int:
    return max(1, round(distance_km / speed_kmh * 60))


# ---------- DB operations ----------

_last_saved: dict[int, float] = {}  # complaint_id -> monotonic timestamp


def save_ping(db: Session, complaint_id: int, loc: LocationIn, force: bool = False) -> Optional[LocationPing]:
    """Persist a ping, skipping it if one was saved too recently."""
    now = time.monotonic()
    last = _last_saved.get(complaint_id, 0.0)
    if not force and now - last < MIN_SAVE_INTERVAL_SEC:
        return None

    ping = LocationPing(complaint_id=complaint_id, lat=loc.lat, lng=loc.lng)
    db.add(ping)
    db.commit()
    db.refresh(ping)
    _last_saved[complaint_id] = now
    return ping


def get_last_location(db: Session, complaint_id: int) -> Optional[LocationPing]:
    return (
        db.query(LocationPing)
        .filter(LocationPing.complaint_id == complaint_id)
        .order_by(LocationPing.id.desc())
        .first()
    )


def get_history(db: Session, complaint_id: int, minutes: int = 60, limit: int = 500) -> list[LocationPing]:
    since = datetime.utcnow() - timedelta(minutes=minutes)
    return (
        db.query(LocationPing)
        .filter(LocationPing.complaint_id == complaint_id, LocationPing.created_at >= since)
        .order_by(LocationPing.id.asc())
        .limit(limit)
        .all()
    )


def distance_to_target(db: Session, complaint_id: int, target_lat: float, target_lng: float) -> Optional[dict]:
    """Distance and ETA from the latest ping to a target (e.g. the complaint site)."""
    last = get_last_location(db, complaint_id)
    if not last:
        return None
    km = haversine_km(last.lat, last.lng, target_lat, target_lng)
    return {"distance_km": round(km, 2), "eta_min": eta_minutes(km)}


def purge_old_pings(db: Session, days: int = 7) -> int:
    """Delete old pings to keep the table small (run from a scheduled job)."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    n = db.query(LocationPing).filter(LocationPing.created_at < cutoff).delete()
    db.commit()
    return n


# ---------- WebSocket hub ----------

class TrackingHub:
    """Tracks which sockets are watching which complaint and broadcasts updates."""

    def __init__(self) -> None:
        self.viewers: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, complaint_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self.viewers[complaint_id].add(ws)

    def disconnect(self, complaint_id: int, ws: WebSocket) -> None:
        self.viewers[complaint_id].discard(ws)
        if not self.viewers[complaint_id]:
            self.viewers.pop(complaint_id, None)

    async def broadcast(self, complaint_id: int, payload: dict, exclude: Optional[WebSocket] = None) -> None:
        dead = []
        for ws in list(self.viewers.get(complaint_id, ())):
            if ws is exclude:
                continue
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(complaint_id, ws)


hub = TrackingHub()