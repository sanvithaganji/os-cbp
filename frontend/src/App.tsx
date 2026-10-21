import React, { useState, useEffect } from "react";
import { Sidebar, NavSection } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { OverviewView } from "./features/overview/OverviewView";
import { FileManagerView } from "./features/files/FileManagerView";
import { FileProcessingView } from "./features/processing/FileProcessingView";
import { CpuSchedulingView } from "./features/cpu-scheduling/CpuSchedulingView";
import { MemoryAllocationView } from "./features/memory-allocation/MemoryAllocationView";
import { FileAllocationView } from "./features/file-allocation/FileAllocationView";
import { DeadlockView } from "./features/deadlocks/DeadlockView";
import { PageReplacementView } from "./features/page-replacement/PageReplacementView";
import { DiskSchedulingView } from "./features/disk-scheduling/DiskSchedulingView";
import { LabReportsView } from "./features/reports/LabReportsView";
import { SettingsView } from "./features/settings/SettingsView";
import { StorageStats } from "./types";
import { api } from "./services/api";

export function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>("overview");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("minios_theme") === "dark" || true; // default dark developer mode
  });
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [openCreateFileModal, setOpenCreateFileModal] = useState<boolean>(false);
  const [pendingReportData, setPendingReportData] = useState<any>(null);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("minios_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("minios_theme", "light");
    }
  }, [darkMode]);

  const fetchStorageStats = async () => {
    try {
      const stats = await api.getStorageStats();
      setStorageStats(stats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStorageStats();
  }, []);

  const handleGenerateReport = (reportData: any) => {
    setPendingReportData(reportData);
    setCurrentSection("reports");
  };

  const handleNewFile = () => {
    if (currentSection !== "files") {
      setCurrentSection("files");
    }
    setOpenCreateFileModal(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Persistent Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        storageStats={storageStats}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Persistent Top Header */}
        <Header
          currentSection={currentSection}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onNewFileClick={handleNewFile}
          onRefreshData={fetchStorageStats}
        />

        {/* Viewport Router */}
        <main className="flex-1 overflow-y-auto">
          {currentSection === "overview" && (
            <OverviewView onNavigate={setCurrentSection} />
          )}

          {currentSection === "files" && (
            <FileManagerView
              onRefreshStats={fetchStorageStats}
              openCreateModal={openCreateFileModal}
              onCloseCreateModal={() => setOpenCreateFileModal(false)}
            />
          )}

          {currentSection === "processing" && <FileProcessingView />}

          {currentSection === "cpu" && (
            <CpuSchedulingView onGenerateReport={handleGenerateReport} />
          )}

          {currentSection === "memory" && (
            <MemoryAllocationView onGenerateReport={handleGenerateReport} />
          )}

          {currentSection === "file-allocation" && (
            <FileAllocationView onGenerateReport={handleGenerateReport} />
          )}

          {currentSection === "deadlocks" && (
            <DeadlockView onGenerateReport={handleGenerateReport} />
          )}

          {currentSection === "page-replacement" && (
            <PageReplacementView onGenerateReport={handleGenerateReport} />
          )}

          {currentSection === "disk" && (
            <DiskSchedulingView onGenerateReport={handleGenerateReport} />
          )}

          {currentSection === "reports" && (
            <LabReportsView initialReportData={pendingReportData} />
          )}

          {currentSection === "settings" && (
            <SettingsView onRefreshStorage={fetchStorageStats} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
