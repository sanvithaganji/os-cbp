import React, { useEffect, useState } from "react";
import {
  FolderKanban,
  FileCode,
  HardDrive,
  Cpu,
  Binary,
  Layers,
  Disc,
  ShieldAlert,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { OverviewStats } from "../../types";
import { api } from "../../services/api";
import { NavSection } from "../../components/layout/Sidebar";

interface OverviewViewProps {
  onNavigate: (section: NavSection) => void;
  onSelectFile?: (fileId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getOverviewStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const syllabusModules = [
    {
      week: "Week 1",
      title: "CPU Scheduling",
      algorithms: ["FCFS", "SJF (Non-Preemptive)", "Round Robin", "Priority"],
      icon: Cpu,
      color: "from-blue-500 to-indigo-600",
      section: "cpu" as NavSection,
      key: "week1",
      desc: "Manages the CPU pipeline, minimizes waiting times, and schedules process bursts."
    },
    {
      week: "Week 2",
      title: "Memory Allocation",
      algorithms: ["First Fit", "Best Fit", "Worst Fit"],
      icon: Binary,
      color: "from-emerald-500 to-teal-600",
      section: "memory" as NavSection,
      key: "week2",
      desc: "Dynamic partition allocation strategies and internal/external fragmentation tracking."
    },
    {
      week: "Week 3",
      title: "File Allocation",
      algorithms: ["Contiguous", "Indexed", "Linked List"],
      icon: HardDrive,
      color: "from-amber-500 to-orange-600",
      section: "file-allocation" as NavSection,
      key: "week3",
      desc: "Simulates disk blocks, pointer chains, indexing overhead, and contiguous allocation limits."
    },
    {
      week: "Week 4",
      title: "Deadlock Management",
      algorithms: ["Banker's Algorithm (Avoidance)", "Deadlock Detection"],
      icon: ShieldAlert,
      color: "from-rose-500 to-red-600",
      section: "deadlocks" as NavSection,
      key: "week4",
      desc: "Resource allocation graphs, safe sequence evaluation, and resource request checks."
    },
    {
      week: "Week 5",
      title: "Page Replacement",
      algorithms: ["FIFO", "Optimal (Lookahead)", "LRU"],
      icon: Layers,
      color: "from-purple-500 to-violet-600",
      section: "page-replacement" as NavSection,
      key: "week5",
      desc: "Virtual memory page frames, page fault minimization, and cache eviction logic."
    },
    {
      week: "Week 6",
      title: "Disk Scheduling",
      algorithms: ["SCAN (Elevator)", "C-SCAN (Circular)", "LOOK"],
      icon: Disc,
      color: "from-cyan-500 to-sky-600",
      section: "disk" as NavSection,
      key: "week6",
      desc: "Head movement trajectory, cylinder boundaries, and average seek time optimization."
    },
  ];

  const completedWeeks = stats
    ? Object.values(stats.syllabus_progress).filter(Boolean).length
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/20 p-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack OS Engineering Environment</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
              MiniOS — File Storage & Processing Lab
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground max-w-2xl mt-1 leading-relaxed">
              Explore how operating systems coordinate physical storage, manage processes in memory, allocate CPU bursts, avoid deadlocks, and schedule disk arms through live interactive simulations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchStats}
              className="p-2 rounded-lg border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              title="Refresh stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => onNavigate("files")}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-2 shadow-sm shadow-primary/20 transition-all"
            >
              <span>Open File Manager</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Storage card */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Storage Quota</span>
            <HardDrive className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {formatBytes(stats?.storage_used_bytes || 0)}
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(3, stats?.storage_percentage || 0))}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground pt-1">
            <span>{stats?.storage_percentage || 0}% used</span>
            <span>Limit: {formatBytes(stats?.storage_quota_bytes || 52428800)}</span>
          </div>
        </div>

        {/* Files & Folders */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Files & Folders</span>
            <FolderKanban className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {stats?.total_files || 0} <span className="text-xs font-normal text-muted-foreground">files</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Organized across <strong className="text-foreground">{stats?.total_folders || 0}</strong> directories
          </p>
          <button
            onClick={() => onNavigate("files")}
            className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1 pt-1"
          >
            Manage storage directory &rarr;
          </button>
        </div>

        {/* Syllabus Progress */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Syllabus Covered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {completedWeeks} / 6 <span className="text-xs font-normal text-muted-foreground">Modules</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedWeeks / 6) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground pt-1 font-mono">
            {Math.round((completedWeeks / 6) * 100)}% verified with runs
          </p>
        </div>

        {/* Simulation Runs */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Activity Logs</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {(stats?.total_simulations || 0) + (stats?.total_processing_jobs || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            <strong className="text-foreground">{stats?.total_simulations || 0}</strong> simulations,{" "}
            <strong className="text-foreground">{stats?.total_processing_jobs || 0}</strong> jobs recorded
          </p>
          <button
            onClick={() => onNavigate("reports")}
            className="text-[11px] text-purple-500 hover:underline font-medium flex items-center gap-1 pt-1"
          >
            View experiment reports &rarr;
          </button>
        </div>
      </div>

      {/* Six Weekly Syllabus Modules Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
            <span>Operating Systems Lab Modules (6 Weeks)</span>
            <span className="text-[11px] font-normal text-muted-foreground">15 Core Algorithms</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {syllabusModules.map((mod) => {
            const isCompleted = stats?.syllabus_progress?.[mod.key] || false;
            const Icon = mod.icon;

            return (
              <div
                key={mod.week}
                className="group rounded-xl border border-border bg-card hover:border-primary/50 transition-all p-4 flex flex-col justify-between space-y-3 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                      {mod.week}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Simulated</span>
                        </>
                      ) : (
                        <span>Pending</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${mod.color} flex items-center justify-center text-white shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">{mod.title}</h4>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {mod.desc}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {mod.algorithms.map((algo) => (
                      <span
                        key={algo}
                        className="text-[10px] px-2 py-0.5 rounded bg-muted/70 text-foreground/80 font-mono"
                      >
                        {algo}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(mod.section)}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg border border-border bg-muted/40 hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs font-medium transition-all flex items-center justify-center gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                >
                  <span>Launch Simulator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Split Section: Recent Activity & OS Concept Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files & Simulations */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Recent File & Lab Activity</span>
            </h4>
            <button
              onClick={() => onNavigate("files")}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            {stats?.recent_files && stats.recent_files.length > 0 ? (
              stats.recent_files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {file.file_type.toUpperCase()} &bull; {formatBytes(file.size_bytes)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    {new Date(file.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No files uploaded yet. Click "New File" or "Seed Sample Files" above!
              </p>
            )}
          </div>
        </div>

        {/* Operating Systems Architecture Map */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="border-b border-border pb-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              <span>Operating System Architectural Nexus</span>
            </h4>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-1">
              <strong className="text-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Storage & Filesystem Layer
              </strong>
              <p>
                Files are structured into blocks on physical media. The MiniOS File Storage engine manages directory hierarchies, real file persistence, metadata indexing, and content pipelines.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-1">
              <strong className="text-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Process & Memory Management
              </strong>
              <p>
                The CPU scheduling subsystem coordinates thread execution bursts to minimize waiting time, while the memory manager packs variable partitions (First, Best, Worst Fit) and swaps frames (FIFO, LRU, Optimal).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-1">
              <strong className="text-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Deadlock Safety & Disk Actuators
              </strong>
              <p>
                The Banker's Algorithm evaluates matrix claims to prevent circular waits. Disk arm schedulers (SCAN, C-SCAN, LOOK) order I/O requests to optimize head travel across physical cylinders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
