import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  compileProject: (files: unknown, activeFileId?: string) => ipcRenderer.invoke("compile-project", files, activeFileId),
  runProject: (exePath: string, cwd: string) => ipcRenderer.send("run-project", exePath, cwd),
  writeStdin: (data: string) => ipcRenderer.send("write-stdin", data),
  killProcess: () => ipcRenderer.send("kill-process"),
  onProcessOutput: (callback: (data: string) => void) => ipcRenderer.on("process-output", (_event, data) => callback(data)),
  onProcessExit: (callback: (code: number) => void) => ipcRenderer.on("process-exit", (_event, code) => callback(code)),
  checkSyntax: (files: unknown) => ipcRenderer.invoke("syntax-check", files),
});
