from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response
from fastapi.responses import FileResponse as FastApiFileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.core.config import settings
from app.database.session import get_db
from app.database.models import FileRecord, Folder
from app.schemas.files import (
    FileResponse,
    FileCreateText,
    FileUpdate,
    FileMoveRequest,
    FileCopyRequest,
    FileContentResponse,
    FileContentUpdateRequest,
    StorageStatsResponse
)
from app.services.storage_service import (
    save_uploaded_file,
    create_text_file,
    update_text_file_content,
    delete_file_record,
    copy_file_record,
    get_storage_usage
)

router = APIRouter(prefix="/files", tags=["files"])

@router.get("/storage-stats", response_model=StorageStatsResponse)
def get_stats(db: Session = Depends(get_db)):
    return get_storage_usage(db)

@router.get("", response_model=List[FileResponse])
def list_files(
    folder_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),  # 'name', 'size_bytes', 'created_at', 'file_type'
    sort_order: str = Query("desc"),     # 'asc', 'desc'
    db: Session = Depends(get_db)
):
    query = db.query(FileRecord)

    if folder_id is not None:
        if folder_id == "root":
            query = query.filter(FileRecord.folder_id == None)
        else:
            query = query.filter(FileRecord.folder_id == folder_id)

    if search:
        query = query.filter(FileRecord.name.ilike(f"%{search}%"))

    if file_type:
        query = query.filter(FileRecord.file_type == file_type)

    # Sorting
    sort_column = getattr(FileRecord, sort_by, FileRecord.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    return query.all()

@router.post("/upload", response_model=List[FileResponse])
async def upload_files(
    files: List[UploadFile] = File(...),
    folder_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    saved_records = []
    if folder_id == "root":
        folder_id = None

    for upload_file in files:
        rec = await save_uploaded_file(db, upload_file, folder_id=folder_id)
        saved_records.append(rec)

    return saved_records

@router.post("/create-text", response_model=FileResponse)
def create_text(
    payload: FileCreateText,
    db: Session = Depends(get_db)
):
    folder_id = None if payload.folder_id == "root" else payload.folder_id
    return create_text_file(db, name=payload.name, content=payload.content, folder_id=folder_id)

@router.get("/{file_id}", response_model=FileResponse)
def get_file(file_id: str, db: Session = Depends(get_db)):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")
    return rec

@router.get("/{file_id}/content", response_model=FileContentResponse)
def get_file_content(file_id: str, db: Session = Depends(get_db)):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")

    physical_path = settings.BASE_DIR / rec.storage_path
    if not physical_path.exists():
        raise HTTPException(status_code=404, detail="Physical file missing on disk")

    is_text = rec.file_type in ["text", "csv", "json"] or rec.mime_type.startswith("text/")

    if is_text:
        try:
            with open(physical_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read(500000)  # up to 500KB
        except Exception:
            content = "[Binary or unreadable content]"
    else:
        content = f"Preview not available for {rec.file_type} files. Please download to view."

    return FileContentResponse(
        id=rec.id,
        name=rec.name,
        content=content,
        size_bytes=rec.size_bytes,
        file_type=rec.file_type,
        is_text=is_text
    )

@router.put("/{file_id}/content", response_model=FileResponse)
def update_content(
    file_id: str,
    payload: FileContentUpdateRequest,
    db: Session = Depends(get_db)
):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")
    return update_text_file_content(db, rec, payload.content)

@router.get("/{file_id}/download")
def download_file(file_id: str, db: Session = Depends(get_db)):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")

    physical_path = settings.BASE_DIR / rec.storage_path
    if not physical_path.exists():
        raise HTTPException(status_code=404, detail="Physical file missing on disk")

    return FastApiFileResponse(
        path=str(physical_path),
        filename=rec.name,
        media_type=rec.mime_type
    )

@router.put("/{file_id}", response_model=FileResponse)
def update_file_meta(
    file_id: str,
    payload: FileUpdate,
    db: Session = Depends(get_db)
):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")

    if payload.name:
        rec.name = payload.name
    if payload.folder_id is not None:
        rec.folder_id = None if payload.folder_id == "root" else payload.folder_id

    db.commit()
    db.refresh(rec)
    return rec

@router.post("/{file_id}/move", response_model=FileResponse)
def move_file(
    file_id: str,
    payload: FileMoveRequest,
    db: Session = Depends(get_db)
):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")

    rec.folder_id = None if payload.folder_id == "root" else payload.folder_id
    db.commit()
    db.refresh(rec)
    return rec

@router.post("/{file_id}/copy", response_model=FileResponse)
def copy_file(
    file_id: str,
    payload: FileCopyRequest,
    db: Session = Depends(get_db)
):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")

    target_folder = None if payload.target_folder_id == "root" else payload.target_folder_id
    return copy_file_record(db, rec, target_folder_id=target_folder, new_name=payload.new_name)

@router.delete("/{file_id}")
def delete_file(file_id: str, db: Session = Depends(get_db)):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")
    delete_file_record(db, rec)
    return {"message": f"File '{rec.name}' deleted successfully", "id": file_id}
