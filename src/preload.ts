import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  compileProject: (files: any) => ipcRenderer.invoke("compile-project", files),
});
