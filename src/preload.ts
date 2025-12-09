import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  // Compiler operations
  compileProject: (files: unknown, activeFileId?: string) => ipcRenderer.invoke("compile-project", files, activeFileId),
  runProject: (exePath: string, cwd: string) => ipcRenderer.send("run-project", exePath, cwd),
  writeStdin: (data: string) => ipcRenderer.send("write-stdin", data),
  killProcess: () => ipcRenderer.send("kill-process"),
  onProcessOutput: (callback: (data: string) => void) => ipcRenderer.on("process-output", (_event, data) => callback(data)),
  onProcessExit: (callback: (code: number) => void) => ipcRenderer.on("process-exit", (_event, code) => callback(code)),
  checkSyntax: (files: unknown) => ipcRenderer.invoke("syntax-check", files),

  // File system operations
  showSaveDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => ipcRenderer.invoke("show-save-dialog", options),

  showOpenDialog: (options: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    properties?: ("openFile" | "openDirectory" | "multiSelections")[];
  }) => ipcRenderer.invoke("show-open-dialog", options),

  saveFile: (filePath: string, content: string) => ipcRenderer.invoke("save-file", filePath, content),
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  readFolder: (folderPath: string) => ipcRenderer.invoke("read-folder", folderPath),
  
  // WASM path helpers
  getClangFormatWasmPath: () => ipcRenderer.invoke("get-clang-format-wasm-path"),
  
  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadAndInstallUpdate: (downloadUrl: string, version: string) => 
    ipcRenderer.invoke("download-and-install-update", downloadUrl, version),
  onUpdateProgress: (callback: (data: { status: string; progress?: number }) => void) => 
    ipcRenderer.on("update-progress", (_event, data) => callback(data)),
});
