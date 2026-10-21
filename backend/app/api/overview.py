import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.database.models import FileRecord, Folder, ProcessingJob, SimulationRun
from app.services.storage_service import get_storage_usage
from app.schemas.reports import OverviewStatsResponse

router = APIRouter(prefix="/overview", tags=["overview"])

@router.get("/stats", response_model=OverviewStatsResponse)
def get_overview_stats(db: Session = Depends(get_db)):
    storage_info = get_storage_usage(db)

    recent_files_query = db.query(FileRecord).order_by(desc(FileRecord.created_at)).limit(5).all()
    recent_files = [
        {
            "id": f.id,
            "name": f.name,
            "file_type": f.file_type,
            "size_bytes": f.size_bytes,
            "created_at": f.created_at.isoformat()
        }
        for f in recent_files_query
    ]

    recent_jobs_query = db.query(ProcessingJob).order_by(desc(ProcessingJob.created_at)).limit(5).all()
    recent_jobs = [
        {
            "id": j.id,
            "tool_name": j.tool_name,
            "status": j.status,
            "duration_ms": j.duration_ms,
            "created_at": j.created_at.isoformat()
        }
        for j in recent_jobs_query
    ]

    recent_sims_query = db.query(SimulationRun).order_by(desc(SimulationRun.created_at)).limit(5).all()
    recent_sims = [
        {
            "id": s.id,
            "category": s.category,
            "algorithm_name": s.algorithm_name,
            "created_at": s.created_at.isoformat(),
            "execution_time_ms": s.execution_time_ms
        }
        for s in recent_sims_query
    ]

    # Check which syllabus weeks have at least one simulation
    all_categories = {s[0] for s in db.query(SimulationRun.category).distinct().all()}
    syllabus_progress = {
        "week1": "cpu_scheduling" in all_categories,
        "week2": "memory_allocation" in all_categories,
        "week3": "file_allocation" in all_categories,
        "week4": "deadlocks" in all_categories,
        "week5": "page_replacement" in all_categories,
        "week6": "disk_scheduling" in all_categories
    }

    total_sims = db.query(SimulationRun).count()
    total_jobs = db.query(ProcessingJob).count()

    return OverviewStatsResponse(
        total_files=storage_info["total_files"],
        total_folders=storage_info["total_folders"],
        storage_used_bytes=storage_info["used_bytes"],
        storage_quota_bytes=storage_info["quota_bytes"],
        storage_percentage=storage_info["used_percentage"],
        total_simulations=total_sims,
        total_processing_jobs=total_jobs,
        syllabus_progress=syllabus_progress,
        recent_files=recent_files,
        recent_jobs=recent_jobs,
        recent_simulations=recent_sims
    )
