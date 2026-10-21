import React, { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Trash2,
  RefreshCw,
  Plus,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { LabReport } from "../../types";
import { api } from "../../services/api";

interface LabReportsViewProps {
  initialReportData?: any;
}

export const LabReportsView: React.FC<LabReportsViewProps> = ({ initialReportData }) => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state for generating custom/manual report
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [expNo, setExpNo] = useState(1);
  const [title, setTitle] = useState("Week 1: CPU Scheduling Lab Report");
  const [category, setCategory] = useState("cpu_scheduling");
  const [algoName, setAlgoName] = useState("Round Robin");
  const [aim, setAim] = useState("To simulate and evaluate CPU scheduling algorithms on process batches.");
  const [desc, setDesc] = useState("CPU scheduling allocates processor time slices across ready processes to maximize utilization and minimize turnaround time.");
  const [conclusion, setConclusion] = useState("Simulation confirmed optimal performance with time quantum Q=2.");

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.listReports();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // If passed initial report data from one of the simulators, create it automatically!
  useEffect(() => {
    if (initialReportData) {
      const autoSave = async () => {
        try {
          const created = await api.createReport(initialReportData);
          await loadReports();
          setSelectedReport(created);
        } catch (e) {
          console.error(e);
        }
      };
      autoSave();
    }
  }, [initialReportData]);

  const handleCreateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newRep = await api.createReport({
        experiment_no: expNo,
        title,
        category,
        algorithm_name: algoName,
        aim,
        description: desc,
        input_summary: { algorithm: algoName },
        result_summary: { status: "Verified" },
        conclusion
      });
      setShowGenerateModal(false);
      await loadReports();
      setSelectedReport(newRep);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this lab report?")) return;
    try {
      await api.deleteReport(reportId);
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
      await loadReports();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <span>Operating Systems Lab Reports</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Formal experiment documentation &bull; Exportable to Markdown and Printable / PDF format
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Custom Report</span>
          </button>
        </div>
      </div>

      {/* Reports Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Index Column */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 h-fit">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Generated Reports ({reports.length})
            </span>
            <button
              onClick={loadReports}
              className="text-xs text-muted-foreground hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {reports.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              No reports generated yet. Run any algorithm simulation and click "Generate Lab Report"!
            </p>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {reports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                        : "bg-muted/30 border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                        EXP #{rep.experiment_no}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(rep.id);
                        }}
                        className="text-muted-foreground hover:text-red-500 p-1"
                        title="Delete report"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="mt-1.5">
                      <span className="text-xs font-semibold text-foreground line-clamp-1">
                        {rep.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                        {rep.algorithm_name} &bull; {new Date(rep.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Report Preview & Export */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-5">
          {!selectedReport ? (
            <div className="p-16 text-center text-muted-foreground text-xs">
              Select a report from the left sidebar to preview, export, or print.
            </div>
          ) : (
            <div>
              {/* Report Actions Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 font-bold block mb-0.5">
                    Experiment #{selectedReport.experiment_no} &bull; {selectedReport.category}
                  </span>
                  <h3 className="text-base font-bold text-foreground tracking-tight">
                    {selectedReport.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={api.getReportDownloadUrl(selectedReport.id)}
                    download={`lab_report_exp_${selectedReport.experiment_no}.md`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted text-foreground"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.md)</span>
                  </a>

                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / PDF View</span>
                  </button>
                </div>
              </div>

              {/* Rendered Lab Report Document */}
              <div
                id="printable-report"
                className="prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-4 pt-4 font-sans"
              >
                {/* Aim */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-1">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">1. Experiment Aim</h4>
                  <p className="text-muted-foreground">{selectedReport.aim}</p>
                </div>

                {/* Theory */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-1">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">2. Theoretical Background</h4>
                  <p className="text-muted-foreground leading-relaxed">{selectedReport.description}</p>
                </div>

                {/* Input Parameters */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">3. Input Parameters & Datasets</h4>
                  <pre className="p-3 rounded-lg bg-muted/40 border border-border font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedReport.input_summary, null, 2)}
                  </pre>
                </div>

                {/* Results */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">4. Computed Results & Invariants</h4>
                  <pre className="p-3 rounded-lg bg-muted/40 border border-border font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedReport.result_summary, null, 2)}
                  </pre>
                </div>

                {/* Conclusion */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider">5. Conclusion & Observations</h4>
                  <p className="leading-relaxed">{selectedReport.conclusion}</p>
                </div>

                {/* Timestamp */}
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground border-t border-border pt-3">
                  <span>Certified System Output &bull; MiniOS OS Lab</span>
                  <span>Executed: {new Date(selectedReport.created_at).toUTCString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Custom Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateReportSubmit}
            className="bg-card border border-border rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl"
          >
            <h3 className="text-sm font-semibold text-foreground">Create Lab Experiment Report</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Experiment No.</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={expNo}
                  onChange={(e) => setExpNo(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-mono text-foreground"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Algorithm Name</label>
                <input
                  type="text"
                  value={algoName}
                  onChange={(e) => setAlgoName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs text-foreground"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Report Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs text-foreground"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Aim</label>
                <textarea
                  rows={2}
                  value={aim}
                  onChange={(e) => setAim(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs text-foreground"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Theoretical Overview</label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs text-foreground"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Conclusion</label>
                <textarea
                  rows={2}
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
              >
                Save Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
