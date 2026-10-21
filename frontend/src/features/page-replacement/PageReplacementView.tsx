import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronLeft,
  Sparkles,
  Info
} from "lucide-react";
import { PageReplacementResponse } from "../../types";
import { api } from "../../services/api";

interface PageReplacementViewProps {
  onGenerateReport?: (reportData: any) => void;
}

export const PageReplacementView: React.FC<PageReplacementViewProps> = ({ onGenerateReport }) => {
  const [algorithm, setAlgorithm] = useState<"FIFO" | "OPTIMAL" | "LRU">("LRU");
  const [refStringInput, setRefStringInput] = useState<string>("7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1");
  const [framesCount, setFramesCount] = useState<number>(3);

  const [result, setResult] = useState<PageReplacementResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Playback
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const timerRef = useRef<any>(null);

  const parseReferences = (str: string): number[] => {
    return str
      .split(/[\s,]+/)
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
  };

  const runSimulation = async () => {
    const refs = parseReferences(refStringInput);
    if (refs.length === 0) return;
    try {
      setLoading(true);
      const res = await api.simulatePageReplacement({
        algorithm,
        reference_string: refs,
        frames_count: framesCount
      });
      setResult(res);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [algorithm, framesCount]);

  // Autoplay timer
  useEffect(() => {
    if (isPlaying && result && result.steps.length > 0) {
      const intervalMs = Math.max(200, 1000 / speed);
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= result.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, result]);

  const stepState = result?.steps[currentStep];

  const handleGenerateReportClick = () => {
    if (!result) return;
    const reportData = {
      experiment_no: 5,
      title: `Week 5: Virtual Memory Page Replacement (${algorithm})`,
      category: "page_replacement",
      algorithm_name: algorithm,
      aim: `To simulate and evaluate the hit/fault ratios for ${algorithm} page replacement on a ${framesCount}-frame memory buffer.`,
      description: `When a process references a page not present in main memory frames, a page fault occurs and the OS must replace an existing page frame. FIFO replaces the oldest page; LRU replaces the page unreferenced for the longest duration; Optimal replaces the page that will not be used for the farthest future time.`,
      input_summary: {
        algorithm,
        frames_count: framesCount,
        reference_string: result.reference_string
      },
      result_summary: {
        total_references: result.total_references,
        page_hits: result.hits,
        page_faults: result.faults,
        hit_ratio: `${(result.hit_ratio * 100).toFixed(1)}%`,
        fault_ratio: `${(result.fault_ratio * 100).toFixed(1)}%`
      },
      conclusion: `${algorithm} completed across ${result.total_references} references resulting in ${result.faults} page faults (Fault ratio: ${(result.fault_ratio * 100).toFixed(1)}%) and ${result.hits} page hits.`
    };

    if (onGenerateReport) {
      onGenerateReport(reportData);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" />
            <span>Page Replacement Simulator</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Week 5 Syllabus &bull; Frame-by-frame memory matrix, fault indicators & Optimal future lookahead
          </p>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
          {(["FIFO", "OPTIMAL", "LRU"] as const).map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                algorithm === algo
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {algo === "OPTIMAL" ? "Optimal" : algo}
            </button>
          ))}
        </div>
      </div>

      {/* Input Configuration Bar */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground block">
            Page Reference String (Comma or space separated)
          </label>
          <input
            type="text"
            value={refStringInput}
            onChange={(e) => setRefStringInput(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-mono text-foreground"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground block">Frame Count</label>
            <input
              type="number"
              min={1}
              max={10}
              value={framesCount}
              onChange={(e) => setFramesCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 px-2 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-mono text-center text-foreground font-bold"
            />
          </div>

          <div className="pt-5">
            <button
              onClick={runSimulation}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 shadow-sm transition-all"
            >
              {loading ? "Simulating..." : "Execute"}
            </button>
          </div>
        </div>
      </div>

      {/* Primary Results & Metrics KPI */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl border border-border bg-card text-center">
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Total References</span>
            <p className="text-xl font-bold font-mono text-foreground">{result.total_references}</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-card text-center">
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Page Hits</span>
            <p className="text-xl font-bold font-mono text-emerald-500">{result.hits}</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-card text-center">
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Page Faults</span>
            <p className="text-xl font-bold font-mono text-red-500">{result.faults}</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-card text-center">
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Hit Ratio</span>
            <p className="text-xl font-bold font-mono text-emerald-500">
              {(result.hit_ratio * 100).toFixed(1)}%
            </p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-card text-center">
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Fault Ratio</span>
            <p className="text-xl font-bold font-mono text-red-500">
              {(result.fault_ratio * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Frame-by-Frame Matrix & Playback Controls */}
      {result && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Frame Matrix Progression</h3>
              <p className="text-[11px] text-muted-foreground">
                Step-by-step memory frame buffer state for each referenced page
              </p>
            </div>

            {/* Playback bar */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep((p) => Math.max(0, p - 1));
                }}
                disabled={currentStep <= 0}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep((p) => Math.min(result.steps.length - 1, p + 1));
                }}
                disabled={currentStep >= result.steps.length - 1}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground disabled:opacity-40"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep(0);
                }}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <select
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="px-2 py-1 rounded border border-border bg-muted/40 text-xs font-mono text-muted-foreground"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1.0x</option>
                <option value={2}>2.0x</option>
              </select>
            </div>
          </div>

          {/* Current Step Description Banner */}
          {stepState && (
            <div
              className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between gap-3 ${
                stepState.is_hit
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-red-500/10 border-red-500/30 text-red-500"
              }`}
            >
              <div className="flex items-center gap-2">
                {stepState.is_hit ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>
                  <strong>Step {stepState.step_number} (Page {stepState.page}):</strong> {stepState.reason}
                </span>
              </div>
              <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-muted/40">
                {stepState.is_hit ? "HIT" : "FAULT"}
              </span>
            </div>
          )}

          {/* Optimal Future Lookahead Visualizer */}
          {algorithm === "OPTIMAL" && stepState?.future_lookahead && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1 text-xs font-mono">
              <strong className="text-foreground text-[11px] uppercase block">
                Optimal Future Reference Lookahead:
              </strong>
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {Object.entries(stepState.future_lookahead).map(([p, dist]) => (
                  <span key={p} className="px-2 py-0.5 rounded bg-card border border-border">
                    Page <strong>{p}</strong>: Next needed at <strong>{dist}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scrollable Frame Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-center text-xs font-mono">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="py-2 px-3 text-left">Step / Metric</th>
                  {result.steps.map((st) => (
                    <th
                      key={st.step_number}
                      className={`py-2 px-3 ${currentStep === st.step_number - 1 ? "bg-purple-600 text-white font-bold" : ""}`}
                    >
                      #{st.step_number}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {/* Reference String Row */}
                <tr className="bg-muted/20 font-bold">
                  <td className="py-2 px-3 text-left text-foreground">Page Ref</td>
                  {result.steps.map((st) => (
                    <td key={st.step_number} className="py-2 px-3 text-foreground">
                      {st.page}
                    </td>
                  ))}
                </tr>

                {/* Frames Rows */}
                {Array.from({ length: framesCount }).map((_, fIdx) => (
                  <tr key={fIdx}>
                    <td className="py-2 px-3 text-left text-muted-foreground">Frame {fIdx}</td>
                    {result.steps.map((st) => {
                      const val = st.frames[fIdx];
                      const isCurrent = currentStep === st.step_number - 1;
                      return (
                        <td
                          key={st.step_number}
                          className={`py-2 px-3 ${
                            val !== null && val !== undefined ? "font-bold text-foreground" : "text-muted-foreground/30"
                          } ${isCurrent ? "bg-muted/40" : ""}`}
                        >
                          {val !== null && val !== undefined ? val : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Hit / Fault Status Row */}
                <tr>
                  <td className="py-2 px-3 text-left font-bold text-foreground">Status</td>
                  {result.steps.map((st) => (
                    <td key={st.step_number} className="py-2 px-3">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          st.is_hit ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {st.is_hit ? "H" : "F"}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleGenerateReportClick}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Lab Report</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
