import React, { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Play, FileCode } from "lucide-react";
import { Button } from "./ui/button";
import { FileSystemItem } from "../types";
import init, { format } from "@wasm-fmt/clang-format";

interface Marker {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}

interface MonacoEditorProps {
  activeFile: FileSystemItem;
  onContentChange: (content: string) => void;
  onRun: () => void;
  isCompiling: boolean;
  markers: Marker[];
}

export function MonacoEditor({
  activeFile,
  onContentChange,
  onRun,
  isCompiling,
  markers,
}: MonacoEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  React.useEffect(() => {
    if (editorRef.current && monacoRef.current && activeFile) {
      const model = editorRef.current.getModel();
      if (model) {
        const monacoMarkers = markers
          .filter((m) => m.file === activeFile.name) // Filter markers for current file
          .map((m) => ({
            startLineNumber: m.line,
            startColumn: m.column,
            endLineNumber: m.line,
            endColumn: m.column + 1, // Highlight at least one char
            message: m.message,
            severity:
              m.severity === "error"
                ? monacoRef.current.MarkerSeverity.Error
                : monacoRef.current.MarkerSeverity.Warning,
          }));
        monacoRef.current.editor.setModelMarkers(model, "owner", monacoMarkers);
      }
    }
  }, [markers, activeFile]);

  // Register C Formatter
  React.useEffect(() => {
    if (monacoRef.current) {
      const monaco = monacoRef.current;
      
      // Initialize WASM with environment-appropriate path from main process
      const initWasm = async () => {
        try {
          const wasmPath = await window.electron.getClangFormatWasmPath();
          await init(wasmPath);
        } catch (error) {
          console.error("Failed to initialize clang-format WASM:", error);
        }
      };
      initWasm();

      const dispose = monaco.languages.registerDocumentFormattingEditProvider("c", {
        provideDocumentFormattingEdits: async (model: any) => {
          const text = model.getValue();
          try {
            // Use Chromium style as a good default
            const formatted = await format(text, "main.c", JSON.stringify({ BasedOnStyle: "Chromium", IndentWidth: 4 }));
            return [
              {
                range: model.getFullModelRange(),
                text: formatted,
              },
            ];
          } catch (e) {
            console.error("Formatting failed:", e);
            return [];
          }
        },
      });

      return () => dispose.dispose();
    }
  }, [monacoRef.current]);

  const handleFormat = () => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

  // Determine language based on file extension
  const getLanguage = (filename: string) => {
    if (filename.endsWith(".c") || filename.endsWith(".h")) return "c";
    if (filename.endsWith(".cpp")) return "cpp";
    if (filename.endsWith(".json")) return "json";
    if (filename.endsWith(".js")) return "javascript";
    if (filename.endsWith(".ts")) return "typescript";
    return "plaintext";
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
      <div className="h-10 border-b border-white/10 bg-[#2d2d2d] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <FileCode size={16} className="text-blue-500" />
          <span className="text-foreground font-medium">{activeFile.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleFormat}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            Format
          </Button>
          <Button
            onClick={onRun}
            disabled={isCompiling}
            className={isCompiling ? "bg-muted text-muted-foreground" : "bg-green-600 hover:bg-green-700 text-white"}
            size="sm"
          >
            {isCompiling ? (
              "Running..."
            ) : (
              <>
                <Play size={16} className="mr-2" fill="currentColor" /> Run Code
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          language={getLanguage(activeFile.name)}
          value={activeFile.content || ""}
          theme="vs-dark"
          onChange={(value) => onContentChange(value || "")}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "off",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            scrollbar: {
              horizontal: "visible",
              horizontalScrollbarSize: 10,
              verticalScrollbarSize: 10,
            },
          }}
        />
      </div>
    </div>
  );
}
