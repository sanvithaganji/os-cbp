import React, { useState, useEffect } from "react";
import {
  HardDrive,
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  RotateCcw,
  Layers,
  Link as LinkIcon,
  FolderOpen
} from "lucide-react";
import {
  SimulatedFileRecord,
  SimulatedDiskBlock,
  FileAllocationResponse,
  FileAllocationStep
} from "../../types";
import { api } from "../../services/api";

interface FileAllocationViewProps {
  onGenerateReport?: (reportData: any) => void;
}

export const FileAllocationView: React.FC<FileAllocationViewProps> = ({ onGenerateReport }) => {
  const [strategy, setStrategy] = useState<"CONTIGUOUS" | "INDEXED" | "LINKED">("CONTIGUOUS");
  const [totalBlocks, setTotalBlocks] = useState<number>(64);
  const [files, setFiles] = useState<SimulatedFileRecord[]>([]);
  const [diskGrid, setDiskGrid] = useState<SimulatedDiskBlock[]>([]);
  const [steps, setSteps] = useState<FileAllocationStep[]>([]);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [isExternalFrag, setIsExternalFrag] = useState<boolean>(false);
  const [selectedBlock, setSelectedBlock] = useState<SimulatedDiskBlock | null>(null);

  // New file input form
  const [newFileName, setNewFileName] = useState<string>("file_A.txt");
  const [newFileSize, setNewFileSize] = useState<number>(4);
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize or reset disk
  const initDisk = async (strat: "CONTIGUOUS" | "INDEXED" | "LINKED", customExisting?: any[]) => {
    try {
      setLoading(true);
      const res = await api.simulateFileAllocation({
        strategy: strat,
        total_blocks: totalBlocks,
        existing_files: customExisting || [],
      });
      setDiskGrid(res.disk_grid);
      setFiles(res.files);
      setSteps(res.steps);
      setLastMessage(res.message);
      setIsExternalFrag(res.external_fragmentation);
      setSelectedBlock(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initDisk(strategy);
  }, [strategy]);

  // Handle Allocate
  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    try {
      setLoading(true);
      const res = await api.simulateFileAllocation({
        strategy,
        total_blocks: totalBlocks,
        existing_files: files,
        file_to_allocate: {
          name: newFileName.trim(),
          size_blocks: newFileSize
        }
      });
      setDiskGrid(res.disk_grid);
      setFiles(res.files);
      setSteps(res.steps);
      setLastMessage(res.message);
      setIsExternalFrag(res.external_fragmentation);
      if (res.allocation_success) {
        // Increment name suggestion
        const nextLetter = String.fromCharCode(newFileName.charCodeAt(5) + 1 || 66);
        setNewFileName(`file_${nextLetter}.txt`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete File
  const handleDelete = async (fileName: string) => {
    try {
      setLoading(true);
      const res = await api.simulateFileAllocation({
        strategy,
        total_blocks: totalBlocks,
        existing_files: files,
        file_to_delete: fileName
      });
      setDiskGrid(res.disk_grid);
      setFiles(res.files);
      setSteps(res.steps);
      setLastMessage(res.message);
      setIsExternalFrag(res.external_fragmentation);
      if (selectedBlock?.file_name === fileName) {
        setSelectedBlock(null);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Preset to demonstrate External Fragmentation in Contiguous Allocation
  const loadFragmentationDemo = async () => {
    // Occupy every alternate 2 blocks: [0, 1], [4, 5], [8, 9]...
    const sampleFiles = [
      { name: "f1.dat", size_blocks: 2, start_block: 0, allocated_blocks: [0, 1], storage_overhead_blocks: 0 },
      { name: "f2.dat", size_blocks: 2, start_block: 4, allocated_blocks: [4, 5], storage_overhead_blocks: 0 },
      { name: "f3.dat", size_blocks: 2, start_block: 8, allocated_blocks: [8, 9], storage_overhead_blocks: 0 },
      { name: "f4.dat", size_blocks: 2, start_block: 12, allocated_blocks: [12, 13], storage_overhead_blocks: 0 },
      { name: "f5.dat", size_blocks: 2, start_block: 16, allocated_blocks: [16, 17], storage_overhead_blocks: 0 },
    ];
    setStrategy("CONTIGUOUS");
    setNewFileName("large_doc.bin");
    setNewFileSize(5); // Requesting 5 contiguous blocks when holes are only 2 blocks wide!
    await initDisk("CONTIGUOUS", sampleFiles);
  };

  // Color helper for files
  const fileColors = [
    "bg-blue-600 border-blue-400 text-white",
    "bg-emerald-600 border-emerald-400 text-white",
    "bg-purple-600 border-purple-400 text-white",
    "bg-rose-600 border-rose-400 text-white",
    "bg-amber-600 border-amber-400 text-white",
    "bg-cyan-600 border-cyan-400 text-white",
  ];
  const getFileBlockColor = (fileName: string | null) => {
    if (!fileName) return "";
    const idx = Math.abs(fileName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % fileColors.length;
    return fileColors[idx];
  };

  const freeCount = diskGrid.filter((b) => b.status === "free").length;
  const occupiedCount = totalBlocks - freeCount;

  const handleGenerateReportClick = () => {
    const reportData = {
      experiment_no: 3,
      title: `Week 3: File Allocation Strategies (${strategy})`,
      category: "file_allocation",
      algorithm_name: strategy,
      aim: `To simulate and evaluate file block allocation on disk using ${strategy} allocation.`,
      description: `File allocation strategies determine how disk blocks are assigned to files: Contiguous allocation assigns consecutive sectors allowing fast sequential access but risking external fragmentation; Indexed allocation uses an index block pointing to scattered blocks; Linked allocation stores scattered blocks where each points to the next sector in a chain.`,
      input_summary: {
        strategy,
        total_blocks: totalBlocks,
        live_files_count: files.length,
        files: files.map((f) => ({
          name: f.name,
          size_blocks: f.size_blocks,
          start_block: f.start_block,
          overhead: f.storage_overhead_blocks
        }))
      },
      result_summary: {
        total_blocks: totalBlocks,
        free_blocks: freeCount,
        occupied_blocks: occupiedCount,
        external_fragmentation: isExternalFrag,
        last_message: lastMessage
      },
      conclusion: `Demonstrated ${strategy} allocation on a simulated ${totalBlocks}-block disk. ${
        strategy === "CONTIGUOUS"
          ? "Contiguous allocation proved susceptible to external fragmentation when free blocks are dispersed non-consecutively."
          : strategy === "INDEXED"
          ? "Indexed allocation eliminated external fragmentation with a fixed 1-block storage overhead per file."
          : "Linked allocation permitted flexible block distribution with pointer overhead in each data sector."
      }`
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
            <HardDrive className="w-5 h-5 text-amber-500" />
            <span>File Allocation Strategies Simulator</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Week 3 Syllabus &bull; Visual disk-block grid with pointer links, index sectors, and external fragmentation
          </p>
        </div>

        {/* Strategy Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
          {(["CONTIGUOUS", "INDEXED", "LINKED"] as const).map((strat) => (
            <button
              key={strat}
              onClick={() => setStrategy(strat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                strategy === strat
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {strat === "CONTIGUOUS" ? "Contiguous" : strat === "INDEXED" ? "Indexed" : "Linked"}
            </button>
          ))}
        </div>
      </div>

      {/* Action / Creation Bar */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Form to allocate file */}
        <form onSubmit={handleAllocate} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">File Name:</span>
            <input
              type="text"
              required
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-32 px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-mono text-foreground"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Size (blocks):</span>
            <input
              type="number"
              min={1}
              max={24}
              value={newFileSize}
              onChange={(e) => setNewFileSize(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-mono text-foreground text-center"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Allocate File</span>
          </button>
        </form>

        {/* Preset Action Buttons */}
        <div className="flex items-center gap-2">
          {strategy === "CONTIGUOUS" && (
            <button
              onClick={loadFragmentationDemo}
              className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-semibold hover:bg-amber-500/20 transition-all"
            >
              Demonstrate External Fragmentation
            </button>
          )}

          <button
            onClick={() => initDisk(strategy)}
            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Clear all allocated blocks"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status & Alerts Banner */}
      {lastMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            isExternalFrag
              ? "bg-red-500/10 border-red-500/30 text-red-500"
              : "bg-muted/40 border-border text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            {isExternalFrag ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            )}
            <span className="font-medium">{lastMessage}</span>
          </div>

          <span className="text-[11px] font-mono shrink-0">
            Free: {freeCount} &bull; Occupied: {occupiedCount}
          </span>
        </div>
      )}

      {/* Disk Grid & File Allocation Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Disk Block Grid (64 sectors) */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Simulated Physical Disk Grid ({totalBlocks} Sectors)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Hover or click any sector to inspect its allocation record and pointer chains
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-muted/60 border border-border"></span> Free
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-600"></span> Data
              </span>
              {strategy === "INDEXED" && (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-500 ring-2 ring-amber-300"></span> Index Block
                </span>
              )}
            </div>
          </div>

          {/* 8x8 Grid of Blocks */}
          <div className="grid grid-cols-8 gap-2">
            {diskGrid.map((block) => {
              const isFree = block.status === "free";
              const isIndex = block.status === "index";
              const isSelected = selectedBlock?.block_id === block.block_id;

              return (
                <button
                  key={block.block_id}
                  onClick={() => setSelectedBlock(block)}
                  className={`relative aspect-square rounded-lg border text-xs font-mono font-bold flex flex-col items-center justify-center transition-all ${
                    isFree
                      ? "bg-muted/30 border-border/80 text-muted-foreground hover:bg-muted"
                      : isIndex
                      ? "bg-amber-500 text-white border-amber-300 ring-2 ring-amber-400/50 shadow-md"
                      : getFileBlockColor(block.file_name)
                  } ${isSelected ? "ring-2 ring-white scale-105 z-10" : ""}`}
                >
                  <span className="text-[11px]">{block.block_id}</span>
                  {!isFree && (
                    <span className="text-[9px] font-normal truncate max-w-[90%] opacity-90">
                      {isIndex ? "INDEX" : block.file_name?.split(".")[0]}
                    </span>
                  )}

                  {/* Linked pointer marker */}
                  {strategy === "LINKED" && block.next_block_id !== null && block.next_block_id !== undefined && (
                    <span className="text-[8px] font-mono opacity-80 leading-none">
                      &rarr;{block.next_block_id === -1 ? "EOF" : block.next_block_id}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Block Inspector Drawer */}
          {selectedBlock && (
            <div className="p-3.5 rounded-lg border border-border bg-muted/30 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-foreground font-bold">
                <span>Sector Block #{selectedBlock.block_id}</span>
                <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  Status: {selectedBlock.status}
                </span>
              </div>
              {selectedBlock.file_name ? (
                <>
                  <p className="text-muted-foreground">
                    Assigned File: <strong className="text-foreground">{selectedBlock.file_name}</strong>
                  </p>
                  {selectedBlock.status === "index" && selectedBlock.index_references && (
                    <p className="text-amber-500">
                      Index References: [{selectedBlock.index_references.join(", ")}]
                    </p>
                  )}
                  {selectedBlock.next_block_id !== null && selectedBlock.next_block_id !== undefined && (
                    <p className="text-blue-500">
                      Next Sector Pointer: {selectedBlock.next_block_id === -1 ? "End of File (EOF)" : `Block #${selectedBlock.next_block_id}`}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Sector is currently unallocated and free.</p>
              )}
            </div>
          )}
        </div>

        {/* Allocated Files Table */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
              File Allocation Table ({files.length} Files)
            </h3>

            {files.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No files allocated on disk. Use the form above to allocate sectors.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="p-3 rounded-lg border border-border bg-muted/20 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{file.name}</span>
                      <button
                        onClick={() => handleDelete(file.name)}
                        className="text-muted-foreground hover:text-red-500 p-1"
                        title="Delete file and reclaim sectors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{file.size_blocks} blocks</span>
                      </div>
                      {file.start_block !== undefined && (
                        <div className="flex justify-between">
                          <span>Start Sector:</span>
                          <span>Block #{file.start_block}</span>
                        </div>
                      )}
                      {file.index_block !== undefined && (
                        <div className="flex justify-between text-amber-500">
                          <span>Index Sector:</span>
                          <span>Block #{file.index_block} (1 block overhead)</span>
                        </div>
                      )}
                      <div>
                        <span>Sectors: </span>
                        <span className="text-foreground">[{file.allocated_blocks.join(", ")}]</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border">
            <button
              onClick={handleGenerateReportClick}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Lab Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Educational Comparison / Concept Panel */}
      <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-start gap-3 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-foreground">File Allocation Strategies vs Real Filesystem:</strong>
          <p>
            In modern operating systems like ext4 or NTFS, file allocation combines extent trees (contiguous stretches) with B-trees and indirect pointer blocks to deliver fast direct access without severe external fragmentation. This simulation models the core theoretical strategies outlined in the OS syllabus.
          </p>
        </div>
      </div>
    </div>
  );
};
