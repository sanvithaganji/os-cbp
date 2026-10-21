import {
  FileRecord,
  FolderRecord,
  StorageStats,
  OverviewStats,
  CpuSchedulingResponse,
  MemoryAllocationResponse,
  FileAllocationResponse,
  BankersResponse,
  DeadlockDetectionResponse,
  PageReplacementResponse,
  DiskSchedulingResponse,
  LabReport,
  ProcessingJob
} from "../types";

const API_BASE = "/api/v1";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  if (!res.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Overview
  getOverviewStats: () => request<OverviewStats>("/overview/stats"),

  // Files
  listFiles: (params?: { folder_id?: string | null; search?: string; file_type?: string; sort_by?: string; sort_order?: string }) => {
    const query = new URLSearchParams();
    if (params?.folder_id !== undefined && params?.folder_id !== null) query.append("folder_id", params.folder_id);
    if (params?.search) query.append("search", params.search);
    if (params?.file_type) query.append("file_type", params.file_type);
    if (params?.sort_by) query.append("sort_by", params.sort_by);
    if (params?.sort_order) query.append("sort_order", params.sort_order);
    return request<FileRecord[]>(`/files?${query.toString()}`);
  },

  getStorageStats: () => request<StorageStats>("/files/storage-stats"),

  getFile: (fileId: string) => request<FileRecord>(`/files/${fileId}`),

  getFileContent: (fileId: string) => request<{ id: string; name: string; content: string; size_bytes: number; file_type: string; is_text: boolean }>(`/files/${fileId}/content`),

  updateFileContent: (fileId: string, content: string) => request<FileRecord>(`/files/${fileId}/content`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  }),

  uploadFiles: async (files: FileList | File[], folderId?: string | null) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    const query = folderId ? `?folder_id=${encodeURIComponent(folderId)}` : "";
    return request<FileRecord[]>(`/files/upload${query}`, {
      method: "POST",
      body: formData
    });
  },

  createTextFile: (name: string, content: string, folderId?: string | null) => request<FileRecord>("/files/create-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, content, folder_id: folderId || null })
  }),

  renameFile: (fileId: string, name: string) => request<FileRecord>(`/files/${fileId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  }),

  moveFile: (fileId: string, folderId: string | null) => request<FileRecord>(`/files/${fileId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: folderId })
  }),

  copyFile: (fileId: string, targetFolderId?: string | null, newName?: string) => request<FileRecord>(`/files/${fileId}/copy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_folder_id: targetFolderId, new_name: newName })
  }),

  deleteFile: (fileId: string) => request<{ message: string; id: string }>(`/files/${fileId}`, {
    method: "DELETE"
  }),

  getDownloadUrl: (fileId: string) => `${API_BASE}/files/${fileId}/download`,

  // Folders
  listFolders: (parentId?: string | null) => {
    const q = parentId !== undefined && parentId !== null ? `?parent_id=${encodeURIComponent(parentId)}` : "";
    return request<FolderRecord[]>(`/folders${q}`);
  },

  createFolder: (name: string, parentId?: string | null) => request<FolderRecord>("/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, parent_id: parentId || null })
  }),

  renameFolder: (folderId: string, name: string) => request<FolderRecord>(`/folders/${folderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  }),

  deleteFolder: (folderId: string) => request<{ message: string }>(`/folders/${folderId}`, {
    method: "DELETE"
  }),

  // File Processing
  analyzeText: (fileId: string) => request<any>(`/processing/text-analyze/${fileId}`, { method: "POST" }),
  analyzeCsv: (fileId: string) => request<any>(`/processing/csv-analyze/${fileId}`, { method: "POST" }),
  validateJson: (fileId: string) => request<any>(`/processing/json-validate/${fileId}`, { method: "POST" }),
  generateHash: (fileId: string, expectedHash?: string) => request<any>(`/processing/hash/${fileId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expectedHash ? { expected_hash: expectedHash } : {})
  }),
  getDuplicates: () => request<any>("/processing/duplicates"),
  compareFiles: (file1Id: string, file2Id: string) => request<any>("/processing/diff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file1_id: file1Id, file2_id: file2Id })
  }),
  getImageMetadata: (fileId: string) => request<any>(`/processing/image-metadata/${fileId}`, { method: "POST" }),
  compressFiles: (fileIds: string[], archiveName: string = "archive.zip", folderId?: string | null) => request<any>("/processing/compress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_ids: fileIds, archive_name: archiveName, folder_id: folderId })
  }),
  decompressZip: (fileId: string, targetFolderId?: string | null) => request<any>("/processing/decompress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId, target_folder_id: targetFolderId })
  }),
  batchProcess: (fileIds: string[], operation: string) => request<any>("/processing/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_ids: fileIds, operation })
  }),
  getProcessingJobs: () => request<ProcessingJob[]>("/processing/jobs"),

  // Simulations
  simulateCpu: (payload: { algorithm: string; processes: any[]; time_quantum?: number; priority_order?: string }) =>
    request<CpuSchedulingResponse>("/simulations/cpu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),

  simulateMemory: (payload: { algorithm: string; blocks: any[]; processes: any[] }) =>
    request<MemoryAllocationResponse>("/simulations/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),

  simulateFileAllocation: (payload: { strategy: string; total_blocks?: number; existing_files?: any[]; file_to_allocate?: any; file_to_delete?: string }) =>
    request<FileAllocationResponse>("/simulations/file-allocation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),

  simulateBankers: (payload: { processes: string[]; resource_types: string[]; available: number[]; allocation: number[][]; max_demand: number[][]; resource_request?: any }) =>
    request<BankersResponse>("/simulations/bankers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),

  simulateDeadlockDetection: (payload: { processes: string[]; resource_types: string[]; available: number[]; allocation: number[][]; request_matrix: number[][] }) =>
    request<DeadlockDetectionResponse>("/simulations/deadlock-detection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),

  simulatePageReplacement: (payload: { algorithm: string; reference_string: number[]; frames_count: number }) =>
    request<PageReplacementResponse>("/simulations/page-replacement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),

  simulateDiskScheduling: (payload: { algorithm: string; initial_head: number; requests: number[]; cylinder_range?: number; direction?: string }) =>
    request<DiskSchedulingResponse>("/simulations/disk-scheduling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),

  getSimulationHistory: (category?: string) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<any[]>(`/simulations/history${q}`);
  },

  // Reports
  listReports: () => request<LabReport[]>("/reports"),
  getReport: (reportId: string) => request<LabReport>(`/reports/${reportId}`),
  createReport: (payload: any) => request<LabReport>("/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }),
  deleteReport: (reportId: string) => request<{ message: string }>(`/reports/${reportId}`, { method: "DELETE" }),
  getReportDownloadUrl: (reportId: string) => `${API_BASE}/reports/${reportId}/download`,

  // Settings
  getSettings: () => request<any>("/settings"),
  updateSettings: (payload: Record<string, any>) => request<any>("/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }),
  seedSamples: () => request<any>("/settings/seed-samples", { method: "POST" }),
};
