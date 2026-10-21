import React, { useEffect, useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Archive,
  Hash,
  Copy,
  GitCompare,
  Image as ImageIcon,
  Layers,
  History,
  CheckCircle2,
  AlertCircle,
  Play,
  Download,
  RefreshCw,
  Search
} from "lucide-react";
import { FileRecord, ProcessingJob } from "../../types";
import { api } from "../../services/api";

type ToolType =
  | "text"
  | "csv"
  | "json"
  | "compress"
  | "decompress"
  | "hash"
  | "duplicate"
  | "diff"
  | "image"
  | "batch"
  | "history";

export const FileProcessingView: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>("text");
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Tool Specific Inputs
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [selectedFile2Id, setSelectedFile2Id] = useState<string>("");
  const [expectedHash, setExpectedHash] = useState<string>("");
  const [archiveName, setArchiveName] = useState<string>("bundle.zip");
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [batchOperation, setBatchOperation] = useState<string>("hash");

  // History state
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);

  const loadFiles = async () => {
    try {
      setLoadingFiles(true);
      const data = await api.listFiles();
      setFiles(data);
      if (data.length > 0 && !selectedFileId) {
        setSelectedFileId(data[0].id);
      }
      if (data.length > 1 && !selectedFile2Id) {
        setSelectedFile2Id(data[1].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await api.getProcessingJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFiles();
    loadJobs();
  }, []);

  const handleRunTool = async () => {
    setError(null);
    setResult(null);
    setProcessing(true);

    try {
      if (activeTool === "text") {
        if (!selectedFileId) throw new Error("Select a file to analyze.");
        const res = await api.analyzeText(selectedFileId);
        setResult(res);
      } else if (activeTool === "csv") {
        if (!selectedFileId) throw new Error("Select a CSV file to inspect.");
        const res = await api.analyzeCsv(selectedFileId);
        setResult(res);
      } else if (activeTool === "json") {
        if (!selectedFileId) throw new Error("Select a JSON file to validate.");
        const res = await api.validateJson(selectedFileId);
        setResult(res);
      } else if (activeTool === "compress") {
        if (selectedBatchIds.length === 0) throw new Error("Select at least one file to archive.");
        const res = await api.compressFiles(selectedBatchIds, archiveName);
        setResult(res);
        await loadFiles();
      } else if (activeTool === "decompress") {
        if (!selectedFileId) throw new Error("Select a ZIP archive to extract.");
        const res = await api.decompressZip(selectedFileId);
        setResult(res);
        await loadFiles();
      } else if (activeTool === "hash") {
        if (!selectedFileId) throw new Error("Select a file to hash.");
        const res = await api.generateHash(selectedFileId, expectedHash || undefined);
        setResult(res);
      } else if (activeTool === "duplicate") {
        const res = await api.getDuplicates();
        setResult(res);
      } else if (activeTool === "diff") {
        if (!selectedFileId || !selectedFile2Id) throw new Error("Select two files to compare.");
        const res = await api.compareFiles(selectedFileId, selectedFile2Id);
        setResult(res);
      } else if (activeTool === "image") {
        if (!selectedFileId) throw new Error("Select an image file.");
        const res = await api.getImageMetadata(selectedFileId);
        setResult(res);
      } else if (activeTool === "batch") {
        if (selectedBatchIds.length === 0) throw new Error("Select files for batch operation.");
        const res = await api.batchProcess(selectedBatchIds, batchOperation);
        setResult(res);
        await loadFiles();
      }
      await loadJobs();
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    } finally {
      setProcessing(false);
    }
  };

  const toggleBatchSelect = (id: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const tools = [
    { id: "text", name: "Text Analyzer", icon: FileText, desc: "Word count, char count, readability stats" },
    { id: "csv", name: "CSV Inspector", icon: FileSpreadsheet, desc: "Row preview, columns, min/max statistics" },
    { id: "json", name: "JSON Validator", icon: FileCode, desc: "Format, validate syntax, line error report" },
    { id: "compress", name: "ZIP Compressor", icon: Archive, desc: "Package multiple files into a ZIP archive" },
    { id: "decompress", name: "ZIP Extractor", icon: Archive, desc: "Extract contents with path traversal protection" },
    { id: "hash", name: "Hash Generator", icon: Hash, desc: "SHA-256 and MD5 checksum integrity verifier" },
    { id: "duplicate", name: "Duplicate Detector", icon: Copy, desc: "Identify identical files and wasted storage" },
    { id: "diff", name: "File Diff", icon: GitCompare, desc: "Line-by-line visual difference comparison" },
    { id: "image", name: "Image Metadata", icon: ImageIcon, desc: "Dimensions, aspect ratio, image color format" },
    { id: "batch", name: "Batch Processor", icon: Layers, desc: "Execute operations across multiple files" },
    { id: "history", name: "Processing History", icon: History, desc: "Audit log of all executed file jobs" },
  ] as const;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Tool Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTool(t.id as ToolType);
                setResult(null);
                setError(null);
              }}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5 mb-2" />
              <div>
                <span className="text-xs font-semibold block">{t.name}</span>
                <span className={`text-[10px] line-clamp-1 ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {t.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Area */}
      {activeTool === "history" ? (
        /* History Log View */
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <span>Job Execution History</span>
            </h3>
            <button
              onClick={loadJobs}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {jobs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No processing jobs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-3">Tool</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Input Files</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-3 font-medium text-foreground">{j.tool_name}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            j.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {j.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">{j.duration_ms} ms</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                        {j.input_file_ids.length} files
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                        {new Date(j.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Tool Input & Result Split Pane */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2.5">
              Tool Configuration
            </h3>

            {/* Inputs based on active tool */}
            {activeTool === "compress" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Archive File Name</label>
                  <input
                    type="text"
                    value={archiveName}
                    onChange={(e) => setArchiveName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Select Files to Include ({selectedBatchIds.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1 p-2 rounded-lg border border-border bg-muted/20">
                    {files.map((f) => (
                      <label key={f.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer p-1 rounded hover:bg-muted">
                        <input
                          type="checkbox"
                          checked={selectedBatchIds.includes(f.id)}
                          onChange={() => toggleBatchSelect(f.id)}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span className="truncate">{f.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTool === "batch" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Batch Operation</label>
                  <select
                    value={batchOperation}
                    onChange={(e) => setBatchOperation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground"
                  >
                    <option value="hash">Calculate SHA-256 Hashes</option>
                    <option value="word_count">Calculate Word & Line Counts</option>
                    <option value="compress">Bundle into Archive</option>
                    <option value="delete">Delete Selected Files</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Select Target Files ({selectedBatchIds.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1 p-2 rounded-lg border border-border bg-muted/20">
                    {files.map((f) => (
                      <label key={f.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer p-1 rounded hover:bg-muted">
                        <input
                          type="checkbox"
                          checked={selectedBatchIds.includes(f.id)}
                          onChange={() => toggleBatchSelect(f.id)}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span className="truncate">{f.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTool === "duplicate" ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Scans all files across the filesystem, calculates SHA-256 cryptographic hashes, and groups identical files to compute wasted disk capacity.
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    {activeTool === "diff" ? "First File (Original)" : "Select File"}
                  </label>
                  <select
                    value={selectedFileId}
                    onChange={(e) => setSelectedFileId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground"
                  >
                    {files.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.file_type})
                      </option>
                    ))}
                  </select>
                </div>

                {activeTool === "diff" && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Second File (Modified)</label>
                    <select
                      value={selectedFile2Id}
                      onChange={(e) => setSelectedFile2Id(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground"
                    >
                      {files.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.file_type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {activeTool === "hash" && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Expected SHA-256 Checksum (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Paste expected 64-char hex hash..."
                      value={expectedHash}
                      onChange={(e) => setExpectedHash(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleRunTool}
              disabled={processing}
              className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Play className={`w-3.5 h-3.5 ${processing ? "animate-spin" : ""}`} />
              <span>{processing ? "Processing..." : "Run Operation"}</span>
            </button>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Result Column */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2.5">
              Operation Output & Visual Analytics
            </h3>

            {!result ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                Select your configuration and click "Run Operation" to view results.
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Text Analyzer Output */}
                {activeTool === "text" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-muted/40 border border-border text-center">
                        <span className="text-[10px] text-muted-foreground uppercase">Lines</span>
                        <p className="text-lg font-bold text-foreground">{result.line_count}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/40 border border-border text-center">
                        <span className="text-[10px] text-muted-foreground uppercase">Words</span>
                        <p className="text-lg font-bold text-foreground">{result.word_count}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/40 border border-border text-center">
                        <span className="text-[10px] text-muted-foreground uppercase">Characters</span>
                        <p className="text-lg font-bold text-foreground">{result.char_count_with_spaces}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/40 border border-border text-center">
                        <span className="text-[10px] text-muted-foreground uppercase">Reading Time</span>
                        <p className="text-lg font-bold text-foreground">{result.reading_time_minutes} min</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2">Most Frequent Words</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {result.frequent_words.map((w: any) => (
                          <span
                            key={w.word}
                            className="px-2.5 py-1 rounded-lg bg-muted text-xs font-mono border border-border flex items-center gap-1.5"
                          >
                            <span>{w.word}</span>
                            <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                              {w.count}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. CSV Analyzer Output */}
                {activeTool === "csv" && (
                  <div className="space-y-4">
                    <div className="flex gap-4 text-xs font-mono">
                      <span>Rows: <strong>{result.row_count}</strong></span>
                      <span>Columns: <strong>{result.column_count}</strong></span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-mono">
                          <tr>
                            {result.columns.map((c: string) => (
                              <th key={c} className="py-2 px-3">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 font-mono">
                          {result.preview_rows.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-muted/20">
                              {result.columns.map((c: string) => (
                                <td key={c} className="py-2 px-3 text-foreground truncate max-w-xs">
                                  {row[c]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2">Column Statistics</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(result.column_stats).map(([col, st]: [string, any]) => (
                          <div key={col} className="p-2.5 rounded-lg border border-border bg-muted/20 text-xs font-mono">
                            <span className="font-semibold text-foreground block mb-1">{col}</span>
                            {st.type === "numeric" ? (
                              <span className="text-muted-foreground text-[11px]">
                                Min: {st.min} &bull; Max: {st.max} &bull; Mean: {st.mean}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">
                                Unique: {st.unique_count} values
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. JSON Validator Output */}
                {activeTool === "json" && (
                  <div className="space-y-3">
                    <div
                      className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                        result.is_valid
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                          : "bg-red-500/10 border-red-500/30 text-red-500"
                      }`}
                    >
                      {result.is_valid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Valid JSON Syntax ({result.key_count} root keys, type: {result.data_type})</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>Syntax Error at Line {result.line_number}, Col {result.column_number}: {result.error_message}</span>
                        </>
                      )}
                    </div>
                    <pre className="p-3 rounded-lg bg-muted/40 border border-border font-mono text-xs overflow-x-auto max-h-72">
                      {result.formatted_preview}
                    </pre>
                  </div>
                )}

                {/* 4. Hash Generator Output */}
                {activeTool === "hash" && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">SHA-256 Checksum</span>
                      <span className="text-foreground select-all font-mono break-all font-semibold">
                        {result.sha256}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">MD5 Checksum</span>
                      <span className="text-foreground select-all font-mono break-all">
                        {result.md5}
                      </span>
                    </div>

                    {result.matches_expected !== null && (
                      <div
                        className={`p-3 rounded-lg border text-xs font-sans flex items-center gap-2 ${
                          result.matches_expected
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                            : "bg-red-500/10 border-red-500/30 text-red-500"
                        }`}
                      >
                        {result.matches_expected ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Integrity Verified: Checksum exactly matches expected hash!</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            <span>Integrity Mismatch: Generated checksum does not match expected hash.</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Duplicate Detector Output */}
                {activeTool === "duplicate" && (
                  <div className="space-y-3">
                    <div className="flex gap-4 text-xs">
                      <span>Files Scanned: <strong>{result.total_scanned}</strong></span>
                      <span>Duplicate Groups: <strong>{result.duplicate_groups.length}</strong></span>
                      <span className="text-amber-500">
                        Wasted Capacity: <strong>{result.wasted_bytes} bytes</strong>
                      </span>
                    </div>

                    {result.duplicate_groups.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">
                        No duplicates found across all stored files.
                      </p>
                    ) : (
                      result.duplicate_groups.map((grp: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
                          <span className="text-[11px] font-mono text-muted-foreground block truncate">
                            SHA: {grp.sha256} ({grp.size_bytes} bytes each)
                          </span>
                          <div className="space-y-1">
                            {grp.files.map((f: any) => (
                              <div key={f.id} className="text-xs font-medium text-foreground flex items-center gap-2">
                                <Copy className="w-3.5 h-3.5 text-amber-500" />
                                <span>{f.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 6. Diff Comparison Output */}
                {activeTool === "diff" && (
                  <div className="space-y-3">
                    <div className="flex gap-4 text-xs font-mono">
                      <span>{result.identical ? "Files are IDENTICAL" : "Differences DETECTED"}</span>
                      <span className="text-emerald-500 font-bold">+{result.total_added} added</span>
                      <span className="text-red-500 font-bold">-{result.total_removed} removed</span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-border bg-card font-mono text-xs max-h-80 overflow-y-auto">
                      {result.diff_lines.map((line: any, i: number) => (
                        <div
                          key={i}
                          className={`px-3 py-1 flex items-start gap-3 ${
                            line.type === "add"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : line.type === "remove"
                              ? "bg-red-500/10 text-red-400"
                              : line.type === "header"
                              ? "bg-muted text-muted-foreground font-semibold"
                              : "text-foreground"
                          }`}
                        >
                          <span className="w-6 text-muted-foreground shrink-0 select-none text-[10px]">
                            {line.line_num_new || line.line_num_old || " "}
                          </span>
                          <span className="whitespace-pre-wrap">{line.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. Image Metadata Output */}
                {activeTool === "image" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <span className="text-muted-foreground text-[10px] block">Dimensions</span>
                      <span className="font-bold text-foreground text-sm">{result.width} x {result.height} px</span>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <span className="text-muted-foreground text-[10px] block">Aspect Ratio</span>
                      <span className="font-bold text-foreground text-sm">{result.aspect_ratio}</span>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <span className="text-muted-foreground text-[10px] block">Format & Mode</span>
                      <span className="font-bold text-foreground text-sm">{result.format} ({result.mode})</span>
                    </div>
                  </div>
                )}

                {/* 8. Compress / Decompress / Batch Output */}
                {(activeTool === "compress" || activeTool === "decompress" || activeTool === "batch") && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                    <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {result.message || "Batch operation finished successfully."}
                    </p>
                    <pre className="text-xs font-mono text-muted-foreground max-h-48 overflow-y-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
