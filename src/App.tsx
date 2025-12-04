import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { MonacoEditor } from "./components/MonacoEditor";
import { TerminalPanel } from "./components/TerminalPanel";
import { TitleBar } from "./components/TitleBar";
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

  const handleGenerateTest = (type: "multi-main" | "nested" | "assets" | "complex-nested" | "multi-input" | "pointers") => {
    const newId = () => Math.random().toString(36).substr(2, 9);
    const rootId = newId();

    let newFolder: FileSystemItem;

    if (type === "multi-input") {
      // Test scenario for multiple input cases with scanf
      newFolder = {
        id: rootId,
        name: "Test_MultiInput",
        type: "folder",
        isOpen: true,
        children: [
          {
            id: newId(),
            name: "main.c",
            type: "file",
            content: `#include <stdio.h>

int main() {
    // Test 1: Single integer input
    int age;
    printf("Enter your age: ");
    scanf("%d", &age);
    printf("Your age is: %d\\n\\n", age);

    // Test 2: Multiple integers on same line
    int a, b, c;
    printf("Enter three numbers (space separated): ");
    scanf("%d %d %d", &a, &b, &c);
    printf("Sum: %d\\n\\n", a + b + c);

    // Test 3: String input
    char name[50];
    printf("Enter your name: ");
    scanf("%s", name);
    printf("Hello, %s!\\n\\n", name);

    // Test 4: Mixed types
    char grade;
    float score;
    printf("Enter grade letter and score: ");
    scanf(" %c %f", &grade, &score);
    printf("Grade: %c, Score: %.2f\\n\\n", grade, score);

    // Test 5: Full line input with fgets
    char sentence[100];
    printf("Enter a sentence: ");
    getchar(); // consume leftover newline
    fgets(sentence, 100, stdin);
    printf("You said: %s\\n", sentence);

    return 0;
}`,
          },
        ],
      };
    } else if (type === "pointers") {
      // Test scenario for pointers between functions and libraries
      newFolder = {
        id: rootId,
        name: "Test_Pointers",
        type: "folder",
        isOpen: true,
        children: [
          {
            id: newId(),
            name: "pointer_lib.h",
            type: "file",
            content: `#ifndef POINTER_LIB_H
#define POINTER_LIB_H

// Function to swap two integers using pointers
void swap(int *a, int *b);

// Function to modify array elements
void doubleArray(int *arr, int size);

// Function that returns a pointer (allocates memory)
int* createArray(int size, int initialValue);

// Function to print array using pointer arithmetic
void printArray(int *arr, int size);

// Function to find max element and return pointer to it
int* findMax(int *arr, int size);

// Function pointer type for operations
typedef int (*Operation)(int, int);

// Function that uses function pointer
int applyOperation(int a, int b, Operation op);

// Sample operations
int add(int a, int b);
int multiply(int a, int b);

#endif`,
          },
          {
            id: newId(),
            name: "pointer_lib.c",
            type: "file",
            content: `#include <stdio.h>
#include <stdlib.h>
#include "pointer_lib.h"

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

void doubleArray(int *arr, int size) {
    for (int i = 0; i < size; i++) {
        *(arr + i) *= 2;  // Pointer arithmetic
    }
}

int* createArray(int size, int initialValue) {
    int *arr = (int*)malloc(size * sizeof(int));
    if (arr != NULL) {
        for (int i = 0; i < size; i++) {
            arr[i] = initialValue;
        }
    }
    return arr;
}

void printArray(int *arr, int size) {
    printf("[");
    for (int *p = arr; p < arr + size; p++) {
        printf("%d", *p);
        if (p < arr + size - 1) printf(", ");
    }
    printf("]\\n");
}

int* findMax(int *arr, int size) {
    int *maxPtr = arr;
    for (int i = 1; i < size; i++) {
        if (*(arr + i) > *maxPtr) {
            maxPtr = arr + i;
        }
    }
    return maxPtr;
}

int applyOperation(int a, int b, Operation op) {
    return op(a, b);
}

int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}`,
          },
          {
            id: newId(),
            name: "main.c",
            type: "file",
            content: `#include <stdio.h>
#include <stdlib.h>
#include "pointer_lib.h"

int main() {
    printf("=== Pointer Test Scenarios ===\\n\\n");

    // Test 1: Swap using pointers
    printf("Test 1: Swap Function\\n");
    int x = 10, y = 20;
    printf("Before swap: x = %d, y = %d\\n", x, y);
    swap(&x, &y);
    printf("After swap:  x = %d, y = %d\\n\\n", x, y);

    // Test 2: Modify array through pointer
    printf("Test 2: Double Array Elements\\n");
    int numbers[] = {1, 2, 3, 4, 5};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    printf("Before: ");
    printArray(numbers, size);
    doubleArray(numbers, size);
    printf("After:  ");
    printArray(numbers, size);
    printf("\\n");

    // Test 3: Dynamic memory allocation
    printf("Test 3: Dynamic Array Creation\\n");
    int *dynamicArr = createArray(5, 7);
    if (dynamicArr != NULL) {
        printf("Created array: ");
        printArray(dynamicArr, 5);
        free(dynamicArr);
    }
    printf("\\n");

    // Test 4: Find max and return pointer
    printf("Test 4: Find Max Element\\n");
    int data[] = {15, 3, 27, 8, 12};
    int *maxPtr = findMax(data, 5);
    printf("Array: ");
    printArray(data, 5);
    printf("Max value: %d (at address %p)\\n\\n", *maxPtr, (void*)maxPtr);

    // Test 5: Function pointers
    printf("Test 5: Function Pointers\\n");
    int a = 5, b = 3;
    printf("Numbers: %d and %d\\n", a, b);
    printf("Using add function: %d\\n", applyOperation(a, b, add));
    printf("Using multiply function: %d\\n\\n", applyOperation(a, b, multiply));

    // Test 6: Pointer to pointer
    printf("Test 6: Pointer to Pointer\\n");
    int value = 42;
    int *ptr = &value;
    int **pptr = &ptr;
    printf("Value: %d\\n", value);
    printf("Via *ptr: %d\\n", *ptr);
    printf("Via **pptr: %d\\n", **pptr);

    return 0;
}`,
          },
        ],
      };
    } else if (type === "complex-nested") {
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

  useEffect(() => {
    // Listen for process output
    window.electron.onProcessOutput((data) => {
      addLog("info", data);
    });

    window.electron.onProcessExit((code) => {
      addLog("info", `\nProcess exited with code ${code}`);
    });

    return () => {
      // Cleanup listeners if needed (though electron bridge handles this mostly)
    };
  }, []);

  const handleRun = async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    addLog("info", "Compiling...");

    try {
      // Pass the entire tree structure to the backend
      const result = await window.electron.compileProject(files, activeFileId);

      if (result.success && result.exePath && result.cwd) {
        addLog("success", "Build successful. Running...");
        window.electron.runProject(result.exePath, result.cwd);
      } else {
        addLog("error", "Build failed:");
        addLog("error", result.error || "Unknown error");
      }
    } catch (e) {
      addLog("error", "IPC Error: " + String(e));
    } finally {
      setIsCompiling(false);
    }
  };

  const handleTerminalInput = (input: string) => {
    window.electron.writeStdin(input);
    addLog("info", input + "\n"); // Echo input to terminal
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground font-sans overflow-hidden">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
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
          <TerminalPanel logs={logs} onClear={() => setLogs([])} onInput={handleTerminalInput} />
        </div>
        </div>
      </div>
    </div>
  );
}
