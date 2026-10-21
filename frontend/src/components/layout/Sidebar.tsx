import React from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Cpu,
  Binary,
  HardDrive,
  ShieldAlert,
  Layers,
  Disc,
  FileText,
  Settings as SettingsIcon,
  HardDriveDownload,
  Terminal,
  Activity
} from "lucide-react";
import { StorageStats } from "../../types";

export type NavSection =
  | "overview"
  | "files"
  | "processing"
  | "cpu"
  | "memory"
  | "file-allocation"
  | "deadlocks"
  | "page-replacement"
  | "disk"
  | "reports"
  | "settings";

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  storageStats: StorageStats | null;
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, category: "Main" },
  { id: "files", label: "My Files", icon: FolderKanban, category: "Main" },
  { id: "processing", label: "File Processing", icon: Terminal, category: "Main" },
  
  { id: "cpu", label: "CPU Scheduling", icon: Cpu, category: "OS Lab Modules", week: "W1" },
  { id: "memory", label: "Memory Allocation", icon: Binary, category: "OS Lab Modules", week: "W2" },
  { id: "file-allocation", label: "File Allocation", icon: HardDrive, category: "OS Lab Modules", week: "W3" },
  { id: "deadlocks", label: "Deadlock Management", icon: ShieldAlert, category: "OS Lab Modules", week: "W4" },
  { id: "page-replacement", label: "Page Replacement", icon: Layers, category: "OS Lab Modules", week: "W5" },
  { id: "disk", label: "Disk Scheduling", icon: Disc, category: "OS Lab Modules", week: "W6" },

  { id: "reports", label: "Lab Reports", icon: FileText, category: "Documentation" },
  { id: "settings", label: "Settings", icon: SettingsIcon, category: "System" },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  storageStats
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const usedPct = storageStats ? Math.min(100, storageStats.used_percentage) : 0;

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between select-none shrink-0 h-screen overflow-hidden">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-border/80 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-sm tracking-wider">
            OS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-foreground">MiniOS Lab</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">v1.0</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Storage & OS Simulations</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {["Main", "OS Lab Modules", "Documentation", "System"].map((category) => {
            const items = navItems.filter((item) => item.category === category);
            if (!items.length) return null;

            return (
              <div key={category} className="space-y-1">
                <div className="px-2.5 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1.5">
                  {category}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  const weekBadge = "week" in item ? item.week : null;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectSection(item.id as NavSection)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                        <span>{item.label}</span>
                      </div>
                      {weekBadge && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                          {weekBadge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Storage Quota Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium flex items-center gap-1.5 text-muted-foreground">
            <HardDriveDownload className="w-3.5 h-3.5 text-blue-500" />
            Storage Quota
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {usedPct}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              usedPct > 90 ? "bg-red-500" : usedPct > 75 ? "bg-amber-500" : "bg-blue-500"
            }`}
            style={{ width: `${Math.max(2, usedPct)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-muted-foreground mt-2">
          <span>{formatBytes(storageStats?.used_bytes || 0)} used</span>
          <span>{formatBytes(storageStats?.quota_bytes || 52428800)}</span>
        </div>
      </div>
    </aside>
  );
};
