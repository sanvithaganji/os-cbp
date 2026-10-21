import tempfile
from pathlib import Path
from app.services.processing_service import (
    analyze_text,
    analyze_csv,
    validate_json_content
)

def test_text_analysis():
    with tempfile.NamedTemporaryFile("w+", suffix=".txt", delete=False) as f:
        f.write("Operating systems allocate memory and schedule CPU tasks.\nOperating systems manage files.")
        temp_path = Path(f.name)

    try:
        res = analyze_text(temp_path)
        assert res.line_count == 2
        assert res.word_count == 12
        assert any(w["word"] == "operating" and w["count"] == 2 for w in res.frequent_words)
    finally:
        temp_path.unlink()

def test_csv_analysis():
    with tempfile.NamedTemporaryFile("w+", suffix=".csv", delete=False) as f:
        f.write("id,burst_time\nP1,5\nP2,10\nP3,15\n")
        temp_path = Path(f.name)

    try:
        res = analyze_csv(temp_path)
        assert res.row_count == 3
        assert res.column_count == 2
        assert "burst_time" in res.columns
        assert res.column_stats["burst_time"]["min"] == 5.0
        assert res.column_stats["burst_time"]["max"] == 15.0
        assert res.column_stats["burst_time"]["mean"] == 10.0
    finally:
        temp_path.unlink()

def test_json_validation():
    # Valid JSON
    with tempfile.NamedTemporaryFile("w+", suffix=".json", delete=False) as f:
        f.write('{"name": "MiniOS", "version": 1.0}')
        temp_valid = Path(f.name)

    # Invalid JSON
    with tempfile.NamedTemporaryFile("w+", suffix=".json", delete=False) as f:
        f.write('{"name": "MiniOS", "version": }')
        temp_invalid = Path(f.name)

    try:
        valid_res = validate_json_content(temp_valid)
        assert valid_res.is_valid is True
        assert valid_res.key_count == 2

        invalid_res = validate_json_content(temp_invalid)
        assert invalid_res.is_valid is False
        assert invalid_res.line_number is not None
    finally:
        temp_valid.unlink()
        temp_invalid.unlink()
