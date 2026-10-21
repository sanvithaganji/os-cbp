import React, { useState, useEffect, useRef } from "react";
import {
  Disc,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  FileText,
  ChevronLeft,
  ArrowRight,
  TrendingDown,
  Info,
  Layers
} from "lucide-react";
import { DiskSchedulingResponse } from "../../types";
import { api } from "../../services/api";

interface DiskSchedulingViewProps {
  onGenerateReport?: (reportData: any) => void;
}

export const DiskSchedulingView: React.FC<DiskSchedulingViewProps> = ({ onGenerateReport }) => {
  const [algorithm, setAlgorithm] = useState<"SCAN" | "C-SCAN" | "LOOK">("SCAN");
  const [initialHead, setInitialHead] = useState<number>(53);
  const [cylinderRange, setCylinderRange] = useState<number>(200);
  const [requestsInput, setRequestsInput] = useState<string>("98, 183, 37, 122, 14, 124, 65, 67");
  const [direction, setDirection] = useState<"left" | "right">("right");

  const [result, setResult] = useState<DiskSchedulingResponse | null>(null);
  const [comparison, setComparison] = useState<{
    scan?: DiskSchedulingResponse;
    cscan?: DiskSchedulingResponse;
    look?: DiskSchedulingResponse;
  }>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Playback
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const timerRef = useRef<any>(null);

  const parseRequests = (str: string): number[] => {
    return str
      .split(/[\s,]+/)
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
  };

  const runSimulation = async () => {
    const reqs = parseRequests(requestsInput);
    if (reqs.length === 0) return;
    try {
      setLoading(true);
      const [curr, scanRes, cscanRes, lookRes] = await Promise.all([
        api.simulateDiskScheduling({
          algorithm,
          initial_head: initialHead,
          requests: reqs,
          cylinder_range: cylinderRange,
          direction
        }),
        api.simulateDiskScheduling({
          algorithm: "SCAN",
          initial_head: initialHead,
          requests: reqs,
          cylinder_range: cylinderRange,
          direction
        }),
        api.simulateDiskScheduling({
          algorithm: "C-SCAN",
          initial_head: initialHead,
          requests: reqs,
          cylinder_range: cylinderRange,
          direction
        }),
        api.simulateDiskScheduling({
          algorithm: "LOOK",
          initial_head: initialHead,
          requests: reqs,
          cylinder_range: cylinderRange,
          direction
        }),
      ]);
      setResult(curr);
      setComparison({ scan: scanRes, cscan: cscanRes, look: lookRes });
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
  }, [algorithm, direction]);

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
      experiment_no: 6,
      title: `Week 6: Disk Arm Scheduling Simulation (${algorithm})`,
      category: "disk_scheduling",
      algorithm_name: algorithm,
      aim: `To simulate and evaluate head seek trajectories and total head movement using ${algorithm} disk scheduling.`,
      description: `Disk scheduling algorithms order physical I/O requests across cylinders to minimize arm travel time. SCAN sweeps to the cylinder boundary and reverses; C-SCAN sweeps to the boundary, performs a fast circular return jump without servicing, and resumes in the same direction; LOOK sweeps only to the furthest request before reversing.`,
      input_summary: {
        algorithm,
        initial_head: initialHead,
        cylinder_range: cylinderRange,
        direction,
        requests: parseRequests(requestsInput)
      },
      result_summary: {
        total_head_movement: `${result.total_head_movement} cylinders`,
        average_head_movement: `${result.avg_head_movement} cylinders/request`,
        service_order: result.service_order,
        head_trajectory: result.head_trajectory
      },
      conclusion: `${algorithm} serviced all requests with a total head movement of ${result.total_head_movement} cylinders (average ${result.avg_head_movement} per request). Service sequence: ${result.service_order.join(" -> ")}.`
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
            <Disc className="w-5 h-5 text-cyan-500" />
            <span>Disk Arm Scheduling Simulator</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Week 6 Syllabus &bull; SCAN (Elevator), C-SCAN (Circular), and LOOK head trajectories & seek counts
          </p>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
          {(["SCAN", "C-SCAN", "LOOK"] as const).map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                algorithm === algo
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {algo}
            </button>
          ))}
        </div>
      </div>

      {/* Input Configuration Bar */}
      <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Initial Head Position</label>
          <input
            type="number"
            min={0}
            max={cylinderRange - 1}
            value={initialHead}
            onChange={(e) => setInitialHead(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-mono text-foreground font-bold"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Cylinder Range (0 to Max)</label>
          <input
            type="number"
            min={10}
            max={1000}
            value={cylinderRange}
            onChange={(e) => setCylinderRange(Math.max(10, parseInt(e.target.value) || 200))}
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-mono text-foreground font-bold"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Initial Head Direction</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as any)}
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-mono text-foreground font-semibold"
          >
            <option value="right">Right (Increasing / Upwards &rarr;)</option>
            <option value="left">Left (Decreasing / Downwards &larr;)</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full py-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700 shadow-sm transition-all"
          >
            {loading ? "Simulating..." : "Calculate Path"}
          </button>
        </div>

        <div className="md:col-span-4">
          <label className="text-xs text-muted-foreground block mb-1">
            Request Queue (Comma or space separated cylinder numbers)
          </label>
          <input
            type="text"
            value={requestsInput}
            onChange={(e) => setRequestsInput(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-mono text-foreground"
          />
        </div>
      </div>

      {/* KPI Cards */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-border bg-card">
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">Total Movement</span>
            <span className="text-xl font-bold font-mono text-cyan-500">
              {result.total_head_movement} <span className="text-xs font-normal text-muted-foreground">cylinders</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card">
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">Average Seek Distance</span>
            <span className="text-xl font-bold font-mono text-foreground">
              {result.avg_head_movement} <span className="text-xs font-normal text-muted-foreground">cyl/req</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card">
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">Pending Requests</span>
            <span className="text-xl font-bold font-mono text-foreground">
              {result.service_order.length} <span className="text-xs font-normal text-muted-foreground">serviced</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card">
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">Initial Head</span>
            <span className="text-xl font-bold font-mono text-emerald-500">
              #{result.initial_head} <span className="text-xs font-normal text-muted-foreground">({result.direction})</span>
            </span>
          </div>
        </div>
      )}

      {/* Interactive Cylinder Track & Coordinate Graph */}
      {result && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Disk Arm Cylinder Trajectory ({algorithm})
              </h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                Order: [{result.service_order.join(" &rarr; ")}]
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
                className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
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
            <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono flex items-center justify-between gap-3">
              <span>
                <strong>Step #{stepState.step_number}:</strong> {stepState.description}
              </span>
              <span className="font-bold shrink-0">
                Traversed: {stepState.distance} cyl
              </span>
            </div>
          )}

          {/* 2D Coordinate Graph of Head Movement */}
          <div className="relative w-full h-64 border border-border rounded-xl bg-muted/10 p-4 overflow-hidden">
            <svg className="w-full h-full overflow-visible">
              {/* Cylinder Grid Lines (horizontal track lines) */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const cyl = Math.round(pct * (result.cylinder_range - 1));
                return (
                  <g key={pct}>
                    <line
                      x1={`${pct * 100}%`}
                      y1="0%"
                      x2={`${pct * 100}%`}
                      y2="100%"
                      stroke="currentColor"
                      strokeOpacity="0.1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={`${pct * 100}%`}
                      y="98%"
                      fill="currentColor"
                      opacity="0.4"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor={pct === 0 ? "start" : pct === 1 ? "end" : "middle"}
                    >
                      {cyl}
                    </text>
                  </g>
                );
              })}

              {/* Trajectory Polyline */}
              {result.head_trajectory.length > 1 && (
                <polyline
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={result.head_trajectory
                    .map((cyl, idx) => {
                      const x = (cyl / (result.cylinder_range - 1)) * 100;
                      const y = (idx / (result.head_trajectory.length - 1)) * 85 + 5;
                      return `${x}%,${y}%`;
                    })
                    .join(" ")}
                />
              )}

              {/* Points on Trajectory */}
              {result.head_trajectory.map((cyl, idx) => {
                const x = (cyl / (result.cylinder_range - 1)) * 100;
                const y = (idx / (result.head_trajectory.length - 1)) * 85 + 5;
                const isHead = idx === 0;
                const isCurrent = stepState && idx === stepState.step_number;

                return (
                  <g key={idx}>
                    <circle
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r={isCurrent ? "7" : isHead ? "5" : "4"}
                      fill={isCurrent ? "#06b6d4" : isHead ? "#10b981" : "#3b82f6"}
                      stroke="#fff"
                      strokeWidth={isCurrent ? "2" : "1"}
                    />
                    <text
                      x={`${x}%`}
                      y={`${y - 3}%`}
                      fill="currentColor"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {cyl}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Comparison Table: SCAN vs C-SCAN vs LOOK */}
      {comparison.scan && comparison.cscan && comparison.look && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Disk Scheduling Comparison (Same Request Queue)
            </h3>
            <button
              onClick={handleGenerateReportClick}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Lab Report</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Total Head Movement</th>
                  <th className="py-2.5 px-3">Average Seek Distance</th>
                  <th className="py-2.5 px-3">Service Sequence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {[
                  { name: "SCAN (Elevator)", res: comparison.scan },
                  { name: "C-SCAN (Circular)", res: comparison.cscan },
                  { name: "LOOK", res: comparison.look },
                ].map((row) => (
                  <tr
                    key={row.name}
                    className={`hover:bg-muted/20 ${
                      algorithm === (row.name.startsWith("C-SCAN") ? "C-SCAN" : row.name.startsWith("LOOK") ? "LOOK" : "SCAN")
                        ? "bg-muted/30 font-bold"
                        : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-foreground">{row.name}</td>
                    <td className="py-2.5 px-3 text-cyan-500 font-bold">{row.res.total_head_movement} cylinders</td>
                    <td className="py-2.5 px-3">{row.res.avg_head_movement} cyl/req</td>
                    <td className="py-2.5 px-3 text-muted-foreground truncate max-w-md">
                      [{row.res.service_order.join(", ")}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
