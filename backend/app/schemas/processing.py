from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class ProcessingJobResponse(BaseModel):
    id: str
    tool_name: str
    status: str
    input_file_ids: List[str]
    output_file_id: Optional[str] = None
    duration_ms: float
    details: Dict[str, Any]
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TextAnalysisResponse(BaseModel):
    line_count: int
    word_count: int
    char_count_with_spaces: int
    char_count_without_spaces: int
    frequent_words: List[Dict[str, Any]]
    avg_word_length: float
    reading_time_minutes: float
    readability_preview: str

class CsvAnalysisResponse(BaseModel):
    row_count: int
    column_count: int
    columns: List[str]
    preview_rows: List[Dict[str, Any]]
    column_stats: Dict[str, Any]

class JsonValidationResponse(BaseModel):
    is_valid: bool
    formatted_preview: Optional[str] = None
    key_count: int = 0
    data_type: str = "unknown"
    error_message: Optional[str] = None
    line_number: Optional[int] = None
    column_number: Optional[int] = None

class HashVerifyRequest(BaseModel):
    expected_hash: Optional[str] = None

class HashResultResponse(BaseModel):
    file_id: str
    filename: str
    sha256: str
    md5: str
    matches_expected: Optional[bool] = None

class DuplicateGroup(BaseModel):
    sha256: str
    size_bytes: int
    files: List[Dict[str, Any]]

class DuplicateDetectorResponse(BaseModel):
    total_scanned: int
    duplicate_groups: List[DuplicateGroup]
    wasted_bytes: int

class FileDiffRequest(BaseModel):
    file1_id: str
    file2_id: str

class DiffLine(BaseModel):
    type: str  # 'same', 'add', 'remove', 'header'
    text: str
    line_num_old: Optional[int] = None
    line_num_new: Optional[int] = None

class FileDiffResponse(BaseModel):
    file1_name: str
    file2_name: str
    identical: bool
    diff_lines: List[DiffLine]
    total_added: int
    total_removed: int

class ImageMetadataResponse(BaseModel):
    format: str
    width: int
    height: int
    mode: str
    aspect_ratio: str
    size_bytes: int

class CompressRequest(BaseModel):
    file_ids: List[str]
    archive_name: str = "archive.zip"
    folder_id: Optional[str] = None

class DecompressRequest(BaseModel):
    file_id: str
    target_folder_id: Optional[str] = None

class BatchProcessRequest(BaseModel):
    file_ids: List[str]
    operation: str  # 'hash', 'word_count', 'compress', 'delete'
