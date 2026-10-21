import React, { useState, useEffect } from "react";
import {
  Binary,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Layers,
  ChevronRight,
  Info
} from "lucide-react";
import {
  MemoryBlockInput,
  MemoryProcessInput,
  MemoryAllocationResponse
} from "../../types";
import { api } from "../../services/api";

interface MemoryAllocationViewProps {
  onGenerateReport?: (reportData: any) => void;
}

export const MemoryAllocationView: React.FC<MemoryAllocationViewProps> = ({ onGenerateReport }) => {
  const [algorithm, setAlgorithm] = useState<"FIRST_FIT" | "BEST_FIT" | "WORST_FIT">("FIRST_FIT");

  // Blocks & Processes inputs
  const [blocks, setBlocks] = useState<MemoryBlockInput[]>([
    { id: 1, size: 100 },
    { id: 2, size: 500 },
    { id: 3, size: 200 },
    { id: 4, size: 300 },
    { id: 5, size: 600 },
  ]);

  const [processes, setProcesses] = useState<MemoryProcessInput[]>([
    { id: "P1", size: 212 },
    { id: "P2", size: 417 },
    { id: "P3", size: 112 },
    { id: "P4", size: 426 },
  ]);

  const [result, setResult] = useState<MemoryAllocationResponse | null>(null);
  const [comparison, setComparison] = useState<{
    firstFit?: MemoryAllocationResponse;
    bestFit?: MemoryAllocationResponse;
    worstFit?: MemoryAllocationResponse;
  }>({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const runSimulation = async () => {
    try {
      setLoading(true);
      const [currentRes, ff, bf, wf] = await Promise.all([
        api.simulateMemory({ algorithm, blocks, processes }),
        api.simulateMemory({ algorithm: "FIRST_FIT", blocks, processes }),
        api.simulateMemory({ algorithm: "BEST_FIT", blocks, processes }),
        api.simulateMemory({ algorithm: "WORST_FIT", blocks, processes }),
      ]);
      setResult(currentRes);
      setComparison({ firstFit: ff, bestFit: bf, worstFit: wf });
      setCurrentStep(currentRes.steps.length - 1);
    } catch (err: any) {
      alert(err.message || "Memory allocation simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [algorithm]);

  const loadExample = () => {
    setBlocks([
      { id: 1, size: 100 },
      { id: 2, size: 500 },
      { id: 3, size: 200 },
      { id: 4, size: 300 },
      { id: 5, size: 600 },
    ]);
    setProcesses([
      { id: "P1", size: 212 },
      { id: "P2", size: 417 },
      { id: "P3", size: 112 },
      { id: "P4", size: 426 },
    ]);
  };

  const handleAddBlock = () => {
    const nextId = blocks.length + 1;
    setBlocks([...blocks, { id: nextId, size: 250 }]);
  };

  const handleAddProcess = () => {
    const nextNum = processes.length + 1;
    setProcesses([...processes, { id: `P${nextNum}`, size: 150 }]);
  };

  const stepState = result?.steps[currentStep];

  const handleGenerateReportClick = () => {
    if (!result) return;
    const reportData = {
      experiment_no: 2,
      title: `Week 2: Memory Allocation Strategies (${algorithm.replace("_", " ")})`,
      category: "memory_allocation",
      algorithm_name: algorithm,
      aim: `To simulate and evaluate memory block placement strategies (${algorithm.replace("_", " ")}).`,
      description: `In fixed and variable memory partition systems, the OS must choose among available free blocks to house incoming processes. First Fit picks the first block with sufficient size; Best Fit chooses the smallest block leaving minimum fragmentation; Worst Fit chooses the largest block leaving maximum leftover partition.`,
      input_summary: {
        algorithm,
        blocks,
        processes
      },
      result_summary: {
        allocated_count: result.allocated_count,
        unallocated_count: result.unallocated_count,
        total_memory: `${result.total_memory} KB`,
        allocated_memory: `${result.allocated_memory} KB`,
        internal_fragmentation: `${result.internal_fragmentation} KB`,
        unused_memory: `${result.external_or_unused_memory} KB`,
        blocks_state: result.blocks_state
      },
      conclusion: `Execution of ${algorithm.replace("_", " ")} resulted in ${result.allocated_count} allocated processes and ${result.internal_fragmentation} KB of internal fragmentation. Comparison confirmed distinct partition retention profiles across First, Best, and Worst fit.`
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
            <Binary className="w-5 h-5 text-emerald-500" />
            <span>Memory Allocation Simulator</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Week 2 Syllabus &bull; Variable-partition block model with internal fragmentation visualizer
          </p>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
          {(["FIRST_FIT", "BEST_FIT", "WORST_FIT"] as const).map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                algorithm === algo
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {algo.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Input Blocks & Processes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Memory Blocks Configuration */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Memory Blocks ({blocks.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={loadExample}
                className="text-[11px] text-primary hover:underline"
              >
                Reset Example
              </button>
              <button
                onClick={handleAddBlock}
                className="px-2 py-1 rounded border border-border bg-muted/40 text-xs text-foreground flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Block
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {blocks.map((b, idx) => (
              <div key={b.id} className="flex items-center gap-2 text-xs font-mono">
                <span className="w-20 text-muted-foreground">Block {b.id}:</span>
                <input
                  type="number"
                  min={10}
                  value={b.size}
                  onChange={(e) => {
                    const updated = [...blocks];
                    updated[idx].size = Math.max(1, parseInt(e.target.value) || 1);
                    setBlocks(updated);
                  }}
                  className="w-28 px-2 py-1 rounded border border-border bg-muted/30 text-foreground"
                />
                <span className="text-muted-foreground text-[11px]">KB</span>
                <button
                  onClick={() => setBlocks(blocks.filter((_, i) => i !== idx))}
                  disabled={blocks.length <= 1}
                  className="p-1 text-muted-foreground hover:text-red-500 ml-auto disabled:opacity-30"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Process Queue Configuration */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Processes to Allocate ({processes.length})
            </span>
            <button
              onClick={handleAddProcess}
              className="px-2 py-1 rounded border border-border bg-muted/40 text-xs text-foreground flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Process
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {processes.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-mono">
                <input
                  type="text"
                  value={p.id}
                  onChange={(e) => {
                    const updated = [...processes];
                    updated[idx].id = e.target.value;
                    setProcesses(updated);
                  }}
                  className="w-16 px-2 py-1 rounded border border-border bg-muted/30 text-foreground font-semibold"
                />
                <input
                  type="number"
                  min={1}
                  value={p.size}
                  onChange={(e) => {
                    const updated = [...processes];
                    updated[idx].size = Math.max(1, parseInt(e.target.value) || 1);
                    setProcesses(updated);
                  }}
                  className="w-28 px-2 py-1 rounded border border-border bg-muted/30 text-foreground"
                />
                <span className="text-muted-foreground text-[11px]">KB</span>
                <button
                  onClick={() => setProcesses(processes.filter((_, i) => i !== idx))}
                  disabled={processes.length <= 1}
                  className="p-1 text-muted-foreground hover:text-red-500 ml-auto disabled:opacity-30"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={runSimulation}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-all"
        >
          {loading ? "Calculating..." : "Run Allocation Simulation"}
        </button>
      </div>

      {/* Proportional Memory Blocks Visualizer */}
      {result && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Proportional Memory Partition Map
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Visual representation of physical blocks, process occupancy, and internal fragmentation
              </p>
            </div>

            {/* Step navigation */}
            {result.steps.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  Step {currentStep + 1} of {result.steps.length}
                </span>
                <div className="flex gap-1">
                  {result.steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`w-6 h-6 rounded font-mono text-[11px] font-bold ${
                        currentStep === i
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step description banner */}
          {stepState && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                stepState.status === "allocated"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-red-500/10 border-red-500/30 text-red-500"
              }`}
            >
              <div className="flex items-center gap-2">
                {stepState.status === "allocated" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>
                  <strong>Process {stepState.process_id}</strong> ({stepState.process_size} KB): {stepState.reason}
                </span>
              </div>
            </div>
          )}

          {/* Visual Memory Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {(stepState ? stepState.blocks_state : result.blocks_state).map((b) => {
              const hasProcess = b.allocated_process_id !== null;
              const usedPct = hasProcess
                ? Math.round((b.allocated_process_size / b.initial_size) * 100)
                : 0;
              const fragPct = 100 - usedPct;

              return (
                <div
                  key={b.block_id}
                  className="rounded-xl border border-border bg-card p-3 space-y-3 flex flex-col justify-between hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground font-mono">Block {b.block_id}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {b.initial_size} KB
                    </span>
                  </div>

                  {/* Vertical / Horizontal progress bar showing process and fragment */}
                  <div className="w-full h-24 rounded-lg bg-muted/40 border border-border flex flex-col overflow-hidden relative font-mono text-[10px]">
                    {hasProcess ? (
                      <>
                        <div
                          style={{ height: `${usedPct}%` }}
                          className="bg-emerald-600 text-white flex items-center justify-center font-bold transition-all duration-300"
                          title={`Process ${b.allocated_process_id} (${b.allocated_process_size} KB)`}
                        >
                          {b.allocated_process_id} ({b.allocated_process_size}KB)
                        </div>
                        {b.internal_fragmentation > 0 && (
                          <div
                            style={{ height: `${fragPct}%` }}
                            className="bg-amber-500/20 text-amber-500 border-t border-dashed border-amber-500/40 flex items-center justify-center font-medium"
                            title={`Internal Fragmentation: ${b.internal_fragmentation} KB`}
                          >
                            Frag: {b.internal_fragmentation}KB
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground font-medium">
                        FREE
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground font-mono space-y-0.5">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <strong className={hasProcess ? "text-emerald-500" : "text-muted-foreground"}>
                        {hasProcess ? "Occupied" : "Available"}
                      </strong>
                    </div>
                    {hasProcess && (
                      <div className="flex justify-between">
                        <span>Internal Frag:</span>
                        <span className="text-amber-500 font-bold">{b.internal_fragmentation} KB</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Educational Note on Internal vs External Fragmentation */}
          <div className="p-3.5 rounded-lg bg-muted/30 border border-border flex items-start gap-2.5 text-xs text-muted-foreground">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Theoretical Note on Fragmentation:</strong> In fixed-block partition allocation, any unused portion of an assigned block is internal fragmentation because that space cannot be granted to another process. In pure variable partitioning, memory is carved to exact sizes without internal fragmentation; remaining blocks constitute unused memory.
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table: First Fit vs Best Fit vs Worst Fit */}
      {comparison.firstFit && comparison.bestFit && comparison.worstFit && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Algorithm Strategy Comparison (Same Input Blocks & Processes)
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
                  <th className="py-2.5 px-3">Strategy</th>
                  <th className="py-2.5 px-3">Allocated Processes</th>
                  <th className="py-2.5 px-3">Allocation Failures</th>
                  <th className="py-2.5 px-3">Allocated Memory</th>
                  <th className="py-2.5 px-3">Internal Fragmentation</th>
                  <th className="py-2.5 px-3">Unused Free Memory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {[
                  { name: "First Fit", res: comparison.firstFit },
                  { name: "Best Fit", res: comparison.bestFit },
                  { name: "Worst Fit", res: comparison.worstFit },
                ].map((row) => (
                  <tr
                    key={row.name}
                    className={`hover:bg-muted/20 ${
                      algorithm.replace("_", " ") === row.name.toUpperCase() ? "bg-muted/30 font-bold" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-foreground">{row.name}</td>
                    <td className="py-2.5 px-3 text-emerald-500">{row.res.allocated_count} / {processes.length}</td>
                    <td className="py-2.5 px-3 text-red-500">{row.res.unallocated_count}</td>
                    <td className="py-2.5 px-3">{row.res.allocated_memory} KB</td>
                    <td className="py-2.5 px-3 text-amber-500">{row.res.internal_fragmentation} KB</td>
                    <td className="py-2.5 px-3">{row.res.external_or_unused_memory} KB</td>
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
