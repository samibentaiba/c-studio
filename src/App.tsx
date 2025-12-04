import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { MonacoEditor } from "./components/MonacoEditor";
import { TerminalPanel } from "./components/TerminalPanel";
import { FileSystemItem, LogMessage, LogType } from "./types";

// Helper to flatten tree for compiler (temporary until backend supports tree)
// Actually, we will send the tree to backend, but for now let's keep it simple
// Helper to flatten tree for compiler (temporary until backend supports tree)
// Actually, we will send the tree to backend, but for now let's keep it simple
// const flattenFiles = (items: FileSystemItem[]): { name: string; content: string }[] => {
//   let result: { name: string; content: string }[] = [];
//   items.forEach((item) => {
//     if (item.type === "file") {
//       result.push({ name: item.name, content: item.content || "" });
//     } else if (item.children) {
//       const children = flattenFiles(item.children);
//       // Prefix children names with parent name for flat structure simulation if needed
//       // But for real tree support, we should pass the structure.
//       // For now, let's just pass the file content.
//       // TODO: Update compiler to handle folders.
//       result = [...result, ...children];
//     }
//   });
//   return result;
// };

export default function CCodeStudio() {
  const [files, setFiles] = useState<FileSystemItem[]>([
    {
      id: "1",
      name: "main.c",
      type: "file",
      content: `#include <stdio.h>\n#include "utils.h"\n\nint main() {\n    printf("App Running...\\n");\n    print_message();\n    return 0;\n}`,
    },
    {
      id: "2",
      name: "utils.h",
      type: "file",
      content: `#ifndef UTILS_H\n#define UTILS_H\n\nvoid print_message();\n\n#endif`,
    },
    {
      id: "3",
      name: "utils.c",
      type: "file",
      content: `#include <stdio.h>\n#include "utils.h"\n\nvoid print_message() {\n    printf("Hello from bundled GCC!\\n");\n}`,
    },
  ]);

  const [activeFileId, setActiveFileId] = useState<string | null>("1");
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);

  // Recursive search for active file
  const findFile = (items: FileSystemItem[], id: string): FileSystemItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findFile(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const activeFile = activeFileId ? findFile(files, activeFileId) : null;

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

  const handleFileCreate = (name: string, type: "file" | "folder", parentId?: string) => {
    const newItem: FileSystemItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      content: type === "file" ? "// New file" : undefined,
      children: type === "folder" ? [] : undefined,
      isOpen: true,
    };

    if (!parentId) {
      setFiles([...files, newItem]);
    } else {
      const updateChildren = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map((item) => {
          if (item.id === parentId) {
            return { ...item, children: [...(item.children || []), newItem], isOpen: true };
          }
          if (item.children) {
            return { ...item, children: updateChildren(item.children) };
          }
          return item;
        });
      };
      setFiles(updateChildren(files));
    }
    
    if (type === "file") {
      setActiveFileId(newItem.id);
    }
  };

  const handleDelete = (id: string) => {
    const deleteFromTree = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.filter((item) => item.id !== id).map((item) => ({
        ...item,
        children: item.children ? deleteFromTree(item.children) : undefined,
      }));
    };
    setFiles(deleteFromTree(files));
    if (activeFileId === id) setActiveFileId(null);
  };

  const handleToggleFolder = (id: string) => {
    const toggle = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, isOpen: !item.isOpen };
        }
        if (item.children) {
          return { ...item, children: toggle(item.children) };
        }
        return item;
      });
    };
    setFiles(toggle(files));
  };

  const handleMoveFile = (sourceId: string, targetId: string | null) => {
    if (sourceId === targetId) return;

    // Helper to find item
    const findItem = (items: FileSystemItem[], id: string): FileSystemItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItem(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const sourceItem = findItem(files, sourceId);
    if (!sourceItem) return;

    // Check if target is a descendant of source (prevent circular move)
    if (targetId) {
      const isDescendant = (parent: FileSystemItem, target: string): boolean => {
        if (!parent.children) return false;
        for (const child of parent.children) {
          if (child.id === target) return true;
          if (isDescendant(child, target)) return true;
        }
        return false;
      };
      if (isDescendant(sourceItem, targetId)) return;
    }

    // Remove from old location
    const removeFromTree = (items: FileSystemItem[]): FileSystemItem[] => {
      return items
        .filter((item) => item.id !== sourceId)
        .map((item) => ({
          ...item,
          children: item.children ? removeFromTree(item.children) : undefined,
        }));
    };

    let newFiles = removeFromTree(files);

    // Add to new location
    if (!targetId) {
      newFiles = [...newFiles, sourceItem];
    } else {
      const addToTree = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map((item) => {
          if (item.id === targetId) {
            return {
              ...item,
              children: [...(item.children || []), sourceItem],
              isOpen: true,
            };
          }
          if (item.children) {
            return { ...item, children: addToTree(item.children) };
          }
          return item;
        });
      };
      newFiles = addToTree(newFiles);
    }

    setFiles(newFiles);
  };

  const handleGenerateTest = (type: "multi-main" | "nested" | "assets" | "complex-nested") => {
    const newId = () => Math.random().toString(36).substr(2, 9);
    const rootId = newId();

    let newFolder: FileSystemItem;

    if (type === "complex-nested") {
      newFolder = {
        id: rootId,
        name: "Test_Complex",
        type: "folder",
        isOpen: true,
        children: [
          {
            id: newId(),
            name: "src",
            type: "folder",
            isOpen: true,
            children: [
              {
                id: newId(),
                name: "moduleA",
                type: "folder",
                isOpen: true,
                children: [
                  {
                    id: newId(),
                    name: "a.h",
                    type: "file",
                    content: `#ifndef A_H\n#define A_H\n\nvoid funcA();\n\n#endif`,
                  },
                  {
                    id: newId(),
                    name: "a.c",
                    type: "file",
                    content: `#include <stdio.h>\n#include "a.h"\n#include "../moduleB/b.h"\n\nvoid funcA() {\n    printf("Function A calling B...\\n");\n    funcB();\n}`,
                  },
                ],
              },
              {
                id: newId(),
                name: "moduleB",
                type: "folder",
                isOpen: true,
                children: [
                  {
                    id: newId(),
                    name: "b.h",
                    type: "file",
                    content: `#ifndef B_H\n#define B_H\n\nvoid funcB();\n\n#endif`,
                  },
                  {
                    id: newId(),
                    name: "b.c",
                    type: "file",
                    content: `#include <stdio.h>\n#include "b.h"\n\nvoid funcB() {\n    printf("Function B executed!\\n");\n}`,
                  },
                ],
              },
              {
                id: newId(),
                name: "main.c",
                type: "file",
                content: `#include <stdio.h>\n#include "moduleA/a.h"\n\nint main() {\n    printf("Main starting...\\n");\n    funcA();\n    return 0;\n}`,
              },
            ],
          },
        ],
      };
    } else if (type === "multi-main") {
      newFolder = {
        id: rootId,
        name: "Test_MultiMain",
        type: "folder",
        isOpen: true,
        children: [
          {
            id: newId(),
            name: "app1.c",
            type: "file",
            content: `#include <stdio.h>\n\nint main() {\n    printf("Running App 1\\n");\n    return 0;\n}`,
          },
          {
            id: newId(),
            name: "app2.c",
            type: "file",
            content: `#include <stdio.h>\n\nint main() {\n    printf("Running App 2\\n");\n    return 0;\n}`,
          },
        ],
      };
    } else if (type === "nested") {
      newFolder = {
        id: rootId,
        name: "Test_Nested",
        type: "folder",
        isOpen: true,
        children: [
          {
            id: newId(),
            name: "include",
            type: "folder",
            isOpen: true,
            children: [
              {
                id: newId(),
                name: "math_utils.h",
                type: "file",
                content: `#ifndef MATH_UTILS_H\n#define MATH_UTILS_H\n\nint add(int a, int b);\n\n#endif`,
              },
            ],
          },
          {
            id: newId(),
            name: "src",
            type: "folder",
            isOpen: true,
            children: [
              {
                id: newId(),
                name: "math_utils.c",
                type: "file",
                content: `#include "../include/math_utils.h"\n\nint add(int a, int b) {\n    return a + b;\n}`,
              },
            ],
          },
          {
            id: newId(),
            name: "main.c",
            type: "file",
            content: `#include <stdio.h>\n#include "include/math_utils.h"\n\nint main() {\n    printf("2 + 3 = %d\\n", add(2, 3));\n    return 0;\n}`,
          },
        ],
      };
    } else {
      // assets
      newFolder = {
        id: rootId,
        name: "Test_Assets",
        type: "folder",
        isOpen: true,
        children: [
          {
            id: newId(),
            name: "data.txt",
            type: "file",
            content: `Hello from text file!`,
          },
          {
            id: newId(),
            name: "main.c",
            type: "file",
            content: `#include <stdio.h>\n\nint main() {\n    FILE *f = fopen("data.txt", "r");\n    if (f) {\n        char buffer[100];\n        fgets(buffer, 100, f);\n        printf("Read: %s\\n", buffer);\n        fclose(f);\n    } else {\n        printf("Failed to open file.\\n");\n    }\n    return 0;\n}`,
          },
        ],
      };
    }

    setFiles([...files, newFolder]);
  };

  const handleContentChange = (content: string) => {
    if (!activeFileId) return;
    const updateContent = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map((item) => {
        if (item.id === activeFileId) {
          return { ...item, content };
        }
        if (item.children) {
          return { ...item, children: updateContent(item.children) };
        }
        return item;
      });
    };
    setFiles(updateContent(files));
  };

  const [markers, setMarkers] = useState<{ file: string; line: number; column: number; message: string; severity: "error" | "warning" }[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const errors = await window.electron.checkSyntax(files);
      setMarkers(errors);
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [files]);

  const handleRun = async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    addLog("info", "Compiling...");

    try {
      // Pass the entire tree structure to the backend
      const result = await window.electron.compileProject(files, activeFileId);

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
    <div className="flex h-screen w-full bg-background text-foreground font-sans overflow-hidden">
      <div className="w-64 flex-shrink-0">
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          onFileSelect={(file) => setActiveFileId(file.id)}
          onFileCreate={handleFileCreate}
          onDelete={handleDelete}
          onToggleFolder={handleToggleFolder}
          onMoveFile={handleMoveFile}
          onGenerateTest={handleGenerateTest}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col min-h-0">
          {activeFile ? (
            <MonacoEditor
              activeFile={activeFile}
              onContentChange={handleContentChange}
              onRun={handleRun}
              isCompiling={isCompiling}
              markers={markers}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a file to edit
            </div>
          )}
        </div>
        <div className="h-1/3 flex-shrink-0">
          <TerminalPanel logs={logs} onClear={() => setLogs([])} />
        </div>
      </div>
    </div>
  );
}
