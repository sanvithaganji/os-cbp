import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Folder(Base):
    __tablename__ = "folders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    parent_id = Column(String(36), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Self-referential relationship
    parent = relationship("Folder", remote_side=[id], backref="children")
    files = relationship("FileRecord", back_populates="folder", cascade="all, delete-orphan")

class FileRecord(Base):
    __tablename__ = "files"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    folder_id = Column(String(36), ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)
    file_type = Column(String(50), nullable=False, default="unknown")
    mime_type = Column(String(100), nullable=False, default="application/octet-stream")
    size_bytes = Column(Integer, nullable=False, default=0)
    storage_path = Column(String(500), nullable=False)
    hash_sha256 = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    folder = relationship("Folder", back_populates="files")

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tool_name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="completed")  # pending, completed, failed
    input_file_ids = Column(Text, nullable=False, default="[]")  # JSON list
    output_file_id = Column(String(36), nullable=True)
    duration_ms = Column(Float, nullable=False, default=0.0)
    details = Column(Text, nullable=False, default="{}")  # JSON string
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    category = Column(String(100), nullable=False)  # cpu_scheduling, memory_allocation, etc.
    algorithm_name = Column(String(100), nullable=False)
    input_data = Column(Text, nullable=False, default="{}")
    result_data = Column(Text, nullable=False, default="{}")
    steps_data = Column(Text, nullable=False, default="[]")
    execution_time_ms = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=utc_now)

class SavedConfig(Base):
    __tablename__ = "saved_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    algorithm_name = Column(String(100), nullable=False)
    config_data = Column(Text, nullable=False, default="{}")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

class LabReport(Base):
    __tablename__ = "lab_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_no = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    algorithm_name = Column(String(100), nullable=False)
    aim = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    input_summary = Column(Text, nullable=False, default="{}")
    result_summary = Column(Text, nullable=False, default="{}")
    conclusion = Column(Text, nullable=False)
    markdown_content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
