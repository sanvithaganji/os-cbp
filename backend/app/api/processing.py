import json
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.database.models import FileRecord, ProcessingJob
from app.schemas.processing import (
    TextAnalysisResponse,
    CsvAnalysisResponse,
    JsonValidationResponse,
    HashVerifyRequest,
    HashResultResponse,
    DuplicateDetectorResponse,
    FileDiffRequest,
    FileDiffResponse,
    ImageMetadataResponse,
    CompressRequest,
    DecompressRequest,
    BatchProcessRequest,
    ProcessingJobResponse
)
from app.services.processing_service import (
    analyze_text,
    analyze_csv,
    validate_json_content,
    generate_hashes,
    detect_duplicates,
    compare_text_files,
    extract_image_metadata,
    compress_files_to_zip,
    decompress_zip_archive,
    log_processing_job
)
from app.services.storage_service import delete_file_record

router = APIRouter(prefix="/processing", tags=["processing"])

@router.get("/jobs", response_model=List[ProcessingJobResponse])
def get_jobs(limit: int = 50, db: Session = Depends(get_db)):
    jobs = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).limit(limit).all()
    results = []
    for j in jobs:
        results.append(ProcessingJobResponse(
            id=j.id,
            tool_name=j.tool_name,
            status=j.status,
            input_file_ids=json.loads(j.input_file_ids or "[]"),
            output_file_id=j.output_file_id,
            duration_ms=j.duration_ms,
            details=json.loads(j.details or "{}"),
            error_message=j.error_message,
            created_at=j.created_at
        ))
    return results

@router.post("/text-analyze/{file_id}", response_model=TextAnalysisResponse)
def run_text_analysis(file_id: str, db: Session = Depends(get_db)):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")

    t0 = time.time()
    try:
        path = settings.BASE_DIR / rec.storage_path
        res = analyze_text(path)
        dur = (time.time() - t0) * 1000.0
        log_processing_job(db, "Text Analyzer", [file_id], "completed", dur, res.model_dump())
        return res
    except Exception as e:
        dur = (time.time() - t0) * 1000.0
        log_processing_job(db, "Text Analyzer", [file_id], "failed", dur, {}, error_message=str(e))
        raise HTTPException(status_code=400, detail=f"Text analysis failed: {str(e)}")

@router.post("/csv-analyze/{file_id}", response_model=CsvAnalysisResponse)
def run_csv_analysis(file_id: str, db: Session = Depends(get_db)):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")

    t0 = time.time()
    try:
        path = settings.BASE_DIR / rec.storage_path
        res = analyze_csv(path)
        dur = (time.time() - t0) * 1000.0
        log_processing_job(db, "CSV Analyzer", [file_id], "completed", dur, res.model_dump())
        return res
    except Exception as e:
        dur = (time.time() - t0) * 1000.0
        log_processing_job(db, "CSV Analyzer", [file_id], "failed", dur, {}, error_message=str(e))
        raise HTTPException(status_code=400, detail=f"CSV analysis failed: {str(e)}")

@router.post("/json-validate/{file_id}", response_model=JsonValidationResponse)
def run_json_validate(file_id: str, db: Session = Depends(get_db)):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")

    t0 = time.time()
    try:
        path = settings.BASE_DIR / rec.storage_path
        res = validate_json_content(path)
        dur = (time.time() - t0) * 1000.0
        log_processing_job(db, "JSON Validator", [file_id], "completed" if res.is_valid else "warning", dur, res.model_dump())
        return res
    except Exception as e:
        dur = (time.time() - t0) * 1000.0
        log_processing_job(db, "JSON Validator", [file_id], "failed", dur, {}, error_message=str(e))
        raise HTTPException(status_code=400, detail=f"JSON validation error: {str(e)}")

@router.post("/hash/{file_id}", response_model=HashResultResponse)
def run_hash_generator(file_id: str, payload: Optional[HashVerifyRequest] = None, db: Session = Depends(get_db)):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")

    t0 = time.time()
    expected = payload.expected_hash if payload else None
    res = generate_hashes(rec, expected)
    dur = (time.time() - t0) * 1000.0
    log_processing_job(db, "Hash Generator", [file_id], "completed", dur, res.model_dump())
    return res

@router.get("/duplicates", response_model=DuplicateDetectorResponse)
def run_duplicate_scan(db: Session = Depends(get_db)):
    t0 = time.time()
    res = detect_duplicates(db)
    dur = (time.time() - t0) * 1000.0
    log_processing_job(db, "Duplicate Detector", [], "completed", dur, {"groups_count": len(res.duplicate_groups), "wasted_bytes": res.wasted_bytes})
    return res

@router.post("/diff", response_model=FileDiffResponse)
def run_diff(payload: FileDiffRequest, db: Session = Depends(get_db)):
    f1 = db.query(FileRecord).filter(FileRecord.id == payload.file1_id).first()
    f2 = db.query(FileRecord).filter(FileRecord.id == payload.file2_id).first()
    if not f1 or not f2:
        raise HTTPException(status_code=404, detail="One or both files for diff not found")

    t0 = time.time()
    res = compare_text_files(f1, f2)
    dur = (time.time() - t0) * 1000.0
    log_processing_job(db, "File Comparison", [f1.id, f2.id], "completed", dur, {"identical": res.identical, "added": res.total_added, "removed": res.total_removed})
    return res

@router.post("/image-metadata/{file_id}", response_model=ImageMetadataResponse)
def run_image_metadata(file_id: str, db: Session = Depends(get_db)):
    rec = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")

    t0 = time.time()
    res = extract_image_metadata(rec)
    dur = (time.time() - t0) * 1000.0
    log_processing_job(db, "Image Metadata", [file_id], "completed", dur, res.model_dump())
    return res

@router.post("/compress")
def run_compress(payload: CompressRequest, db: Session = Depends(get_db)):
    files = db.query(FileRecord).filter(FileRecord.id.in_(payload.file_ids)).all()
    if not files:
        raise HTTPException(status_code=400, detail="No valid files selected for compression.")

    t0 = time.time()
    zip_rec = compress_files_to_zip(db, files, archive_name=payload.archive_name, folder_id=payload.folder_id)
    dur = (time.time() - t0) * 1000.0
    log_processing_job(db, "File Compressor (ZIP)", payload.file_ids, "completed", dur, {"archive_name": zip_rec.name, "size_bytes": zip_rec.size_bytes}, output_file_id=zip_rec.id)
    return {
        "message": f"Successfully created archive '{zip_rec.name}'",
        "archive_file": {
            "id": zip_rec.id,
            "name": zip_rec.name,
            "size_bytes": zip_rec.size_bytes
        }
    }

@router.post("/decompress")
def run_decompress(payload: DecompressRequest, db: Session = Depends(get_db)):
    rec = db.query(FileRecord).filter(FileRecord.id == payload.file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Archive file not found")

    t0 = time.time()
    extracted = decompress_zip_archive(db, rec, target_folder_id=payload.target_folder_id)
    dur = (time.time() - t0) * 1000.0
    log_processing_job(db, "ZIP Decompressor", [payload.file_id], "completed", dur, {"extracted_count": len(extracted), "files": [e.name for e in extracted]})
    return {
        "message": f"Successfully extracted {len(extracted)} files from '{rec.name}'",
        "extracted_files": [{"id": e.id, "name": e.name, "size_bytes": e.size_bytes} for e in extracted]
    }

@router.post("/batch")
def run_batch_processing(payload: BatchProcessRequest, db: Session = Depends(get_db)):
    files = db.query(FileRecord).filter(FileRecord.id.in_(payload.file_ids)).all()
    if not files:
        raise HTTPException(status_code=400, detail="No valid files selected for batch operation.")

    t0 = time.time()
    op = payload.operation.lower()
    results = []

    if op == "hash":
        for f in files:
            h = generate_hashes(f)
            results.append({"id": f.id, "name": f.name, "sha256": h.sha256})
    elif op == "word_count":
        for f in files:
            p = settings.BASE_DIR / f.storage_path
            try:
                txt = analyze_text(p)
                results.append({"id": f.id, "name": f.name, "words": txt.word_count, "lines": txt.line_count})
            except Exception as e:
                results.append({"id": f.id, "name": f.name, "error": str(e)})
    elif op == "compress":
        zip_rec = compress_files_to_zip(db, files, archive_name=f"batch_{int(time.time())}.zip")
        results.append({"archive_id": zip_rec.id, "archive_name": zip_rec.name, "size_bytes": zip_rec.size_bytes})
    elif op == "delete":
        count = 0
        for f in files:
            delete_file_record(db, f)
            count += 1
        results.append({"deleted_count": count})
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported batch operation '{op}'.")

    dur = (time.time() - t0) * 1000.0
    log_processing_job(db, f"Batch: {op.upper()}", payload.file_ids, "completed", dur, {"operation": op, "count": len(files), "results": results})
    return {"operation": op, "processed_count": len(files), "results": results}
