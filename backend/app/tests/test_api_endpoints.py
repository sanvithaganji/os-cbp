import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import init_db

# Initialize database tables for tests
init_db()

client = TestClient(app)

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["app"] == "MiniOS — File Storage & Processing Lab"

def test_overview_stats():
    response = client.get("/api/v1/overview/stats")
    assert response.status_code == 200
    data = response.json()
    assert "storage_quota_bytes" in data
    assert "syllabus_progress" in data

def test_file_create_and_delete():
    # 1. Create text file
    create_res = client.post("/api/v1/files/create-text", json={
        "name": "test_script.py",
        "content": "print('hello from minios')"
    })
    assert create_res.status_code == 200
    file_data = create_res.json()
    file_id = file_data["id"]

    # 2. Get file content
    content_res = client.get(f"/api/v1/files/{file_id}/content")
    assert content_res.status_code == 200
    assert "print('hello from minios')" in content_res.json()["content"]

    # 3. Update file content
    update_res = client.put(f"/api/v1/files/{file_id}/content", json={
        "content": "print('updated code')"
    })
    assert update_res.status_code == 200

    # 4. Text analyze
    analyze_res = client.post(f"/api/v1/processing/text-analyze/{file_id}")
    assert analyze_res.status_code == 200
    assert analyze_res.json()["word_count"] > 0

    # 5. Delete file
    del_res = client.delete(f"/api/v1/files/{file_id}")
    assert del_res.status_code == 200

def test_simulation_api_cpu():
    payload = {
        "algorithm": "FCFS",
        "processes": [
            {"pid": "P1", "arrival_time": 0, "burst_time": 3, "priority": 1},
            {"pid": "P2", "arrival_time": 2, "burst_time": 4, "priority": 1}
        ]
    }
    res = client.post("/api/v1/simulations/cpu", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["algorithm"] == "FCFS"
    assert len(data["processes"]) == 2
    assert len(data["gantt_chart"]) >= 2

def test_report_generation_api():
    payload = {
        "experiment_no": 1,
        "title": "CPU Scheduling Analysis",
        "category": "cpu_scheduling",
        "algorithm_name": "FCFS",
        "aim": "To study and simulate First-Come First-Served CPU scheduling.",
        "description": "FCFS executes processes strictly in arrival order.",
        "input_summary": {"processes": 2},
        "result_summary": {"avg_waiting_time": 1.0, "avg_turnaround_time": 4.5},
        "conclusion": "FCFS has low scheduling overhead but suffers from the convoy effect."
    }
    res = client.post("/api/v1/reports", json=payload)
    assert res.status_code == 200
    rep = res.json()
    assert rep["experiment_no"] == 1
    report_id = rep["id"]

    # Get report
    get_res = client.get(f"/api/v1/reports/{report_id}")
    assert get_res.status_code == 200

    # Download report markdown
    dl_res = client.get(f"/api/v1/reports/{report_id}/download")
    assert dl_res.status_code == 200
    assert "# Operating Systems Lab Report" in dl_res.text
