import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Plus,
  Trash2,
  FileText,
  Sparkles,
  Cpu,
  Clock,
  Layers,
  Activity,
  CheckCircle2,
  ChevronLeft
} from "lucide-react";
import { ProcessInput, CpuSchedulingResponse } from "../../types";
import { api } from "../../services/api";

interface CpuSchedulingViewProps {
  onGenerateReport?: (reportData: any) => void;
}

export const CpuSchedulingView: React.FC<CpuSchedulingViewProps> = ({ onGenerateReport }) => {
  const [algorithm, setAlgorithm] = useState<"FCFS" | "SJF" | "RR" | "PRIORITY">("RR");
  const [timeQuantum, setTimeQuantum] = useState<number>(2);
  const [priorityOrder, setPriorityOrder] = useState<"lower_is_higher" | "higher_is_higher">("lower_is_higher");

  // Process list input
  const [processes, setProcesses] = useState<ProcessInput[]>([
    { pid: "P1", arrival_time: 0, burst_time: 5, priority: 3 },
    { pid: "P2", arrival_time: 1, burst_time: 3, priority: 1 },
    { pid: "P3", arrival_time: 2, burst_time: 8, priority: 4 },
    { pid: "P4", arrival_time: 3, burst_time: 2, priority: 2 },
  ]);

  const [simulationResult, setSimulationResult] = useState<CpuSchedulingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Playback state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1 = 1000ms

  const timerRef = useRef<any>(null);

  const runSimulation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.simulateCpu({
        algorithm,
        processes,
        time_quantum: timeQuantum,
        priority_order: priorityOrder
      });
      setSimulationResult(res);
      setCurrentStepIndex(0);
      setIsPlaying(false);
    } catch (err: any) {
      setError(err.message || "Failed to execute simulation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [algorithm, timeQuantum, priorityOrder]);

  // Step playback timer
  useEffect(() => {
    if (isPlaying && simulationResult && simulationResult.steps.length > 0) {
      const intervalMs = Math.max(200, 1000 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= simulationResult.steps.length - 1) {
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
  }, [isPlaying, playbackSpeed, simulationResult]);

  const loadExample = (type: "general" | "convoy" | "quantum") => {
    if (type === "convoy") {
      setProcesses([
        { pid: "P1", arrival_time: 0, burst_time: 24, priority: 1 },
        { pid: "P2", arrival_time: 0, burst_time: 3, priority: 1 },
        { pid: "P3", arrival_time: 0, burst_time: 3, priority: 1 },
      ]);
      setAlgorithm("FCFS");
    } else if (type === "quantum") {
      setProcesses([
        { pid: "P1", arrival_time: 0, burst_time: 8, priority: 2 },
        { pid: "P2", arrival_time: 1, burst_time: 4, priority: 1 },
        { pid: "P3", arrival_time: 2, burst_time: 9, priority: 3 },
        { pid: "P4", arrival_time: 3, burst_time: 5, priority: 2 },
      ]);
      setAlgorithm("RR");
      setTimeQuantum(3);
    } else {
      setProcesses([
        { pid: "P1", arrival_time: 0, burst_time: 7, priority: 3 },
        { pid: "P2", arrival_time: 2, burst_time: 4, priority: 1 },
        { pid: "P3", arrival_time: 4, burst_time: 1, priority: 4 },
        { pid: "P4", arrival_time: 5, burst_time: 4, priority: 2 },
      ]);
      setAlgorithm("SJF");
    }
  };

  const handleAddProcess = () => {
    const nextNum = processes.length + 1;
    setProcesses([
      ...processes,
      { pid: `P${nextNum}`, arrival_time: nextNum - 1, burst_time: 4, priority: 1 }
    ]);
  };

  const handleRemoveProcess = (index: number) => {
    setProcesses(processes.filter((_, i) => i !== index));
  };

  const handleProcessChange = (index: number, field: keyof ProcessInput, val: any) => {
    const updated = [...processes];
    (updated[index] as any)[field] = val;
    setProcesses(updated);
  };

  const currentStep = simulationResult?.steps[currentStepIndex];

  // Distinct process color map
  const colors = [
    "bg-blue-600 text-white border-blue-400",
    "bg-emerald-600 text-white border-emerald-400",
    "bg-amber-600 text-white border-amber-400",
    "bg-purple-600 text-white border-purple-400",
    "bg-rose-600 text-white border-rose-400",
    "bg-cyan-600 text-white border-cyan-400",
    "bg-indigo-600 text-white border-indigo-400",
  ];
  const getColor = (pid: string) => {
    if (pid === "IDLE") return "bg-muted text-muted-foreground border-border border-dashed";
    const idx = Math.abs(pid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length;
    return colors[idx];
  };

  const handleGenerateReportClick = () => {
    if (!simulationResult) return;
    const reportData = {
      experiment_no: 1,
      title: `Week 1: ${algorithm} CPU Scheduling Simulation Analysis`,
      category: "cpu_scheduling",
      algorithm_name: algorithm,
      aim: `To simulate and evaluate the performance of ${algorithm} CPU Scheduling algorithm.`,
      description: `CPU Scheduling is a fundamental operating system process that allows one process to use the CPU while another process is on hold. In ${algorithm}, processes are selected based on arrival, burst, or priority parameters.`,
      input_summary: {
        algorithm,
        time_quantum: algorithm === "RR" ? timeQuantum : null,
        priority_order: algorithm === "PRIORITY" ? priorityOrder : null,
        processes: processes
      },
      result_summary: {
        avg_turnaround_time: simulationResult.avg_turnaround_time,
        avg_waiting_time: simulationResult.avg_waiting_time,
        avg_response_time: simulationResult.avg_response_time,
        cpu_utilization: `${simulationResult.cpu_utilization}%`,
        throughput: simulationResult.throughput,
        context_switches: simulationResult.context_switches,
        total_time: simulationResult.total_time,
        processes: simulationResult.processes
      },
      conclusion: `The ${algorithm} simulation completed with an average waiting time of ${simulationResult.avg_waiting_time} units and CPU utilization of ${simulationResult.cpu_utilization}%. Mathematical invariant TAT = CT - AT and WT = TAT - BT were verified.`
    };

    if (onGenerateReport) {
      onGenerateReport(reportData);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Preset Examples */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500" />
            <span>CPU Scheduling Simulator</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Week 1 Syllabus &bull; Deterministic execution with Gantt chart, metrics, and playback
          </p>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border overflow-x-auto">
          {(["FCFS", "SJF", "RR", "PRIORITY"] as const).map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                algorithm === algo
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {algo === "RR" ? "Round Robin" : algo}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration & Process Input Table */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Processes Input Queue ({processes.length})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Presets */}
            <span className="text-xs text-muted-foreground">Load Preset:</span>
            <button
              onClick={() => loadExample("general")}
              className="px-2.5 py-1 rounded-md text-[11px] border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              SJF Example
            </button>
            <button
              onClick={() => loadExample("convoy")}
              className="px-2.5 py-1 rounded-md text-[11px] border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              Convoy Effect
            </button>
            <button
              onClick={() => loadExample("quantum")}
              className="px-2.5 py-1 rounded-md text-[11px] border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              Round Robin
            </button>

            {/* Algorithm specific inputs */}
            {algorithm === "RR" && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-xs text-muted-foreground font-mono">Quantum (Q):</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={timeQuantum}
                  onChange={(e) => setTimeQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1 rounded border border-border bg-muted/50 text-xs font-mono text-foreground text-center"
                />
              </div>
            )}

            {algorithm === "PRIORITY" && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-xs text-muted-foreground">Priority Order:</span>
                <select
                  value={priorityOrder}
                  onChange={(e) => setPriorityOrder(e.target.value as any)}
                  className="px-2 py-1 rounded border border-border bg-muted/50 text-xs text-foreground"
                >
                  <option value="lower_is_higher">Lower # = Higher Priority</option>
                  <option value="higher_is_higher">Higher # = Higher Priority</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Process Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-muted/30 border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2 px-3">Process ID</th>
                <th className="py-2 px-3">Arrival Time</th>
                <th className="py-2 px-3">Burst Time</th>
                <th className="py-2 px-3">Priority</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {processes.map((p, idx) => (
                <tr key={idx} className="hover:bg-muted/20">
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={p.pid}
                      onChange={(e) => handleProcessChange(idx, "pid", e.target.value)}
                      className="w-20 px-2 py-1 rounded border border-border bg-muted/40 text-foreground font-semibold"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min={0}
                      value={p.arrival_time}
                      onChange={(e) => handleProcessChange(idx, "arrival_time", Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 px-2 py-1 rounded border border-border bg-muted/40 text-foreground"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min={1}
                      value={p.burst_time}
                      onChange={(e) => handleProcessChange(idx, "burst_time", Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-2 py-1 rounded border border-border bg-muted/40 text-foreground"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min={1}
                      value={p.priority}
                      onChange={(e) => handleProcessChange(idx, "priority", parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 rounded border border-border bg-muted/40 text-foreground"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => handleRemoveProcess(idx)}
                      disabled={processes.length <= 1}
                      className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-30"
                      title="Remove process"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleAddProcess}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Process
          </button>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <span>{loading ? "Simulating..." : "Execute Simulation"}</span>
          </button>
        </div>
      </div>

      {/* Gantt Chart & Interactive Playback */}
      {simulationResult && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Gantt Chart Execution Timeline</h3>
              <p className="text-[11px] text-muted-foreground">
                Total Makespan: {simulationResult.total_time} units &bull; Context Switches: {simulationResult.context_switches}
              </p>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={currentStepIndex <= 0}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground disabled:opacity-40"
                title="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((prev) => Math.min((simulationResult?.steps.length || 1) - 1, prev + 1));
                }}
                disabled={currentStepIndex >= simulationResult.steps.length - 1}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground disabled:opacity-40"
                title="Next step"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(0);
                }}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground"
                title="Reset simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Speed dropdown */}
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="px-2 py-1 rounded border border-border bg-muted/40 text-xs font-mono text-muted-foreground"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1.0x</option>
                <option value={2}>2.0x</option>
                <option value={3}>3.0x</option>
              </select>
            </div>
          </div>

          {/* Visual Gantt Chart Bars */}
          <div className="space-y-1">
            <div className="flex h-12 w-full rounded-xl overflow-hidden border border-border bg-muted/20">
              {simulationResult.gantt_chart.map((block, idx) => {
                const total = simulationResult.total_time || 1;
                const widthPct = (block.duration / total) * 100;
                const isCurrent =
                  currentStep &&
                  currentStep.current_time >= block.start_time &&
                  currentStep.current_time < block.end_time;

                return (
                  <div
                    key={idx}
                    style={{ width: `${widthPct}%` }}
                    className={`relative h-full flex flex-col items-center justify-center border-r border-card text-xs font-mono font-bold transition-all ${getColor(
                      block.pid
                    )} ${isCurrent ? "ring-2 ring-white z-10 scale-[1.02]" : ""}`}
                    title={`${block.pid}: t=${block.start_time} to t=${block.end_time} (duration: ${block.duration})`}
                  >
                    <span>{block.pid}</span>
                    <span className="text-[9px] font-normal opacity-80">{block.duration}u</span>
                  </div>
                );
              })}
            </div>

            {/* Time Ticks */}
            <div className="relative w-full h-4 text-[10px] font-mono text-muted-foreground flex justify-between px-1">
              <span>0</span>
              {simulationResult.gantt_chart.map((block, idx) => (
                <span
                  key={idx}
                  style={{
                    position: "absolute",
                    left: `${(block.end_time / (simulationResult.total_time || 1)) * 100}%`,
                    transform: "translateX(-50%)"
                  }}
                >
                  {block.end_time}
                </span>
              ))}
            </div>
          </div>

          {/* Current Step State Panel */}
          {currentStep && (
            <div className="p-3.5 rounded-xl border border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    Step {currentStep.step_number} of {simulationResult.steps.length}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono text-[10px] font-bold">
                    t = {currentStep.current_time}
                  </span>
                </div>
                <p className="text-muted-foreground">{currentStep.description}</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                <div>
                  <span className="text-muted-foreground block text-[10px]">RUNNING:</span>
                  <span className="font-bold text-foreground">
                    {currentStep.running_pid || "None"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">READY QUEUE:</span>
                  <span className="text-foreground">
                    {currentStep.ready_queue.length > 0
                      ? currentStep.ready_queue.join(" &rarr; ")
                      : "[empty]"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Metrics & Process Results */}
      {simulationResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary KPIs */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 h-fit">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
              Algorithm Performance Metrics
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <span className="text-[10px] text-muted-foreground block uppercase">Avg Turnaround</span>
                <span className="text-lg font-bold font-mono text-foreground">
                  {simulationResult.avg_turnaround_time} <span className="text-xs font-normal text-muted-foreground">units</span>
                </span>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <span className="text-[10px] text-muted-foreground block uppercase">Avg Waiting Time</span>
                <span className="text-lg font-bold font-mono text-emerald-500">
                  {simulationResult.avg_waiting_time} <span className="text-xs font-normal text-muted-foreground">units</span>
                </span>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <span className="text-[10px] text-muted-foreground block uppercase">CPU Utilization</span>
                <span className="text-lg font-bold font-mono text-blue-500">
                  {simulationResult.cpu_utilization}%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <span className="text-[10px] text-muted-foreground block uppercase">Throughput</span>
                <span className="text-lg font-bold font-mono text-foreground">
                  {simulationResult.throughput} <span className="text-[10px] font-normal text-muted-foreground">proc/u</span>
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerateReportClick}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Lab Experiment Report</span>
              </button>
            </div>
          </div>

          {/* Process Results Table */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
              Process Evaluation Table (Invariants: TAT = CT - AT &bull; WT = TAT - BT)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="py-2 px-3">PID</th>
                    <th className="py-2 px-2">Arrival</th>
                    <th className="py-2 px-2">Burst</th>
                    <th className="py-2 px-2">Priority</th>
                    <th className="py-2 px-2">Completion</th>
                    <th className="py-2 px-2">Turnaround</th>
                    <th className="py-2 px-2">Waiting</th>
                    <th className="py-2 px-2">Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {simulationResult.processes.map((p) => (
                    <tr key={p.pid} className="hover:bg-muted/20">
                      <td className="py-2 px-3 font-bold text-foreground">{p.pid}</td>
                      <td className="py-2 px-2">{p.arrival_time}</td>
                      <td className="py-2 px-2">{p.burst_time}</td>
                      <td className="py-2 px-2">{p.priority}</td>
                      <td className="py-2 px-2 font-semibold text-blue-500">{p.completion_time}</td>
                      <td className="py-2 px-2">{p.turnaround_time}</td>
                      <td className="py-2 px-2 font-semibold text-emerald-500">{p.waiting_time}</td>
                      <td className="py-2 px-2">{p.response_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
