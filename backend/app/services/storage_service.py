import hashlib
import mimetypes
import shutil
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException

from app.core.config import settings, UPLOADS_DIR
from app.database.models import FileRecord, Folder, AppSetting

def calculate_sha256(file_path: Path) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def get_storage_quota_bytes(db: Session) -> int:
    setting = db.query(AppSetting).filter(AppSetting.key == "storage_quota_bytes").first()
    if setting:
        try:
            return int(setting.value)
        except ValueError:
            pass
    return settings.DEFAULT_STORAGE_QUOTA_BYTES

def get_storage_usage(db: Session) -> Dict[str, Any]:
    total_files = db.query(FileRecord).count()
    total_folders = db.query(Folder).count()
    used_bytes = db.query(FileRecord).with_entities(FileRecord.size_bytes).all()
    used_sum = sum(f[0] for f in used_bytes)
    quota = get_storage_quota_bytes(db)
    pct = round((used_sum / quota * 100.0) if quota > 0 else 0.0, 2)
    avail = max(0, quota - used_sum)

    return {
        "total_files": total_files,
        "total_folders": total_folders,
        "used_bytes": used_sum,
        "quota_bytes": quota,
        "used_percentage": min(100.0, pct),
        "available_bytes": avail
    }

def detect_file_type(filename: str) -> str:
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext in ["txt", "md", "log", "py", "js", "ts", "html", "css", "c", "cpp", "java", "sh"]:
        return "text"
    if ext in ["csv"]:
        return "csv"
    if ext in ["json"]:
        return "json"
    if ext in ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"]:
        return "image"
    if ext in ["pdf"]:
        return "pdf"
    if ext in ["zip", "tar", "gz"]:
        return "archive"
    return ext or "unknown"

async def save_uploaded_file(db: Session, upload_file: UploadFile, folder_id: Optional[str] = None) -> FileRecord:
    # Check folder validity if provided
    if folder_id:
        folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Target folder not found")

    # Read content to check size
    content = await upload_file.read()
    file_size = len(content)

    if file_size > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB")

    # Check quota
    usage = get_storage_usage(db)
    if usage["used_bytes"] + file_size > usage["quota_bytes"]:
        raise HTTPException(
            status_code=400,
            detail=f"Storage quota exceeded. Available: {usage['available_bytes']} bytes, required: {file_size} bytes."
        )

    file_id = str(uuid.uuid4())
    original_name = Path(upload_file.filename or "uploaded_file").name
    safe_suffix = Path(original_name).suffix
    storage_filename = f"{file_id}{safe_suffix}"
    physical_path = UPLOADS_DIR / storage_filename

    # Write file securely
    with open(physical_path, "wb") as f:
        f.write(content)

    # Calculate SHA256
    file_hash = calculate_sha256(physical_path)
    file_type = detect_file_type(original_name)
    mime_type = upload_file.content_type or mimetypes.guess_type(original_name)[0] or "application/octet-stream"

    # Save metadata to DB
    record = FileRecord(
        id=file_id,
        name=original_name,
        original_name=original_name,
        folder_id=folder_id,
        file_type=file_type,
        mime_type=mime_type,
        size_bytes=file_size,
        storage_path=str(physical_path.relative_to(settings.BASE_DIR)),
        hash_sha256=file_hash
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def create_text_file(db: Session, name: str, content: str, folder_id: Optional[str] = None) -> FileRecord:
    encoded = content.encode("utf-8")
    file_size = len(encoded)

    usage = get_storage_usage(db)
    if usage["used_bytes"] + file_size > usage["quota_bytes"]:
        raise HTTPException(status_code=400, detail="Storage quota exceeded.")

    file_id = str(uuid.uuid4())
    safe_name = Path(name).name
    if not Path(safe_name).suffix:
        safe_name += ".txt"

    storage_filename = f"{file_id}_{safe_name}"
    physical_path = UPLOADS_DIR / storage_filename

    with open(physical_path, "wb") as f:
        f.write(encoded)

    file_hash = calculate_sha256(physical_path)
    file_type = detect_file_type(safe_name)
    mime_type = mimetypes.guess_type(safe_name)[0] or "text/plain"

    record = FileRecord(
        id=file_id,
        name=safe_name,
        original_name=safe_name,
        folder_id=folder_id,
        file_type=file_type,
        mime_type=mime_type,
        size_bytes=file_size,
        storage_path=str(physical_path.relative_to(settings.BASE_DIR)),
        hash_sha256=file_hash
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def update_text_file_content(db: Session, file_record: FileRecord, new_content: str) -> FileRecord:
    encoded = new_content.encode("utf-8")
    new_size = len(encoded)
    size_delta = new_size - file_record.size_bytes

    if size_delta > 0:
        usage = get_storage_usage(db)
        if usage["used_bytes"] + size_delta > usage["quota_bytes"]:
            raise HTTPException(status_code=400, detail="Storage quota exceeded.")

    physical_path = settings.BASE_DIR / file_record.storage_path
    with open(physical_path, "wb") as f:
        f.write(encoded)

    file_record.size_bytes = new_size
    file_record.hash_sha256 = calculate_sha256(physical_path)
    db.commit()
    db.refresh(file_record)
    return file_record

def delete_file_record(db: Session, file_record: FileRecord) -> None:
    physical_path = settings.BASE_DIR / file_record.storage_path
    if physical_path.exists():
        physical_path.unlink()
    db.delete(file_record)
    db.commit()

def copy_file_record(db: Session, file_record: FileRecord, target_folder_id: Optional[str] = None, new_name: Optional[str] = None) -> FileRecord:
    usage = get_storage_usage(db)
    if usage["used_bytes"] + file_record.size_bytes > usage["quota_bytes"]:
        raise HTTPException(status_code=400, detail="Storage quota exceeded.")

    new_id = str(uuid.uuid4())
    name = new_name or f"Copy of {file_record.name}"
    safe_suffix = Path(name).suffix or Path(file_record.name).suffix
    storage_filename = f"{new_id}{safe_suffix}"
    new_physical_path = UPLOADS_DIR / storage_filename

    src_path = settings.BASE_DIR / file_record.storage_path
    if src_path.exists():
        shutil.copy2(src_path, new_physical_path)
    else:
        new_physical_path.touch()

    copied_rec = FileRecord(
        id=new_id,
        name=name,
        original_name=name,
        folder_id=target_folder_id,
        file_type=file_record.file_type,
        mime_type=file_record.mime_type,
        size_bytes=file_record.size_bytes,
        storage_path=str(new_physical_path.relative_to(settings.BASE_DIR)),
        hash_sha256=file_record.hash_sha256
    )
    db.add(copied_rec)
    db.commit()
    db.refresh(copied_rec)
    return copied_rec
