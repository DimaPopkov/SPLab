from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from datetime import datetime, timezone
from app.database import Base

class ScanReport(Base):
    __tablename__ = "scan_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    repo_full_name = Column(String, index=True, nullable=False)
    status = Column(String, default="completed")  # pending / completed / failed (для RabbitMQ)
    issues = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))