import React, { useEffect, useState, useRef } from "react";
import {
  Folder,
  File,
  FileText,
  FileCode,
  Image as ImageIcon,
  Archive,
  Upload,
  Plus,
  Search,
  Filter,
  Grid,
  List as ListIcon,
  Trash2,
  Edit2,
  Copy,
  FolderInput,
  Download,
  Eye,
  ChevronRight,
  FolderPlus,
  RefreshCw,
  AlertTriangle,
  X,
  Check,
  HardDrive
} from "lucide-react";
import { FileRecord, FolderRecord, StorageStats } from "../../types";
import { api } from "../../services/api";

interface FileManagerViewProps {
  onRefreshStats?: () => void;
  openCreateModal?: boolean;
  onCloseCreateModal?: () => void;
}

export const FileManagerView: React.FC<FileManagerViewProps> = ({
  onRefreshStats,
  openCreateModal,
  onCloseCreateModal
}) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Root" }
  ]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filter & Search & Sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals & Action states
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const [editorFile, setEditorFile] = useState<FileRecord | null>(null);
  const [editorText, setEditorText] = useState("");
  const [editorSaving, setEditorSaving] = useState(false);

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileContent, setNewFileContent] = useState("");

  const [renameTarget, setRenameTarget] = useState<FileRecord | FolderRecord | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);

  const [moveTarget, setMoveTarget] = useState<FileRecord | null>(null);
  const [targetMoveFolder, setTargetMoveFolder] = useState<string>("root");

  const [deleteTarget, setDeleteTarget] = useState<{ type: "file" | "folder"; id: string; name: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync external openCreateModal trigger from Header
  useEffect(() => {
    if (openCreateModal) {
      setShowNewFileModal(true);
    }
  }, [openCreateModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      const folderParam = currentFolderId || "root";
      const [fetchedFiles, fetchedFolders] = await Promise.all([
        api.listFiles({
          folder_id: folderParam,
          search: searchQuery || undefined,
          file_type: typeFilter !== "all" ? typeFilter : undefined,
          sort_by: sortBy,
          sort_order: sortOrder
        }),
        api.listFolders(folderParam)
      ]);
      setFiles(fetchedFiles);
      setFolders(fetchedFolders);
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFolderId, searchQuery, typeFilter, sortBy, sortOrder]);

  const navigateToFolder = (folder: FolderRecord) => {
    setCurrentFolderId(folder.id);
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const target = folderPath[index];
    setCurrentFolderId(target.id);
    setFolderPath((prev) => prev.slice(0, index + 1));
  };

  // Upload handling
  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    try {
      setLoading(true);
      await api.uploadFiles(fileList, currentFolderId);
      await loadData();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await handleFileUpload(e.dataTransfer.files);
    }
  };

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder(newFolderName.trim(), currentFolderId);
      setNewFolderName("");
      setShowNewFolderModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Create new text file
  const handleCreateTextFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    try {
      await api.createTextFile(newFileName.trim(), newFileContent, currentFolderId);
      setNewFileName("");
      setNewFileContent("");
      setShowNewFileModal(false);
      if (onCloseCreateModal) onCloseCreateModal();
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Preview file
  const handleOpenPreview = async (file: FileRecord) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    try {
      const res = await api.getFileContent(file.id);
      setPreviewContent(res.content);
    } catch (err: any) {
      setPreviewContent(`Failed to load preview: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  // In-app Text Editor
  const handleOpenEditor = async (file: FileRecord) => {
    setEditorFile(file);
    try {
      const res = await api.getFileContent(file.id);
      setEditorText(res.content);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveEditor = async () => {
    if (!editorFile) return;
    setEditorSaving(true);
    try {
      await api.updateFileContent(editorFile.id, editorText);
      setEditorFile(null);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditorSaving(false);
    }
  };

  // Rename
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    try {
      if (isRenamingFolder) {
        await api.renameFolder(renameTarget.id, renameValue.trim());
      } else {
        await api.renameFile(renameTarget.id, renameValue.trim());
      }
      setRenameTarget(null);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Move
  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveTarget) return;
    try {
      await api.moveFile(moveTarget.id, targetMoveFolder === "root" ? null : targetMoveFolder);
      setMoveTarget(null);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Copy
  const handleCopy = async (file: FileRecord) => {
    try {
      await api.copyFile(file.id, currentFolderId, `Copy_of_${file.name}`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "file") {
        await api.deleteFile(deleteTarget.id);
      } else {
        await api.deleteFolder(deleteTarget.id);
      }
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "text":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "csv":
        return <FileCode className="w-4 h-4 text-emerald-500" />;
      case "json":
        return <FileCode className="w-4 h-4 text-amber-500" />;
      case "image":
        return <ImageIcon className="w-4 h-4 text-purple-500" />;
      case "archive":
        return <Archive className="w-4 h-4 text-orange-500" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`p-6 max-w-7xl mx-auto space-y-5 transition-all ${
        isDragging ? "ring-2 ring-primary ring-dashed bg-primary/5" : ""
      }`}
    >
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto py-1">
          {folderPath.map((crumb, idx) => (
            <React.Fragment key={crumb.id || "root"}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-border shrink-0" />}
              <button
                onClick={() => navigateToBreadcrumb(idx)}
                className={`px-2 py-1 rounded hover:bg-muted font-medium transition-colors whitespace-nowrap ${
                  idx === folderPath.length - 1 ? "text-foreground font-semibold bg-muted/60" : ""
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Buttons: Upload, New File, New Folder */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted transition-all shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Upload</span>
          </button>

          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted transition-all shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => setShowNewFileModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New File</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search files by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filters and View Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground focus:outline-none"
          >
            <option value="all">All File Types</option>
            <option value="text">Text (.txt, .md)</option>
            <option value="csv">CSV (.csv)</option>
            <option value="json">JSON (.json)</option>
            <option value="image">Images (.png, .jpg)</option>
            <option value="archive">Archives (.zip)</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground focus:outline-none"
          >
            <option value="created_at">Date Created</option>
            <option value="name">File Name</option>
            <option value="size_bytes">File Size</option>
            <option value="file_type">File Type</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-mono text-muted-foreground hover:text-foreground"
            title="Toggle sort direction"
          >
            {sortOrder.toUpperCase()}
          </button>

          {/* Table / Grid view */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 ${viewMode === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Folders & Files Container */}
      <div className="space-y-4">
        {/* Folders row if any */}
        {folders.length > 0 && (
          <div>
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Folders ({folders.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {folders.map((f) => (
                <div
                  key={f.id}
                  onDoubleClick={() => navigateToFolder(f)}
                  className="group relative p-3 rounded-xl border border-border bg-card hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <Folder className="w-7 h-7 text-amber-500 fill-amber-500/20" />
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsRenamingFolder(true);
                          setRenameTarget(f);
                          setRenameValue(f.name);
                        }}
                        className="p-1 hover:text-blue-500"
                        title="Rename folder"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ type: "folder", id: f.id, name: f.name });
                        }}
                        className="p-1 hover:text-red-500"
                        title="Delete folder"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-medium text-foreground truncate block">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {f.file_count} files
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files View */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Files ({files.length})
            </h4>
            {loading && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
              </span>
            )}
          </div>

          {files.length === 0 && folders.length === 0 && !loading ? (
            <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card/40 space-y-3">
              <Folder className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <div>
                <h5 className="text-sm font-semibold text-foreground">No files in this folder</h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Drag and drop files here or click "Upload" or "New File" above.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </button>
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Date Modified</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {getFileIcon(file.file_type)}
                          <span
                            onClick={() => handleOpenPreview(file)}
                            className="font-medium text-foreground hover:text-primary cursor-pointer truncate max-w-xs"
                          >
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground uppercase">
                        {file.file_type}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                        {formatBytes(file.size_bytes)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                        {new Date(file.updated_at || file.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                          {/* Preview */}
                          <button
                            onClick={() => handleOpenPreview(file)}
                            className="p-1 hover:text-primary rounded hover:bg-muted"
                            title="Preview file"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Edit (if text) */}
                          {file.file_type === "text" || file.file_type === "json" || file.file_type === "csv" ? (
                            <button
                              onClick={() => handleOpenEditor(file)}
                              className="p-1 hover:text-emerald-500 rounded hover:bg-muted"
                              title="Edit in-app"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                          {/* Download */}
                          <a
                            href={api.getDownloadUrl(file.id)}
                            download={file.name}
                            className="p-1 hover:text-blue-500 rounded hover:bg-muted"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          {/* Copy */}
                          <button
                            onClick={() => handleCopy(file)}
                            className="p-1 hover:text-indigo-500 rounded hover:bg-muted"
                            title="Duplicate file"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {/* Move */}
                          <button
                            onClick={() => {
                              setMoveTarget(file);
                              setTargetMoveFolder(currentFolderId || "root");
                            }}
                            className="p-1 hover:text-amber-500 rounded hover:bg-muted"
                            title="Move to folder"
                          >
                            <FolderInput className="w-3.5 h-3.5" />
                          </button>
                          {/* Rename */}
                          <button
                            onClick={() => {
                              setIsRenamingFolder(false);
                              setRenameTarget(file);
                              setRenameValue(file.name);
                            }}
                            className="p-1 hover:text-purple-500 rounded hover:bg-muted"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget({ type: "file", id: file.id, name: file.name })}
                            className="p-1 hover:text-red-500 rounded hover:bg-muted"
                            title="Delete file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleOpenPreview(file)}
                  className="group relative p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-muted/60">{getFileIcon(file.file_type)}</div>
                    <div
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setDeleteTarget({ type: "file", id: file.id, name: file.name })}
                        className="p-1 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xs font-medium text-foreground truncate block">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatBytes(file.size_bytes)} &bull; {file.file_type.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getFileIcon(previewFile.file_type)}
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{previewFile.name}</h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {formatBytes(previewFile.size_bytes)} &bull; SHA256: {previewFile.hash_sha256?.substring(0, 16)}...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={api.getDownloadUrl(previewFile.id)}
                  download={previewFile.name}
                  className="px-2.5 py-1 rounded-lg border border-border text-xs flex items-center gap-1 hover:bg-muted"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-muted/20">
              {previewLoading ? (
                <div className="p-12 text-center text-muted-foreground">Loading file preview...</div>
              ) : previewFile.file_type === "image" ? (
                <div className="flex items-center justify-center p-4">
                  <img
                    src={api.getDownloadUrl(previewFile.id)}
                    alt={previewFile.name}
                    className="max-h-96 rounded-lg object-contain shadow-sm border border-border"
                  />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap leading-relaxed text-foreground select-text font-mono">
                  {previewContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. In-App Text Editor Modal */}
      {editorFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-500" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Editing: {editorFile.name}</h3>
                  <p className="text-[11px] text-muted-foreground">In-App Live Text Editor</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditorFile(null)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditor}
                  disabled={editorSaving}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editorSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-2 bg-muted/10">
              <textarea
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                className="w-full h-full p-4 font-mono text-xs text-foreground bg-transparent border-0 focus:outline-none resize-none leading-relaxed"
                placeholder="Enter file text here..."
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTextFile}
            className="bg-card border border-border rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Create New Text File</h3>
              <button
                type="button"
                onClick={() => {
                  setShowNewFileModal(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. notes.txt or config.json"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Initial Content (Optional)</label>
                <textarea
                  rows={5}
                  placeholder="Type initial file contents..."
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewFileModal(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Create File
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFolder}
            className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Create New Folder</h3>
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Folder Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Lab_Assignments"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRenameSubmit}
            className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Rename {isRenamingFolder ? "Folder" : "File"}
              </h3>
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">New Name</label>
              <input
                type="text"
                required
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Move Modal */}
      {moveTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleMoveSubmit}
            className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Move "{moveTarget.name}"</h3>
              <button
                type="button"
                onClick={() => setMoveTarget(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Target Destination Folder</label>
              <select
                value={targetMoveFolder}
                onChange={(e) => setTargetMoveFolder(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="root">/ (Root Directory)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    /{f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMoveTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Move File
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. Confirm Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-destructive/30 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-destructive">
              <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Confirm Delete</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-foreground">
              Are you sure you want to delete{" "}
              <strong className="font-semibold text-foreground">"{deleteTarget.name}"</strong>?
              {deleteTarget.type === "folder" && " All files and subfolders inside will also be removed."}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 shadow-sm"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
