import React, { useEffect, useState } from "react";
import { Sun, Moon, Database, Plus, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { NavSection } from "./Sidebar";
import { api } from "../../services/api";

interface HeaderProps {
  currentSection: NavSection;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNewFileClick: () => void;
  onRefreshData?: () => void;
}

const sectionTitles: Record<NavSection, { title: string; subtitle: string }> = {
  overview: { title: "Overview Dashboard", subtitle: "System telemetry, storage metrics, and lab syllabus progress" },
  files: { title: "My Files Explorer", subtitle: "Manage, upload, preview, edit, and organize files in simulated storage" },
  processing: { title: "File Processing Suite", subtitle: "Analyze text, CSV, JSON, ZIP archives, SHA-256 hashes, and file diffs" },
  cpu: { title: "Week 1 — CPU Scheduling Simulator", subtitle: "FCFS, SJF (non-preemptive), Round Robin, and Priority scheduling" },
  memory: { title: "Week 2 — Memory Allocation Simulator", subtitle: "First Fit, Best Fit, and Worst Fit dynamic partition visualizer" },
  "file-allocation": { title: "Week 3 — File Allocation Strategies", subtitle: "Sequential/Contiguous, Indexed, and Linked visual disk block allocation" },
  deadlocks: { title: "Week 4 — Deadlock Avoidance & Detection", subtitle: "Banker's Safety Algorithm and Request Grant vs Deadlock Detection" },
  "page-replacement": { title: "Week 5 — Page Replacement Algorithms", subtitle: "FIFO, Optimal (future lookahead), and LRU step-by-step frame matrix" },
  disk: { title: "Week 6 — Disk Scheduling Algorithms", subtitle: "SCAN (Elevator), C-SCAN, and LOOK cylinder path simulations" },
  reports: { title: "OS Lab Reports", subtitle: "Formal experiment reports with input matrices, metrics, and Markdown export" },
  settings: { title: "Application Settings", subtitle: "Storage quota, simulated disk dimensions, and demo data management" },
};

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  darkMode,
  onToggleDarkMode,
  onNewFileClick,
  onRefreshData
}) => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getOverviewStats();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSeedSamples = async () => {
    setSeeding(true);
    try {
      await api.seedSamples();
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  const { title, subtitle } = sectionTitles[currentSection] || {
    title: "Operating Systems Lab",
    subtitle: "File Storage & Algorithm Simulation Platform"
  };

  return (
    <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-[11px] text-muted-foreground line-clamp-1">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend health status badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border border-border bg-muted/40">
          <span
            className={`w-2 h-2 rounded-full ${
              backendOnline === true
                ? "bg-emerald-500 animate-pulse"
                : backendOnline === false
                ? "bg-rose-500"
                : "bg-amber-500"
            }`}
          />
          <span className="text-muted-foreground">
            {backendOnline === true ? "FastAPI Online" : backendOnline === false ? "Offline" : "Connecting..."}
          </span>
        </div>

        {/* Seed demo data button */}
        <button
          onClick={handleSeedSamples}
          disabled={seeding}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
          title="Seed sample files for testing (CSV, TXT, JSON)"
        >
          <Database className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Seed Sample Files</span>
        </button>

        {/* Quick New File action */}
        <button
          onClick={onNewFileClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New File</span>
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
