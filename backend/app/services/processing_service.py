import csv
import difflib
import hashlib
import io
import json
import re
import time
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional
from PIL import Image
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.core.config import settings, PROCESSED_DIR, UPLOADS_DIR
from app.database.models import FileRecord, ProcessingJob
from app.schemas.processing import (
    TextAnalysisResponse,
    CsvAnalysisResponse,
    JsonValidationResponse,
    HashResultResponse,
    DuplicateDetectorResponse,
    DuplicateGroup,
    FileDiffResponse,
    DiffLine,
    ImageMetadataResponse,
    ProcessingJobResponse
)

def log_processing_job(
    db: Session,
    tool_name: str,
    input_file_ids: List[str],
    status: str,
    duration_ms: float,
    details: Dict[str, Any],
    output_file_id: Optional[str] = None,
    error_message: Optional[str] = None
) -> ProcessingJob:
    job = ProcessingJob(
        tool_name=tool_name,
        status=status,
        input_file_ids=json.dumps(input_file_ids),
        output_file_id=output_file_id,
        duration_ms=round(duration_ms, 2),
        details=json.dumps(details),
        error_message=error_message,
        created_at=datetime.now(timezone.utc)
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

def analyze_text(file_path: Path) -> TextAnalysisResponse:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        text = f.read()

    lines = text.splitlines()
    line_count = len(lines)
    char_with_spaces = len(text)
    char_without_spaces = len(re.sub(r"\s+", "", text))

    words = re.findall(r"\b[A-Za-z0-9_-]+\b", text.lower())
    word_count = len(words)

    # Filter out single-character punctuation/stop words for top frequent words
    filtered_words = [w for w in words if len(w) > 2]
    counts = Counter(filtered_words).most_common(10)
    frequent_words = [{"word": w, "count": c} for w, c in counts]

    avg_word_length = round(sum(len(w) for w in words) / word_count, 2) if word_count > 0 else 0.0
    reading_time = round(word_count / 200.0, 2)  # assuming 200 WPM

    preview = text[:300] + ("..." if len(text) > 300 else "")

    return TextAnalysisResponse(
        line_count=line_count,
        word_count=word_count,
        char_count_with_spaces=char_with_spaces,
        char_count_without_spaces=char_without_spaces,
        frequent_words=frequent_words,
        avg_word_length=avg_word_length,
        reading_time_minutes=reading_time,
        readability_preview=preview
    )

def analyze_csv(file_path: Path) -> CsvAnalysisResponse:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        # Detect delimiter
        sample = f.read(4096)
        f.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample)
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ","

        reader = csv.reader(f, delimiter=delimiter)
        try:
            headers = next(reader)
        except StopIteration:
            return CsvAnalysisResponse(
                row_count=0,
                column_count=0,
                columns=[],
                preview_rows=[],
                column_stats={}
            )

        headers = [h.strip() or f"col_{i}" for i, h in enumerate(headers)]
        rows = []
        for r in reader:
            if r:
                rows.append(r)

    row_count = len(rows)
    column_count = len(headers)

    preview_rows = []
    for r in rows[:10]:
        row_dict = {}
        for i, col in enumerate(headers):
            row_dict[col] = r[i] if i < len(r) else ""
        preview_rows.append(row_dict)

    # Calculate column statistics
    col_stats = {}
    for i, col in enumerate(headers):
        vals = [r[i] for r in rows if i < len(r) and r[i] != ""]
        numeric_vals = []
        for v in vals:
            try:
                numeric_vals.append(float(v))
            except ValueError:
                pass

        if len(numeric_vals) == len(vals) and len(vals) > 0:
            col_stats[col] = {
                "type": "numeric",
                "non_null_count": len(vals),
                "min": min(numeric_vals),
                "max": max(numeric_vals),
                "mean": round(sum(numeric_vals) / len(numeric_vals), 2)
            }
        else:
            col_stats[col] = {
                "type": "text",
                "non_null_count": len(vals),
                "unique_count": len(set(vals))
            }

    return CsvAnalysisResponse(
        row_count=row_count,
        column_count=column_count,
        columns=headers,
        preview_rows=preview_rows,
        column_stats=col_stats
    )

def validate_json_content(file_path: Path) -> JsonValidationResponse:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    try:
        parsed = json.loads(content)
        formatted = json.dumps(parsed, indent=2)
        key_count = len(parsed) if isinstance(parsed, (dict, list)) else 1
        data_type = type(parsed).__name__

        return JsonValidationResponse(
            is_valid=True,
            formatted_preview=formatted[:2000] + ("\n...(truncated)" if len(formatted) > 2000 else ""),
            key_count=key_count,
            data_type=data_type,
            error_message=None
        )
    except json.JSONDecodeError as e:
        return JsonValidationResponse(
            is_valid=False,
            formatted_preview=content[:1000],
            key_count=0,
            data_type="invalid",
            error_message=str(e),
            line_number=e.lineno,
            column_number=e.colno
        )

def generate_hashes(file_record: FileRecord, expected_hash: Optional[str] = None) -> HashResultResponse:
    physical_path = settings.BASE_DIR / file_record.storage_path
    sha256 = hashlib.sha256()
    md5 = hashlib.md5()

    with open(physical_path, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
            md5.update(chunk)

    hex_sha256 = sha256.hexdigest()
    hex_md5 = md5.hexdigest()

    matches = None
    if expected_hash:
        matches = (hex_sha256.lower() == expected_hash.strip().lower())

    return HashResultResponse(
        file_id=file_record.id,
        filename=file_record.name,
        sha256=hex_sha256,
        md5=hex_md5,
        matches_expected=matches
    )

def detect_duplicates(db: Session) -> DuplicateDetectorResponse:
    all_files = db.query(FileRecord).all()
    groups: Dict[str, List[FileRecord]] = {}

    for f in all_files:
        if not f.hash_sha256:
            p = settings.BASE_DIR / f.storage_path
            if p.exists():
                f.hash_sha256 = hashlib.sha256(p.read_bytes()).hexdigest()
        if f.hash_sha256:
            groups.setdefault(f.hash_sha256, []).append(f)

    dup_groups = []
    wasted = 0

    for sha, flist in groups.items():
        if len(flist) > 1:
            size = flist[0].size_bytes
            wasted += size * (len(flist) - 1)
            dup_groups.append(DuplicateGroup(
                sha256=sha,
                size_bytes=size,
                files=[
                    {
                        "id": item.id,
                        "name": item.name,
                        "created_at": item.created_at.isoformat(),
                        "size_bytes": item.size_bytes
                    }
                    for item in flist
                ]
            ))

    return DuplicateDetectorResponse(
        total_scanned=len(all_files),
        duplicate_groups=dup_groups,
        wasted_bytes=wasted
    )

def compare_text_files(file1: FileRecord, file2: FileRecord) -> FileDiffResponse:
    path1 = settings.BASE_DIR / file1.storage_path
    path2 = settings.BASE_DIR / file2.storage_path

    with open(path1, "r", encoding="utf-8", errors="replace") as f1:
        lines1 = f1.readlines()
    with open(path2, "r", encoding="utf-8", errors="replace") as f2:
        lines2 = f2.readlines()

    diff = list(difflib.unified_diff(lines1, lines2, fromfile=file1.name, tofile=file2.name, lineterm=""))

    diff_lines: List[DiffLine] = []
    added = 0
    removed = 0
    old_line_idx = 1
    new_line_idx = 1

    for line in diff:
        if line.startswith("---") or line.startswith("+++"):
            diff_lines.append(DiffLine(type="header", text=line))
        elif line.startswith("@@"):
            diff_lines.append(DiffLine(type="header", text=line))
        elif line.startswith("+"):
            added += 1
            diff_lines.append(DiffLine(type="add", text=line[1:], line_num_new=new_line_idx))
            new_line_idx += 1
        elif line.startswith("-"):
            removed += 1
            diff_lines.append(DiffLine(type="remove", text=line[1:], line_num_old=old_line_idx))
            old_line_idx += 1
        else:
            diff_lines.append(DiffLine(type="same", text=line[1:] if line.startswith(" ") else line, line_num_old=old_line_idx, line_num_new=new_line_idx))
            old_line_idx += 1
            new_line_idx += 1

    identical = (added == 0 and removed == 0)

    return FileDiffResponse(
        file1_name=file1.name,
        file2_name=file2.name,
        identical=identical,
        diff_lines=diff_lines,
        total_added=added,
        total_removed=removed
    )

def extract_image_metadata(file_record: FileRecord) -> ImageMetadataResponse:
    physical_path = settings.BASE_DIR / file_record.storage_path
    try:
        with Image.open(physical_path) as img:
            w, h = img.size
            ratio = f"{round(w / h, 2)}:1" if h != 0 else "N/A"
            return ImageMetadataResponse(
                format=img.format or "Unknown",
                width=w,
                height=h,
                mode=img.mode,
                aspect_ratio=ratio,
                size_bytes=file_record.size_bytes
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse image file: {str(e)}")

def compress_files_to_zip(db: Session, files: List[FileRecord], archive_name: str = "archive.zip", folder_id: Optional[str] = None) -> FileRecord:
    import uuid
    if not archive_name.lower().endswith(".zip"):
        archive_name += ".zip"

    out_id = str(uuid.uuid4())
    storage_name = f"{out_id}_{archive_name}"
    zip_physical_path = UPLOADS_DIR / storage_name

    with zipfile.ZipFile(zip_physical_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for f in files:
            p = settings.BASE_DIR / f.storage_path
            if p.exists():
                # Safe archive name (basename only)
                arcname = Path(f.name).name
                zipf.write(p, arcname=arcname)

    size = zip_physical_path.stat().st_size
    file_hash = hashlib.sha256(zip_physical_path.read_bytes()).hexdigest()

    rec = FileRecord(
        id=out_id,
        name=archive_name,
        original_name=archive_name,
        folder_id=folder_id,
        file_type="archive",
        mime_type="application/zip",
        size_bytes=size,
        storage_path=str(zip_physical_path.relative_to(settings.BASE_DIR)),
        hash_sha256=file_hash
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

def decompress_zip_archive(db: Session, zip_record: FileRecord, target_folder_id: Optional[str] = None) -> List[FileRecord]:
    import uuid
    physical_path = settings.BASE_DIR / zip_record.storage_path
    if not zipfile.is_zipfile(physical_path):
        raise HTTPException(status_code=400, detail="Target file is not a valid ZIP archive.")

    extracted_records: List[FileRecord] = []

    with zipfile.ZipFile(physical_path, "r") as zipf:
        for member in zipf.infolist():
            if member.is_dir():
                continue

            # Prevent Zip Slip / Path Traversal
            member_path = Path(member.filename)
            safe_name = member_path.name
            if not safe_name or ".." in member.filename:
                continue

            extracted_id = str(uuid.uuid4())
            storage_filename = f"{extracted_id}_{safe_name}"
            dest_file = UPLOADS_DIR / storage_filename

            # Read content and write
            with zipf.open(member) as source, open(dest_file, "wb") as target:
                target.write(source.read())

            size = dest_file.stat().st_size
            file_hash = hashlib.sha256(dest_file.read_bytes()).hexdigest()

            from app.services.storage_service import detect_file_type
            import mimetypes

            file_type = detect_file_type(safe_name)
            mime_type = mimetypes.guess_type(safe_name)[0] or "application/octet-stream"

            rec = FileRecord(
                id=extracted_id,
                name=safe_name,
                original_name=safe_name,
                folder_id=target_folder_id,
                file_type=file_type,
                mime_type=mime_type,
                size_bytes=size,
                storage_path=str(dest_file.relative_to(settings.BASE_DIR)),
                hash_sha256=file_hash
            )
            db.add(rec)
            extracted_records.append(rec)

    db.commit()
    for r in extracted_records:
        db.refresh(r)
    return extracted_records
