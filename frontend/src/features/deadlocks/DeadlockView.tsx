import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  FileText,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  ArrowRight,
  Send
} from "lucide-react";
import {
  BankersResponse,
  DeadlockDetectionResponse
} from "../../types";
import { api } from "../../services/api";

interface DeadlockViewProps {
  onGenerateReport?: (reportData: any) => void;
}

export const DeadlockView: React.FC<DeadlockViewProps> = ({ onGenerateReport }) => {
  const [activeTab, setActiveTab] = useState<"bankers" | "detection">("bankers");

  // ----------------- Banker's Algorithm State -----------------
  const [bankerProcesses, setBankerProcesses] = useState<string[]>(["P0", "P1", "P2", "P3", "P4"]);
  const [resourceTypes, setResourceTypes] = useState<string[]>(["A", "B", "C"]);
  const [available, setAvailable] = useState<number[]>([3, 3, 2]);
  const [allocation, setAllocation] = useState<number[][]>([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2]
  ]);
  const [maxDemand, setMaxDemand] = useState<number[][]>([
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3]
  ]);

  // Resource Request test inputs
  const [requestProcess, setRequestProcess] = useState<string>("P1");
  const [requestVector, setRequestVector] = useState<number[]>([1, 0, 2]);

  const [bankersResult, setBankersResult] = useState<BankersResponse | null>(null);
  const [bankersLoading, setBankersLoading] = useState(false);

  // ----------------- Deadlock Detection State -----------------
  const [detectProcesses, setDetectProcesses] = useState<string[]>(["P0", "P1", "P2", "P3", "P4"]);
  const [detectAvailable, setDetectAvailable] = useState<number[]>([0, 0, 0]);
  const [detectAllocation, setDetectAllocation] = useState<number[][]>([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 3],
    [2, 1, 1],
    [0, 0, 2]
  ]);
  const [detectRequest, setDetectRequest] = useState<number[][]>([
    [0, 0, 0],
    [2, 0, 2],
    [0, 0, 0],
    [1, 0, 0],
    [0, 0, 2]
  ]);

  const [detectionResult, setDetectionResult] = useState<DeadlockDetectionResponse | null>(null);
  const [detectionLoading, setDetectionLoading] = useState(false);

  // Run Banker's
  const runBankers = async (withRequest: boolean = false) => {
    try {
      setBankersLoading(true);
      const payload: any = {
        processes: bankerProcesses,
        resource_types: resourceTypes,
        available,
        allocation,
        max_demand: maxDemand
      };
      if (withRequest) {
        payload.resource_request = {
          process: requestProcess,
          request: requestVector
        };
      }
      const res = await api.simulateBankers(payload);
      setBankersResult(res);
    } catch (err: any) {
      alert(err.message || "Banker's algorithm failed.");
    } finally {
      setBankersLoading(false);
    }
  };

  // Run Detection
  const runDetection = async () => {
    try {
      setDetectionLoading(true);
      const res = await api.simulateDeadlockDetection({
        processes: detectProcesses,
        resource_types: resourceTypes,
        available: detectAvailable,
        allocation: detectAllocation,
        request_matrix: detectRequest
      });
      setDetectionResult(res);
    } catch (err: any) {
      alert(err.message || "Deadlock detection failed.");
    } finally {
      setDetectionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "bankers") {
      runBankers(false);
    } else {
      runDetection();
    }
  }, [activeTab]);

  const resetBankersPreset = () => {
    setBankerProcesses(["P0", "P1", "P2", "P3", "P4"]);
    setResourceTypes(["A", "B", "C"]);
    setAvailable([3, 3, 2]);
    setAllocation([
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2]
    ]);
    setMaxDemand([
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3]
    ]);
    setRequestProcess("P1");
    setRequestVector([1, 0, 2]);
  };

  const handleGenerateReportClick = () => {
    const isBanker = activeTab === "bankers";
    const reportData = {
      experiment_no: 4,
      title: isBanker
        ? "Week 4: Deadlock Avoidance using Banker's Algorithm"
        : "Week 4: Deadlock Detection & Recovery Evaluation",
      category: "deadlocks",
      algorithm_name: isBanker ? "Bankers Algorithm" : "Deadlock Detection",
      aim: isBanker
        ? "To simulate and test deadlock avoidance using Dijkstra's Banker's algorithm."
        : "To detect circular wait deadlocks using the Work and Finish vector algorithm.",
      description: isBanker
        ? "Banker's Algorithm is a resource allocation and deadlock avoidance algorithm that tests for safety by simulating the allocation for predetermined maximum possible amounts of all resources."
        : "Deadlock detection examines current allocation and pending request matrices to identify any processes locked in an irrecoverable state.",
      input_summary: isBanker
        ? {
            processes: bankerProcesses,
            resources: resourceTypes,
            available,
            allocation,
            max_demand: maxDemand
          }
        : {
            processes: detectProcesses,
            resources: resourceTypes,
            available: detectAvailable,
            allocation: detectAllocation,
            request_matrix: detectRequest
          },
      result_summary: isBanker
        ? {
            is_safe: bankersResult?.is_safe,
            safe_sequence: bankersResult?.safe_sequence,
            request_evaluation: bankersResult?.request_evaluation
          }
        : {
            is_deadlocked: detectionResult?.is_deadlocked,
            deadlocked_processes: detectionResult?.deadlocked_processes
          },
      conclusion: isBanker
        ? `The system state was confirmed ${bankersResult?.is_safe ? "SAFE with safe sequence: " + bankersResult?.safe_sequence.join(" -> ") : "UNSAFE"}. Requests are safely evaluated prior to state commitment.`
        : `Deadlock detection concluded with ${detectionResult?.is_deadlocked ? "DEADLOCK DETECTED for processes: " + detectionResult?.deadlocked_processes.join(", ") : "NO DEADLOCK DETECTED"}.`
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
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span>Deadlock Avoidance & Detection Simulator</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Week 4 Syllabus &bull; Banker's Safety Algorithm, Resource Request Grant Tester & Deadlock Detection
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
          <button
            onClick={() => setActiveTab("bankers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "bankers"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            A. Deadlock Avoidance (Banker's)
          </button>
          <button
            onClick={() => setActiveTab("detection")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "detection"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            B. Deadlock Detection
          </button>
        </div>
      </div>

      {activeTab === "bankers" ? (
        /* ================= PART A: BANKER'S ALGORITHM ================= */
        <div className="space-y-6">
          {/* Safe State Banner */}
          {bankersResult && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                bankersResult.is_safe
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-red-500/10 border-red-500/30 text-red-500"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {bankersResult.is_safe ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-bold">
                    System State: {bankersResult.is_safe ? "SAFE STATE" : "UNSAFE STATE"}
                  </h4>
                  {bankersResult.is_safe && (
                    <p className="text-xs font-mono mt-0.5">
                      Safe Execution Sequence:{" "}
                      <strong className="text-foreground">
                        {bankersResult.safe_sequence.join(" &rarr; ")}
                      </strong>
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleGenerateReportClick}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm shrink-0"
              >
                Generate Lab Report
              </button>
            </div>
          )}

          {/* Matrix Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Allocation Matrix */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block border-b border-border pb-1.5">
                Allocation Matrix
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="py-1 px-2">PID</th>
                      {resourceTypes.map((r) => (
                        <th key={r} className="py-1 px-2">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {bankerProcesses.map((p, i) => (
                      <tr key={p}>
                        <td className="py-1 px-2 font-bold text-foreground">{p}</td>
                        {resourceTypes.map((_, j) => (
                          <td key={j} className="py-1 px-1">
                            <input
                              type="number"
                              min={0}
                              value={allocation[i]?.[j] ?? 0}
                              onChange={(e) => {
                                const updated = allocation.map((row) => [...row]);
                                updated[i][j] = Math.max(0, parseInt(e.target.value) || 0);
                                setAllocation(updated);
                              }}
                              className="w-10 px-1 py-0.5 rounded border border-border bg-muted/30 text-center text-foreground font-mono"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Maximum Demand Matrix */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block border-b border-border pb-1.5">
                Max Demand Matrix
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="py-1 px-2">PID</th>
                      {resourceTypes.map((r) => (
                        <th key={r} className="py-1 px-2">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {bankerProcesses.map((p, i) => (
                      <tr key={p}>
                        <td className="py-1 px-2 font-bold text-foreground">{p}</td>
                        {resourceTypes.map((_, j) => (
                          <td key={j} className="py-1 px-1">
                            <input
                              type="number"
                              min={0}
                              value={maxDemand[i]?.[j] ?? 0}
                              onChange={(e) => {
                                const updated = maxDemand.map((row) => [...row]);
                                updated[i][j] = Math.max(0, parseInt(e.target.value) || 0);
                                setMaxDemand(updated);
                              }}
                              className="w-10 px-1 py-0.5 rounded border border-border bg-muted/30 text-center text-foreground font-mono"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Need Matrix (Computed = Max - Allocation) */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block border-b border-border pb-1.5">
                Need Matrix (Max &minus; Alloc)
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="py-1 px-2">PID</th>
                      {resourceTypes.map((r) => (
                        <th key={r} className="py-1 px-2">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {bankerProcesses.map((p, i) => (
                      <tr key={p}>
                        <td className="py-1 px-2 font-bold text-foreground">{p}</td>
                        {resourceTypes.map((_, j) => (
                          <td key={j} className="py-1 px-2 font-semibold text-emerald-500">
                            {bankersResult?.need_matrix?.[i]?.[j] ?? Math.max(0, (maxDemand[i]?.[j] || 0) - (allocation[i]?.[j] || 0))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Available Resource Vector */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block border-b border-border pb-1.5">
                  Available Vector
                </span>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {resourceTypes.map((r, idx) => (
                    <div key={r} className="p-2 rounded-lg bg-muted/30 border border-border text-center">
                      <span className="text-[10px] text-muted-foreground block font-mono">Type {r}</span>
                      <input
                        type="number"
                        min={0}
                        value={available[idx] ?? 0}
                        onChange={(e) => {
                          const updated = [...available];
                          updated[idx] = Math.max(0, parseInt(e.target.value) || 0);
                          setAvailable(updated);
                        }}
                        className="w-12 px-1 py-0.5 rounded border border-border bg-card text-center text-sm font-bold font-mono text-foreground mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => runBankers(false)}
                  disabled={bankersLoading}
                  className="w-full py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm"
                >
                  {bankersLoading ? "Evaluating..." : "Check System Safety"}
                </button>
                <button
                  onClick={resetBankersPreset}
                  className="w-full py-1 text-xs text-muted-foreground hover:underline"
                >
                  Reset Textbook Preset
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Resource Request Grant Tester */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2.5 flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-blue-500" />
              <span>Interactive Resource Request Tester</span>
            </h3>

            <p className="text-xs text-muted-foreground">
              Simulate an incoming resource request from a process. The algorithm validates if Request &le; Need and Request &le; Available, then pretends to allocate resources and verifies if the resulting state remains safe.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground font-mono">Process:</span>
                <select
                  value={requestProcess}
                  onChange={(e) => setRequestProcess(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border text-xs text-foreground font-bold"
                >
                  {bankerProcesses.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-muted-foreground">Request Vector [A, B, C]:</span>
                {resourceTypes.map((r, idx) => (
                  <input
                    key={r}
                    type="number"
                    min={0}
                    value={requestVector[idx] ?? 0}
                    onChange={(e) => {
                      const updated = [...requestVector];
                      updated[idx] = Math.max(0, parseInt(e.target.value) || 0);
                      setRequestVector(updated);
                    }}
                    className="w-12 px-2 py-1 rounded-lg border border-border bg-muted/40 text-center font-bold text-foreground"
                  />
                ))}
              </div>

              <button
                onClick={() => runBankers(true)}
                disabled={bankersLoading}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"
              >
                <span>Evaluate & Test Request</span>
              </button>
            </div>

            {/* Request Evaluation Output Banner */}
            {bankersResult?.request_evaluation && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono mt-3 ${
                  bankersResult.request_evaluation.granted
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    : "bg-red-500/10 border-red-500/30 text-red-500"
                }`}
              >
                <strong>Evaluation Outcome: </strong>
                <span>{bankersResult.request_evaluation.reason}</span>
              </div>
            )}
          </div>

          {/* Step-by-Step Safety Algorithm Trace */}
          {bankersResult && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                Banker's Safety Algorithm Step-by-Step Trace
              </h3>

              <div className="space-y-2">
                {bankersResult.safety_steps.map((st) => (
                  <div
                    key={st.step_number}
                    className="p-3 rounded-lg border border-border bg-muted/20 text-xs font-mono flex items-start gap-2.5"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold shrink-0">
                      #{st.step_number}
                    </span>
                    <div className="space-y-1">
                      <p className="text-foreground">{st.description}</p>
                      {st.can_allocate && (
                        <p className="text-[11px] text-muted-foreground">
                          Work Before: [{st.work_before.join(", ")}] + Alloc &rarr; Work After: [{st.work_after.join(", ")}]
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= PART B: DEADLOCK DETECTION ================= */
        <div className="space-y-6">
          {/* Deadlock State Banner */}
          {detectionResult && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                detectionResult.is_deadlocked
                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {detectionResult.is_deadlocked ? (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-bold">
                    Detection Result: {detectionResult.is_deadlocked ? "DEADLOCK DETECTED" : "NO DEADLOCK DETECTED"}
                  </h4>
                  {detectionResult.is_deadlocked && (
                    <p className="text-xs font-mono mt-0.5">
                      Deadlocked Processes:{" "}
                      <strong className="text-red-400">
                        {detectionResult.deadlocked_processes.join(", ")}
                      </strong>
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleGenerateReportClick}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm shrink-0"
              >
                Generate Lab Report
              </button>
            </div>
          )}

          {/* Allocation & Request Matrices for Detection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Allocation */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block border-b border-border pb-1.5">
                Current Allocation Matrix
              </span>
              <table className="w-full text-center text-xs font-mono">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="py-1">PID</th>
                    {resourceTypes.map((r) => (
                      <th key={r} className="py-1">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {detectProcesses.map((p, i) => (
                    <tr key={p}>
                      <td className="py-1 font-bold text-foreground">{p}</td>
                      {resourceTypes.map((_, j) => (
                        <td key={j} className="py-1">
                          <input
                            type="number"
                            min={0}
                            value={detectAllocation[i]?.[j] ?? 0}
                            onChange={(e) => {
                              const updated = detectAllocation.map((row) => [...row]);
                              updated[i][j] = Math.max(0, parseInt(e.target.value) || 0);
                              setDetectAllocation(updated);
                            }}
                            className="w-10 px-1 py-0.5 rounded border border-border bg-muted/30 text-center text-foreground font-mono"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Request Matrix */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block border-b border-border pb-1.5">
                Current Request Matrix
              </span>
              <table className="w-full text-center text-xs font-mono">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="py-1">PID</th>
                    {resourceTypes.map((r) => (
                      <th key={r} className="py-1">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {detectProcesses.map((p, i) => (
                    <tr key={p}>
                      <td className="py-1 font-bold text-foreground">{p}</td>
                      {resourceTypes.map((_, j) => (
                        <td key={j} className="py-1">
                          <input
                            type="number"
                            min={0}
                            value={detectRequest[i]?.[j] ?? 0}
                            onChange={(e) => {
                              const updated = detectRequest.map((row) => [...row]);
                              updated[i][j] = Math.max(0, parseInt(e.target.value) || 0);
                              setDetectRequest(updated);
                            }}
                            className="w-10 px-1 py-0.5 rounded border border-border bg-muted/30 text-center text-foreground font-mono"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Available & Trigger */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block border-b border-border pb-1.5">
                  Available Vector
                </span>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {resourceTypes.map((r, idx) => (
                    <div key={r} className="p-2 rounded-lg bg-muted/30 border border-border text-center">
                      <span className="text-[10px] text-muted-foreground block font-mono">{r}</span>
                      <input
                        type="number"
                        min={0}
                        value={detectAvailable[idx] ?? 0}
                        onChange={(e) => {
                          const updated = [...detectAvailable];
                          updated[idx] = Math.max(0, parseInt(e.target.value) || 0);
                          setDetectAvailable(updated);
                        }}
                        className="w-12 px-1 py-0.5 rounded border border-border bg-card text-center text-sm font-bold font-mono text-foreground mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={runDetection}
                disabled={detectionLoading}
                className="w-full py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm"
              >
                {detectionLoading ? "Analyzing..." : "Execute Deadlock Detection"}
              </button>
            </div>
          </div>

          {/* Detection Step Logs */}
          {detectionResult && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                Work and Finish Progression
              </h3>

              <div className="space-y-2">
                {detectionResult.steps.map((st) => (
                  <div
                    key={st.step_number}
                    className="p-3 rounded-lg border border-border bg-muted/20 text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-foreground">
                      <span className="font-bold">Step #{st.step_number}: {st.process}</span>
                      <span className="text-muted-foreground text-[11px]">
                        Work: [{st.work.join(", ")}]
                      </span>
                    </div>
                    <p className="text-muted-foreground">{st.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Educational Panel: Avoidance vs Detection */}
      <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-start gap-3 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-foreground">Deadlock Avoidance vs Deadlock Detection:</strong>
          <p>
            <strong>Avoidance (Banker's Algorithm):</strong> The OS dynamically tracks resource claims and grants requests only if the resulting state is guaranteed safe (a safe sequence exists).
          </p>
          <p>
            <strong>Detection:</strong> The OS grants resource requests immediately without checking future claims, and periodically executes the detection algorithm to discover whether a circular wait deadlock has formed.
          </p>
        </div>
      </div>
    </div>
  );
};
