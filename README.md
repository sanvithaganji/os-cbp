# MiniOS — File Storage & Processing Lab

A modern, full-stack operating systems lab platform combining a **local file storage and processing system** with **interactive, mathematically verified simulations** for every algorithm across a six-week Operating Systems laboratory syllabus.

Built for local execution on standard student laptops without paid APIs, external cloud subscriptions, or artificial mock data.

---

## 🌟 Key Features

### 1. 📁 Mini File Storage System
- **Real Local Storage:** Persists file metadata in SQLite and file contents in `storage/uploads/`.
- **File Management:** Upload single or multiple files with drag-and-drop support.
- **Hierarchical Folders:** Create, rename, delete, and nest folders with breadcrumb navigation.
- **In-App Text Editor:** Create and edit `.txt`, `.py`, `.json`, `.csv` files directly in the browser with instant saving.
- **File Previews:** Built-in preview modal for text, code, CSV tables, and images.
- **File Actions:** Rename, copy, move across folders, download, and delete.
- **Search & Filters:** Search by filename, filter by type (`text`, `csv`, `json`, `image`, `archive`), and sort by size, modification date, or name.
- **Quota Meter:** Enforces a simulated storage quota (default: 50 MB, configurable up to 500 MB).

### 2. ⚙️ File Processing Suite (10 Real Tools)
1. **Text Analyzer:** Word count, character count (with/without spaces), line count, top 10 frequent words, average word length, and estimated reading time.
2. **CSV Inspector:** Header extraction, row count, preview table, and column statistics (min, max, mean for numeric fields, unique counts for categorical fields).
3. **JSON Validator & Viewer:** Formatted syntax tree preview, root key counter, and line/column error reporter for invalid syntax.
4. **ZIP Compressor:** Packages multiple selected files into a single `.zip` archive on disk with safe filename sanitization.
5. **ZIP Extractor:** Safely extracts archive contents into the target folder with protection against zip-slip directory traversal vulnerabilities.
6. **Hash Generator:** Computes cryptographic SHA-256 and MD5 checksums, with an optional expected hash integrity checker.
7. **Duplicate Detector:** Scans stored files by SHA-256 hash, identifies duplicate clusters, and calculates wasted disk capacity.
8. **File Comparison Diff:** Side-by-side / unified diff visualizer highlighting line-by-line additions, removals, and unchanged code.
9. **Image Metadata Inspector:** Extracts image dimensions (width, height), aspect ratio, format, and color mode via Pillow.
10. **Batch Processing:** Runs batch operations (`hash`, `word_count`, `compress`, `delete`) across multiple files simultaneously.
11. **Processing History:** Maintains an audit log of all executed jobs with status, duration in milliseconds, and input/output references.

### 3. 🔬 OS Algorithm Lab Modules (All 15 Syllabus Algorithms)

| Week | Module | Implemented Algorithms | Visualizer & Metrics |
|---|---|---|---|
| **Week 1** | **CPU Scheduling** | **FCFS**, **SJF** (Non-Preemptive), **Round Robin** (Configurable Quantum), **Priority** (Configurable Order) | Interactive Gantt chart with idle intervals, step playback controller (Play/Pause/Speed), TAT = CT - AT and WT = TAT - BT mathematical verification, CPU utilization %, and throughput. |
| **Week 2** | **Memory Allocation** | **First Fit**, **Best Fit**, **Worst Fit** | Proportional block memory visualizer, process occupancy bar, internal fragmentation calculation, allocation failure tracker, and side-by-side comparison table. |
| **Week 3** | **File Allocation** | **Contiguous**, **Indexed**, **Linked List** | 64-sector interactive disk grid, pointer chains (`block -> next -> EOF`), index sector references with storage overhead, and external fragmentation demo. |
| **Week 4** | **Deadlocks** | **Banker's Algorithm (Avoidance)** & **Deadlock Detection** | Available, Allocation, Max, and Need matrices; Safe Sequence verification; Interactive Resource Request Tester (tests safety before granting); Work/Finish progression. |
| **Week 5** | **Page Replacement** | **FIFO**, **Optimal**, **LRU** | Frame-by-frame memory matrix, Hit/Fault badges, hit ratio, fault ratio, and Optimal future reference lookahead indicator. |
| **Week 6** | **Disk Scheduling** | **SCAN (Elevator)**, **C-SCAN (Circular)**, **LOOK** | 2D coordinate trajectory graph, cylinder boundaries, total seek movement in cylinders, average seek distance, and algorithm comparison table. |

### 4. 📑 Lab Report Generator
- Automatically compiles completed simulation runs into formal laboratory reports.
- Includes: Experiment Number, Title, Aim, Theoretical Background, Input Parameters, Computed Results, and Conclusions.
- Downloadable as formatted Markdown (`.md`) files or printable as PDF directly from the browser.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Python 3.10+, FastAPI, Uvicorn, SQLAlchemy, Pydantic V2
- **Database:** SQLite (`minios.db`)
- **File Processing & Image Parsing:** Standard Python libraries, Pillow, ZipFile, Hashlib, Difflib
- **Testing:** Pytest (100% pass rate across unit tests and API integration tests)

---

## 🚀 Installation and Local Execution

### Prerequisites
- **Node.js** (v18 or higher) and `npm`
- **Python** (v3.10 or higher)

### 1. Clone & Setup Repository
```bash
cd /Users/sanvithaganji/Desktop/os-cbp
```

### 2. Backend Setup
Create and activate a virtual environment, then install dependencies:
```bash
# macOS / Linux
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

Run backend automated tests:
```bash
PYTHONPATH=backend pytest backend/app/tests -v
```

Start the FastAPI server:
```bash
PYTHONPATH=backend uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Root: `http://127.0.0.1:8000`
- Interactive Swagger UI Documentation: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open your browser at:
```
http://127.0.0.1:5173
```

---

## 📂 Storage & Directory Structure

```
os-cbp/
├── backend/
│   ├── app/
│   │   ├── algorithms/
│   │   │   ├── cpu_scheduling/      # FCFS, SJF, RR, Priority
│   │   │   ├── memory_allocation/   # First Fit, Best Fit, Worst Fit
│   │   │   ├── file_allocation/     # Contiguous, Indexed, Linked
│   │   │   ├── deadlocks/           # Banker's Algorithm & Deadlock Detection
│   │   │   ├── page_replacement/    # FIFO, Optimal, LRU
│   │   │   └── disk_scheduling/     # SCAN, C-SCAN, LOOK
│   │   ├── api/                     # REST API routers (files, folders, processing, etc.)
│   │   ├── core/                    # Settings & directory paths
│   │   ├── database/                # SQLite session & SQLAlchemy models
│   │   ├── schemas/                 # Pydantic validation schemas
│   │   ├── services/                # Storage, processing, and report services
│   │   └── tests/                   # Pytest automated test suite (23 passing tests)
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/layout/       # Sidebar & Header
│   │   ├── features/                # 11 modules (overview, files, processing, 6 OS labs, reports, settings)
│   │   ├── services/                # Typed REST API client
│   │   ├── types/                   # TypeScript interface definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── storage/
│   ├── uploads/                     # User-uploaded and created files
│   └── processed/                   # Generated archives and processed exports
├── reports/                         # Generated lab report files
├── minios.db                        # SQLite database file
└── README.md
```

---

## 🧪 Automated Testing

Run the test suite using pytest:
```bash
PYTHONPATH=backend ./venv/bin/pytest backend/app/tests -v
```

Tests verify:
- CPU scheduling mathematical invariants: $TAT = CT - AT$ and $WT = TAT - BT$.
- SJF tie-breaking and idle CPU gap handling.
- Round Robin preemption queues and context switch counts.
- Priority scheduling order conventions.
- Memory allocation variable partition fits, internal fragmentation, and allocation failures.
- File allocation contiguous external fragmentation detection, indexed block overhead, and linked sector pointer chains.
- Banker's algorithm safe sequence computation, unsafe state detection, and resource request evaluations.
- Deadlock detection with circular wait detection.
- Page replacement fault counting against textbook references for FIFO, Optimal lookahead, and LRU.
- Disk scheduling head travel metrics for SCAN, C-SCAN (with boundary jump), and LOOK.
- File analyzers: text counting, CSV summary stats, and JSON syntax validation.
- FastAPI REST endpoints: file creation, updating, downloading, simulation execution, and report generation.

---

## 📜 Educational Purpose & Lab Compliance

MiniOS is engineered specifically for university Operating Systems coursework. All algorithm implementations are genuine, deterministic, and verify known mathematical properties without hardcoded outputs or timers.
