import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Trash2,
  Terminal,
  AlertCircle,
  CheckCircle,
  FileCode,
  X,
  Plus,
  FileText,
} from "lucide-react";

// --- Types ---
type LogType = "info" | "success" | "error" | "warning";

interface LogMessage {
  id: string;
  type: LogType;
  content: string;
  timestamp: string;
}

interface CodeFile {
  name: string;
  content: string;
}

export default function CCodeStudio() {
  const [files, setFiles] = useState<CodeFile[]>([
    {
      name: "main.c",
      content: `#include <stdio.h>\n#include "utils.h"\n\nint main() {\n    printf("App Running...\\n");\n    print_message();\n    return 0;\n}`,
    },
    {
      name: "utils.h",
      content: `#ifndef UTILS_H\n#define UTILS_H\n\nvoid print_message();\n\n#endif`,
    },
    {
      name: "utils.c",
      content: `#include <stdio.h>\n#include "utils.h"\n\nvoid print_message() {\n    printf("Hello from bundled GCC!\\n");\n}`,
    },
  ]);

  const [activeFileName, setActiveFileName] = useState<string>("main.c");
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const logsEndRef = useRef<HTMLDivElement>(null);
  const activeFile = files.find((f) => f.name === activeFileName) || files[0];

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (type: LogType, content: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        type,
        content,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName || files.some((f) => f.name === newFileName)) return;
    setFiles([...files, { name: newFileName, content: "// New file" }]);
    setActiveFileName(newFileName);
    setNewFileName("");
    setIsCreatingFile(false);
  };

  const handleDeleteFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length === 1) return;
    const newFiles = files.filter((f) => f.name !== fileName);
    setFiles(newFiles);
    if (activeFileName === fileName) setActiveFileName(newFiles[0].name);
  };

  const handleRun = async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    addLog("info", "Compiling...");

    try {
      // @ts-ignore - Electron IPC bridge
      const result = await window.electron.compileProject(files);

      if (result.success) {
        addLog("success", "Build successful.");
        const lines = result.output.split("\n");
        lines.forEach((line: string) => {
          if (line) addLog("info", `> ${line}`);
        });
      } else {
        addLog("error", "Error:");
        addLog("error", result.error || "Unknown error");
      }
    } catch (e) {
      addLog("error", "IPC Error: " + String(e));
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            C-Studio
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-xs font-semibold text-slate-500 uppercase">
              Files
            </div>
            <button
              onClick={() => setIsCreatingFile(true)}
              className="text-slate-500 hover:text-white"
            >
              <Plus size={16} />
            </button>
          </div>
          {isCreatingFile && (
            <form onSubmit={handleCreateFile} className="px-2 mb-2">
              <input
                autoFocus
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onBlur={() => setIsCreatingFile(false)}
                className="w-full bg-slate-800 text-sm px-2 py-1 rounded border border-blue-500 focus:outline-none"
              />
            </form>
          )}
          <div className="px-2 flex flex-col gap-1">
            {files.map((file) => (
              <div
                key={file.name}
                onClick={() => setActiveFileName(file.name)}
                className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer group ${activeFileName === file.name ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:bg-slate-800/50"}`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {file.name.endsWith(".h") ? (
                    <FileText size={16} className="text-yellow-500" />
                  ) : (
                    <FileCode size={16} />
                  )}
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                {files.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteFile(file.name, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4">
          <span className="text-slate-100 font-medium">{activeFile.name}</span>
          <button
            onClick={handleRun}
            disabled={isCompiling}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-medium ${isCompiling ? "bg-slate-700" : "bg-green-600 hover:bg-green-700"}`}
          >
            {isCompiling ? (
              "Running..."
            ) : (
              <>
                <Play size={16} fill="currentColor" /> Run Code
              </>
            )}
          </button>
        </div>

        <div className="flex-1 relative bg-[#1e1e1e] flex">
          <div className="w-12 border-r border-slate-800 flex flex-col items-end pt-4 pr-3 text-slate-600 font-mono text-sm leading-6">
            {activeFile.content.split("\n").map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            value={activeFile.content}
            onChange={(e) =>
              setFiles(
                files.map((f) =>
                  f.name === activeFileName
                    ? { ...f, content: e.target.value }
                    : f
                )
              )
            }
            className="flex-1 h-full pl-2 pt-4 pr-4 bg-transparent text-slate-200 font-mono text-sm leading-6 resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>

        <div className="h-1/3 bg-slate-950 border-t border-slate-800 flex flex-col">
          <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50">
            <span className="text-sm font-medium text-slate-200 flex gap-2">
              <Terminal size={16} /> Output
            </span>
            <button onClick={() => setLogs([])}>
              <Trash2
                size={16}
                className="text-slate-500 hover:text-slate-300"
              />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 text-slate-300 mb-1">
                <span className="text-slate-600 text-xs pt-1">
                  {log.timestamp}
                </span>
                <span
                  className={
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "success"
                        ? "text-green-400"
                        : ""
                  }
                >
                  {log.content}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
