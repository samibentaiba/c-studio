import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  compileProject: (files: unknown, activeFileId?: string) => ipcRenderer.invoke("compile-project", files, activeFileId),
  checkSyntax: (files: unknown) => ipcRenderer.invoke("syntax-check", files),
});
