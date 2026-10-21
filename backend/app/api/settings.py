import json
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.database.models import AppSetting, FileRecord, Folder
from app.services.storage_service import create_text_file

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    rows = db.query(AppSetting).all()
    data = {r.key: json.loads(r.value) for r in rows}

    # Ensure default quota
    if "storage_quota_bytes" not in data:
        data["storage_quota_bytes"] = settings.DEFAULT_STORAGE_QUOTA_BYTES

    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "storage_quota_bytes": data.get("storage_quota_bytes", settings.DEFAULT_STORAGE_QUOTA_BYTES),
        "disk_cylinders": data.get("disk_cylinders", settings.DEFAULT_DISK_CYLINDERS),
        "disk_blocks": data.get("disk_blocks", settings.DEFAULT_DISK_BLOCKS),
        "all_settings": data
    }

@router.put("")
def update_settings(payload: Dict[str, Any], db: Session = Depends(get_db)):
    for k, v in payload.items():
        row = db.query(AppSetting).filter(AppSetting.key == k).first()
        if not row:
            row = AppSetting(key=k, value=json.dumps(v))
            db.add(row)
        else:
            row.value = json.dumps(v)
    db.commit()
    return {"message": "Settings updated successfully", "updated_keys": list(payload.keys())}

@router.post("/seed-samples")
def seed_sample_files(db: Session = Depends(get_db)):
    # Check if samples already exist
    existing = db.query(FileRecord).filter(FileRecord.name == "sample_processes.txt").first()
    if existing:
        return {"message": "Sample files already exist."}

    # Create a demo folder
    demo_folder = Folder(name="OS_Lab_Materials")
    db.add(demo_folder)
    db.commit()
    db.refresh(demo_folder)

    # 1. Text sample
    create_text_file(
        db=db,
        name="sample_notes.txt",
        content=(
            "Operating Systems Lab - MiniOS Platform\n"
            "This application bridges real filesystem processing with simulated OS core algorithms.\n"
            "Weeks covered: CPU scheduling, Memory allocation, File allocation, Deadlocks, Page replacement, and Disk scheduling."
        ),
        folder_id=demo_folder.id
    )

    # 2. CSV sample
    create_text_file(
        db=db,
        name="processes_data.csv",
        content=(
            "pid,arrival_time,burst_time,priority\n"
            "P1,0,8,3\n"
            "P2,1,4,1\n"
            "P3,2,9,4\n"
            "P4,3,5,2\n"
        ),
        folder_id=demo_folder.id
    )

    # 3. JSON sample
    create_text_file(
        db=db,
        name="system_config.json",
        content=json.dumps({
            "os_name": "MiniOS",
            "kernel_version": "5.15.0-generic",
            "architecture": "x86_64",
            "scheduler": "Round Robin",
            "memory_paging": "LRU",
            "disk_algorithm": "LOOK"
        }, indent=2),
        folder_id=demo_folder.id
    )

    return {"message": "Sample files created in folder 'OS_Lab_Materials'"}
