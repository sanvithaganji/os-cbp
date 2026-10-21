from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class LabReportCreate(BaseModel):
    experiment_no: int
    title: str
    category: str
    algorithm_name: str
    aim: str
    description: str
    input_summary: Dict[str, Any]
    result_summary: Dict[str, Any]
    conclusion: str
    markdown_content: Optional[str] = None

class LabReportResponse(BaseModel):
    id: str
    experiment_no: int
    title: str
    category: str
    algorithm_name: str
    aim: str
    description: str
    input_summary: Dict[str, Any]
    result_summary: Dict[str, Any]
    conclusion: str
    markdown_content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OverviewStatsResponse(BaseModel):
    total_files: int
    total_folders: int
    storage_used_bytes: int
    storage_quota_bytes: int
    storage_percentage: float
    total_simulations: int
    total_processing_jobs: int
    syllabus_progress: Dict[str, bool]  # e.g. {"week1": True, "week2": False, ...}
    recent_files: list[Dict[str, Any]]
    recent_jobs: list[Dict[str, Any]]
    recent_simulations: list[Dict[str, Any]]
