import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  HardDrive,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Sparkles
} from "lucide-react";
import { api } from "../../services/api";

interface SettingsViewProps {
  onRefreshStorage?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshStorage }) => {
  const [quotaMB, setQuotaMB] = useState<number>(50);
  const [cylinders, setCylinders] = useState<number>(200);
  const [blocks, setBlocks] = useState<number>(64);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data.storage_quota_bytes) {
        setQuotaMB(Math.round(data.storage_quota_bytes / (1024 * 1024)));
      }
      if (data.disk_cylinders) setCylinders(data.disk_cylinders);
      if (data.disk_blocks) setBlocks(data.disk_blocks);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.updateSettings({
        storage_quota_bytes: quotaMB * 1024 * 1024,
        disk_cylinders: cylinders,
        disk_blocks: blocks
      });
      setMessage("Settings updated successfully.");
      if (onRefreshStorage) onRefreshStorage();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setMessage(null);
    try {
      const res = await api.seedSamples();
      setMessage(res.message);
      if (onRefreshStorage) onRefreshStorage();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <span>Application Settings</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          Configure simulated environment parameters, quotas, and seed demo datasets
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-5 space-y-5">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
          Virtual Operating System Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Storage Quota */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Simulated Storage Quota (MB)
            </label>
            <p className="text-[11px] text-muted-foreground">
              Maximum allowable capacity for local application file uploads and created files.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min={5}
                max={500}
                value={quotaMB}
                onChange={(e) => setQuotaMB(Math.max(5, parseInt(e.target.value) || 5))}
                className="w-28 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground font-bold"
              />
              <span className="text-xs text-muted-foreground">Megabytes</span>
            </div>
          </div>

          {/* Disk Cylinders */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Default Disk Cylinders
            </label>
            <p className="text-[11px] text-muted-foreground">
              Physical boundary for SCAN and C-SCAN disk arm simulations (e.g. 0 to 199).
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min={20}
                max={1000}
                value={cylinders}
                onChange={(e) => setCylinders(Math.max(20, parseInt(e.target.value) || 20))}
                className="w-28 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground font-bold"
              />
              <span className="text-xs text-muted-foreground">Cylinders</span>
            </div>
          </div>

          {/* Disk Sectors */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              File Allocation Grid Blocks
            </label>
            <p className="text-[11px] text-muted-foreground">
              Simulated storage disk grid sector count for contiguous, indexed, and linked tests.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <select
                value={blocks}
                onChange={(e) => setBlocks(parseInt(e.target.value) || 64)}
                className="w-28 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground font-bold"
              >
                <option value={32}>32 Blocks</option>
                <option value={64}>64 Blocks (8x8)</option>
                <option value={128}>128 Blocks</option>
              </select>
              <span className="text-xs text-muted-foreground">Sectors</span>
            </div>
          </div>

          {/* Seed Sample Materials */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2 flex flex-col justify-between">
            <div>
              <label className="text-xs font-semibold text-foreground block">
                Lab Sample Materials
              </label>
              <p className="text-[11px] text-muted-foreground">
                Seeds demo files (CSV processes, system JSON config, lecture notes) into storage.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="py-1.5 px-3 rounded-lg border border-border bg-card text-xs font-semibold hover:bg-muted text-foreground flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Database className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
              <span>{seeding ? "Generating..." : "Seed OS Lab Datasets"}</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

      {/* Diagnostics Card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-xs text-muted-foreground">
        <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] border-b border-border pb-2">
          System Environment Information
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
          <div>OS Kernel Engine: <strong className="text-foreground">Python FastAPI</strong></div>
          <div>Frontend: <strong className="text-foreground">React 19 + TypeScript + Vite</strong></div>
          <div>Database: <strong className="text-foreground">SQLite (minios.db)</strong></div>
          <div>Storage Engine: <strong className="text-foreground">Local Filesystem</strong></div>
        </div>
      </div>
    </div>
  );
};
