import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  compileProject: (files: unknown) => ipcRenderer.invoke("compile-project", files),
  checkSyntax: (files: unknown) => ipcRenderer.invoke("syntax-check", files),
});
