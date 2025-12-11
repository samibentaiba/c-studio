import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { MonacoEditor } from "./components/MonacoEditor";
import { TerminalPanel } from "./components/TerminalPanel";
import { TitleBar } from "./components/TitleBar";
import { UpdateNotification } from "./components/UpdateNotification";
import { ThemeProvider } from "./ThemeContext";
import { FileSystemItem, LogMessage, LogType } from "./types";
// Import modules directly (barrel export from index.ts causes crash)
import { translateCToAlgo } from "./usdb-compiler/c-to-algo";
import { Parser } from "./usdb-compiler/parser";
import { SemanticAnalyzer } from "./usdb-compiler/semantic";
import { CodeGenerator } from "./usdb-compiler/codegen";

// Local compile function (bypasses index.ts barrel exports)
const translateAlgoToC = (source: string) => {
  // Phase 1: Parse
  const parser = new Parser();
  const { ast, errors: parseErrors } = parser.parse(source);

  if (parseErrors.length > 0 || !ast) {
    return {
      success: false as const,
      cCode: undefined as undefined,
      errors:
        parseErrors.length > 0
          ? parseErrors
          : [{ toString: () => "Parse failed" }],
      warnings: [] as { toString: () => string }[],
    };
  }

  // Phase 2: Semantic Analysis
  const semanticAnalyzer = new SemanticAnalyzer();
  const { errors: semanticErrors } = semanticAnalyzer.analyze(ast);
  const errors = semanticErrors.filter((e) => e.severity !== "warning");
  const warnings = semanticErrors.filter((e) => e.severity === "warning");

  if (errors.length > 0) {
    return { success: false as const, cCode: undefined, errors, warnings };
  }

  // Phase 3: Code Generation
  const codeGenerator = new CodeGenerator();
  const { code, errors: codeGenErrors } = codeGenerator.generate(ast);

  if (codeGenErrors.length > 0) {
    return {
      success: false as const,
      cCode: undefined,
      errors: codeGenErrors,
      warnings,
    };
  }

  return {
    success: true as const,
    cCode: code,
    errors: [] as { toString: () => string }[],
    warnings,
  };
};

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
    {
      id: "4",
      name: "factorial.algo",
      type: "file",
      content: `ALGORITHM Factorial
VAR n, result : INTEGER

FUNCTION Fact(x : INTEGER) : INTEGER
BEGIN
    IF (x = 0) THEN
        RETURN(1)
    ELSE
        RETURN(x * Fact(x - 1))
END

BEGIN
    PRINT("Enter a number:")
    SCAN(n)
    result <- Fact(n)
    PRINT("Factorial is:", result)
END.`,
    },
  ]);

  const [activeFileId, setActiveFileId] = useState<string | null>("1");
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>(["1"]); // Track open tabs
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Split editor state
  const [splitTabs, setSplitTabs] = useState<string[]>([]); // Tabs for second pane
  const [activeSplitFileId, setActiveSplitFileId] = useState<string | null>(
    null
  );

  // Terminal and sidebar state
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("c-studio-sidebar-width");
    return saved ? parseInt(saved, 10) : 256;
  });

  // Recursive search for active file
  const findFile = (
    items: FileSystemItem[],
    id: string
  ): FileSystemItem | null => {
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

  const handleFileCreate = (
    name: string,
    type: "file" | "folder",
    parentId?: string
  ) => {
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
            return {
              ...item,
              children: [...(item.children || []), newItem],
              isOpen: true,
            };
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
      // Add to open tabs if not already there
      setOpenTabs((prev) =>
        prev.includes(newItem.id) ? prev : [...prev, newItem.id]
      );
    }
  };

  const handleDelete = (id: string) => {
    const deleteFromTree = (items: FileSystemItem[]): FileSystemItem[] => {
      return items
        .filter((item) => item.id !== id)
        .map((item) => ({
          ...item,
          children: item.children ? deleteFromTree(item.children) : undefined,
        }));
    };
    setFiles(deleteFromTree(files));
    if (activeFileId === id) setActiveFileId(null);
    // Remove from open tabs
    setOpenTabs((prev) => prev.filter((tabId) => tabId !== id));
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

  const handleRename = (id: string, newName: string) => {
    const renameInTree = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, name: newName };
        }
        if (item.children) {
          return { ...item, children: renameInTree(item.children) };
        }
        return item;
      });
    };
    setFiles(renameInTree(files));
  };

  const handleMoveFile = (sourceId: string, targetId: string | null) => {
    if (sourceId === targetId) return;

    // Helper to find item
    const findItem = (
      items: FileSystemItem[],
      id: string
    ): FileSystemItem | null => {
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
      const isDescendant = (
        parent: FileSystemItem,
        target: string
      ): boolean => {
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

  const handleGenerateTest = (
    type:
      | "multi-main"
      | "nested"
      | "assets"
      | "complex-nested"
      | "multi-input"
      | "pointers"
      | "algo-factorial"
      | "algo-array-sum"
      | "algo-quadratic"
      | "algo-struct"
      | "algo-loops"
  ) => {
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
    } else if (type === "assets") {
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
    } else if (type === "algo-factorial") {
      // USDB Algo: Factorial
      newFolder = {
        id: rootId,
        name: "Algo_Factorial",
        type: "folder",
        isOpen: true,
        children: [
          {
            id: newId(),
            name: "factorial.algo",
            type: "file",
            content: `ALGORITHM Factorial
VAR n, result : INTEGER

FUNCTION Fact(x : INTEGER) : INTEGER
BEGIN
    IF (x <= 1) THEN
        RETURN(1)
    ELSE
        RETURN(x * Fact(x - 1))
END

BEGIN
    PRINT("=== Factorial Calculator ===")
    PRINT("Enter a number:")
    SCAN(n)
    result <- Fact(n)
    PRINT("Factorial of", n, "is", result)
END.`,
          },
        ],
      };
    } else if (type === "algo-array-sum") {
      // USDB Algo: Array Sum
      newFolder = {
        id: rootId,
        name: "Algo_ArraySum",
        type: "folder",
        isOpen: true,
        children: [
          {
            id: newId(),
            name: "array_sum.algo",
            type: "file",
            content: `ALGORITHM ArraySum
CONST SIZE = 5
VAR T : ARRAY[SIZE] OF INTEGER
VAR i, sum : INTEGER

BEGIN
    PRINT("=== Array Sum Calculator ===")
    PRINT("Enter", SIZE, "numbers:")
    
    sum <- 0
    FOR i <- 0 TO SIZE - 1 DO
    BEGIN
        SCAN(T[i])
        sum <- sum + T[i]
    END
    
    PRINT("Numbers entered:")
    FOR i <- 0 TO SIZE - 1 DO
        PRINT(T[i])
    
    PRINT("Sum =", sum)
    PRINT("Average =", sum / SIZE)
END.`,
          },
        ],
      };
    } else if (type === "algo-quadratic") {
      // USDB Algo: Quadratic Equation
      newFolder = {
        id: rootId,
        name: "Algo_Quadratic",
        type: "folder",
        isOpen: true,
        children: [
          {
            id: newId(),
            name: "quadratic.algo",
            type: "file",
            content: `ALGORITHM QuadraticEquation
VAR a, b, c : REAL
VAR delta, x1, x2 : REAL

BEGIN
    PRINT("=== Quadratic Equation Solver ===")
    PRINT("Equation: ax^2 + bx + c = 0")
    PRINT("Enter coefficient a:")
    SCAN(a)
    PRINT("Enter coefficient b:")
    SCAN(b)
    PRINT("Enter coefficient c:")
    SCAN(c)
    
    delta <- b * b - 4 * a * c
    
    IF (delta > 0) THEN
    BEGIN
        x1 <- (-b + sqrt(delta)) / (2 * a)
        x2 <- (-b - sqrt(delta)) / (2 * a)
        PRINT("Two real solutions:")
        PRINT("x1 =", x1)
        PRINT("x2 =", x2)
    END
    ELSE IF (delta = 0) THEN
    BEGIN
        x1 <- -b / (2 * a)
        PRINT("One solution:")
        PRINT("x =", x1)
    END
    ELSE
        PRINT("No real solutions (delta < 0)")
END.`,
          },
        ],
      };
    } else if (type === "algo-struct") {
      // USDB Algo: Structures Test
      newFolder = {
        id: rootId,
        name: "Algo_Structures",
        type: "folder",
        isOpen: true,
        children: [
          {
            id: newId(),
            name: "structures.algo",
            type: "file",
            content: `ALGORITHM StructuresTest
TYPE
    Date = STRUCTURE
    BEGIN
        D : INTEGER
        M : INTEGER
        Y : INTEGER
    END
    
    Student = STRUCTURE
    BEGIN
        ID : INTEGER
        Name : STRING
        BirthDate : Date
        Average : REAL
    END

VAR
    S1 : Student

BEGIN
    PRINT("=== USDB Algo Structures Test ===")
    
    // Assign values
    S1.ID <- 2023001
    S1.Name <- "Ahmed"
    S1.BirthDate.D <- 15
    S1.BirthDate.M <- 5
    S1.BirthDate.Y <- 2000
    S1.Average <- 14.75
    
    // Print the structure
    PRINT("Student ID:", S1.ID)
    PRINT("Name:", S1.Name)
    PRINT("Birth Date:", S1.BirthDate.D, "/", S1.BirthDate.M, "/", S1.BirthDate.Y)
    PRINT("Average:", S1.Average)
END.`,
          },
        ],
      };
    } else if (type === "algo-loops") {
      // USDB Algo: Loops Test
      newFolder = {
        id: rootId,
        name: "Algo_Loops",
        type: "folder",
        isOpen: true,
        children: [
          {
            id: newId(),
            name: "loops.algo",
            type: "file",
            content: `ALGORITHM LoopsTest
VAR
    i, sum : INTEGER

BEGIN
    PRINT("=== USDB Algo Loops Test ===")
    
    // FOR Loop
    PRINT("--- FOR Loop (1 to 5) ---")
    FOR i <- 1 TO 5 DO
        PRINT("i =", i)
    
    // FOR with STEP
    PRINT("--- FOR Loop with STEP 2 (0 to 10) ---")
    FOR i <- 0 TO 10 STEP 2 DO
        PRINT("i =", i)
    
    // WHILE Loop
    PRINT("--- WHILE Loop (countdown) ---")
    i <- 5
    WHILE (i > 0) DO
    BEGIN
        PRINT("Countdown:", i)
        i <- i - 1
    END
    
    // Calculate sum with FOR
    sum <- 0
    FOR i <- 1 TO 10 DO
        sum <- sum + i
    
    PRINT("Sum of 1 to 10 =", sum)
END.`,
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

  const [markers, setMarkers] = useState<
    {
      file: string;
      line: number;
      column: number;
      message: string;
      severity: "error" | "warning";
    }[]
  >([]);

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

  // Check for updates on app startup
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const result = await window.electron.checkForUpdates();
        if (result.hasUpdate) {
          setUpdateInfo(result);
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    };

    // Delay update check by 3 seconds to not impact startup performance
    const timer = setTimeout(checkUpdates, 3000);
    return () => clearTimeout(timer);
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

  // Translate handler
  const handleTranslate = () => {
    const file = findFile(files, activeFileId || "");
    if (!file || !file.content) {
      addLog("error", "No file selected to translate");
      return;
    }

    const newId = Math.random().toString(36).substr(2, 9);
    let newName: string;
    let newContent: string;

    if (file.name.endsWith(".algo")) {
      // Algo to C - validates syntax before translating
      const result = translateAlgoToC(file.content);
      if (result.success && result.cCode) {
        // Use _translated suffix to avoid duplicate symbol errors
        const baseName = file.name.replace(/\.algo$/i, "");
        newName = `${baseName}_translated.c`;
        newContent = result.cCode;
        addLog("success", `Translated ${file.name} to ${newName}`);
      } else {
        addLog("error", "Cannot translate - code has errors:");
        for (const err of result.errors) {
          addLog("error", err.toString());
        }
        return;
      }
    } else if (file.name.endsWith(".c")) {
      // C to Algo (best effort - limited subset of C)
      // Build workspace file map for include resolution
      const workspaceFiles = new Map<string, string>();
      const collectFiles = (items: FileSystemItem[], prefix = "") => {
        for (const item of items) {
          if (item.type === "file" && item.content) {
            const path = prefix ? `${prefix}/${item.name}` : item.name;
            workspaceFiles.set(path, item.content);
            workspaceFiles.set(item.name, item.content); // Also store by basename
          } else if (item.type === "folder" && item.children) {
            collectFiles(
              item.children,
              prefix ? `${prefix}/${item.name}` : item.name
            );
          }
        }
      };
      collectFiles(files);

      const result = translateCToAlgo(file.content, workspaceFiles);
      const baseName = file.name.replace(/\.c$/i, "");
      newName = `${baseName}_translated.algo`;
      newContent = result.algoCode;

      if (result.warnings.length > 0) {
        addLog("warning", "Translation warnings:");
        for (const w of result.warnings) {
          addLog("warning", w);
        }
      }
      addLog("success", `Translated ${file.name} to Algo`);
    } else {
      addLog("error", "Can only translate .algo or .c files");
      return;
    }

    const newFile: FileSystemItem = {
      id: newId,
      name: newName,
      type: "file",
      content: newContent,
    };

    setFiles([...files, newFile]);
    setOpenTabs((prev) => [...prev, newId]);
    setActiveFileId(newId);
  };

  // Tab handlers
  const handleFileSelect = (file: FileSystemItem) => {
    setActiveFileId(file.id);
    // Add to open tabs if not already there
    if (!openTabs.includes(file.id)) {
      setOpenTabs((prev) => [...prev, file.id]);
    }
  };

  const handleTabClick = (fileId: string) => {
    setActiveFileId(fileId);
  };

  const handleTabClose = (fileId: string) => {
    const tabIndex = openTabs.indexOf(fileId);
    const newTabs = openTabs.filter((id) => id !== fileId);
    setOpenTabs(newTabs);

    // If closing active tab, switch to another tab
    if (activeFileId === fileId) {
      if (newTabs.length > 0) {
        // Switch to next tab, or previous if closing last
        const newIndex = Math.min(tabIndex, newTabs.length - 1);
        setActiveFileId(newTabs[newIndex]);
      } else {
        setActiveFileId(null);
      }
    }
  };

  // Split editor handlers
  const handleSplitRight = (fileId: string) => {
    // Move file to split pane
    if (!splitTabs.includes(fileId)) {
      setSplitTabs((prev) => [...prev, fileId]);
    }
    setActiveSplitFileId(fileId);
    // Remove from main tabs
    setOpenTabs((prev) => prev.filter((id) => id !== fileId));
    if (activeFileId === fileId) {
      const remaining = openTabs.filter((id) => id !== fileId);
      setActiveFileId(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleSplitTabClick = (fileId: string) => {
    setActiveSplitFileId(fileId);
  };

  const handleSplitTabClose = (fileId: string) => {
    const tabIndex = splitTabs.indexOf(fileId);
    const newTabs = splitTabs.filter((id) => id !== fileId);
    setSplitTabs(newTabs);

    if (activeSplitFileId === fileId) {
      if (newTabs.length > 0) {
        const newIndex = Math.min(tabIndex, newTabs.length - 1);
        setActiveSplitFileId(newTabs[newIndex]);
      } else {
        setActiveSplitFileId(null);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setIsTerminalCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sidebar resize handler
  const handleSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(150, Math.min(500, startWidth + e.clientX - startX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      localStorage.setItem("c-studio-sidebar-width", sidebarWidth.toString());
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTerminalInput = (input: string) => {
    window.electron.writeStdin(input);
    addLog("info", input + "\n"); // Echo input to terminal
  };


  // ===== File System Handlers =====

  const handleNewFile = () => {
    handleFileCreate("untitled.c", "file");
  };

  const handleOpenFile = async () => {
    const result = await window.electron.showOpenDialog({
      title: "Open File",
      filters: [
        { name: "USDB Algo Files", extensions: ["algo"] },
        { name: "C Files", extensions: ["c", "h"] },
        { name: "Text Files", extensions: ["txt"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });

    if (result.canceled || !result.filePaths.length) return;

    const filePath = result.filePaths[0];
    const fileResult = await window.electron.readFile(filePath);

    if (fileResult.success) {
      const fileName = filePath.split(/[\\/]/).pop() || "file";
      const newFile: FileSystemItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: fileName,
        type: "file",
        content: fileResult.content,
      };
      setFiles([...files, newFile]);
      setActiveFileId(newFile.id);
      addLog("success", `Opened: ${fileName}`);
    } else {
      addLog("error", `Failed to open file: ${fileResult.error}`);
    }
  };

  const handleOpenFolder = async () => {
    const result = await window.electron.showOpenDialog({
      title: "Open Folder",
      properties: ["openDirectory"],
    });

    if (result.canceled || !result.filePaths.length) return;

    const folderPath = result.filePaths[0];
    const folderResult = await window.electron.readFolder(folderPath);

    if (folderResult.success) {
      // Convert folder result to FileSystemItem format
      const convertToFileSystemItem = (
        items: {
          name: string;
          type: "file" | "folder";
          content?: string;
          children?: unknown[];
        }[]
      ): FileSystemItem[] => {
        return items.map((item) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: item.name,
          type: item.type,
          content: item.content,
          children: item.children
            ? convertToFileSystemItem(
                item.children as {
                  name: string;
                  type: "file" | "folder";
                  content?: string;
                  children?: unknown[];
                }[]
              )
            : undefined,
          isOpen: true,
        }));
      };

      const newFolder: FileSystemItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: folderResult.folderName,
        type: "folder",
        children: convertToFileSystemItem(folderResult.files),
        isOpen: true,
      };

      setFiles([...files, newFolder]);
      addLog("success", `Opened folder: ${folderResult.folderName}`);
    } else {
      addLog("error", `Failed to open folder: ${folderResult.error}`);
    }
  };

  const handleSave = async () => {
    if (!activeFile || activeFile.type !== "file") {
      addLog("warning", "No file selected to save");
      return;
    }

    const result = await window.electron.showSaveDialog({
      title: "Save File",
      defaultPath: activeFile.name,
      filters: [
        { name: "C Files", extensions: ["c", "h"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (result.canceled || !result.filePath) return;

    const saveResult = await window.electron.saveFile(
      result.filePath,
      activeFile.content || ""
    );

    if (saveResult.success) {
      addLog("success", `Saved: ${result.filePath}`);
    } else {
      addLog("error", `Failed to save: ${saveResult.error}`);
    }
  };

  const handleExportWorkspace = async () => {
    const result = await window.electron.showSaveDialog({
      title: "Export Workspace",
      defaultPath: "project.cstudio",
      filters: [{ name: "C-Studio Workspace", extensions: ["cstudio"] }],
    });

    if (result.canceled || !result.filePath) return;

    const workspace = {
      version: "1.5.0",
      name: "C-Studio Project",
      files: files,
    };

    const saveResult = await window.electron.saveFile(
      result.filePath,
      JSON.stringify(workspace, null, 2)
    );

    if (saveResult.success) {
      addLog("success", `Workspace exported to: ${result.filePath}`);
    } else {
      addLog("error", `Failed to export: ${saveResult.error}`);
    }
  };

  const handleImportWorkspace = async () => {
    const result = await window.electron.showOpenDialog({
      title: "Import Workspace",
      filters: [{ name: "C-Studio Workspace", extensions: ["cstudio"] }],
      properties: ["openFile"],
    });

    if (result.canceled || !result.filePaths.length) return;

    const fileResult = await window.electron.readFile(result.filePaths[0]);

    if (fileResult.success) {
      try {
        const workspace = JSON.parse(fileResult.content);
        if (workspace.files && Array.isArray(workspace.files)) {
          setFiles(workspace.files);
          setActiveFileId(null);
          addLog(
            "success",
            `Workspace imported: ${workspace.name || "Unnamed"}`
          );
        } else {
          addLog("error", "Invalid workspace file format");
        }
      } catch {
        addLog("error", "Failed to parse workspace file");
      }
    } else {
      addLog("error", `Failed to import: ${fileResult.error}`);
    }
  };

  return (
    <ThemeProvider>
      <div
        className="flex flex-col h-screen w-full font-sans overflow-hidden"
        style={{
          backgroundColor: "var(--theme-bg-dark)",
          color: "var(--theme-fg)",
        }}
      >
        <TitleBar
          onNewFile={handleNewFile}
          onOpenFile={handleOpenFile}
          onOpenFolder={handleOpenFolder}
          onSaveFile={handleSave}
          onExportWorkspace={handleExportWorkspace}
          onImportWorkspace={handleImportWorkspace}
        />
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar collapse toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="h-full w-8 flex items-center justify-center hover:bg-white/5 transition-colors flex-shrink-0"
            style={{
              backgroundColor: "var(--theme-bg)",
              borderRight: "1px solid var(--theme-border)",
            }}
            title={
              isSidebarCollapsed
                ? "Expand Sidebar (Ctrl+B)"
                : "Collapse Sidebar (Ctrl+B)"
            }
          >
            <svg
              className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? "rotate-180" : ""}`}
              style={{ color: "var(--theme-fg-muted)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Resizable Sidebar */}
          <div
            className="flex-shrink-0 transition-all duration-200 overflow-hidden flex"
            style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
          >
            <Sidebar
              files={files}
              activeFileId={activeFileId}
              onFileSelect={handleFileSelect}
              onFileCreate={handleFileCreate}
              onDelete={handleDelete}
              onToggleFolder={handleToggleFolder}
              onMoveFile={handleMoveFile}
              onGenerateTest={handleGenerateTest}
              onRename={handleRename}
            />
            {/* Resize handle */}
            {!isSidebarCollapsed && (
              <div
                className="w-1 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors"
                style={{ backgroundColor: "var(--theme-border)" }}
                onMouseDown={handleSidebarResize}
              />
            )}
          </div>

          {/* Main Editor and Split Editor */}
          <div className="flex-1 flex min-w-0">
            {/* Primary Editor */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 flex flex-col min-h-0">
                {activeFile ? (
                  <MonacoEditor
                    activeFile={activeFile}
                    onContentChange={handleContentChange}
                    onRun={handleRun}
                    isCompiling={isCompiling}
                    markers={markers}
                    openTabs={openTabs}
                    files={files}
                    onTabClick={handleTabClick}
                    onTabClose={handleTabClose}
                    onSplitRight={handleSplitRight}
                    onTranslate={handleTranslate}
                  />
                ) : (
                  <div
                    className="flex-1 flex items-center justify-center text-muted-foreground"
                    style={{ backgroundColor: "var(--theme-bg-dark)" }}
                  >
                    Select a file to edit
                  </div>
                )}
              </div>
              {/* Collapsible Terminal */}
              <div className={`flex-shrink-0 transition-all duration-200 ${isTerminalCollapsed ? "h-8" : "h-1/3"}`}>
                <div
                  className="h-8 flex items-center justify-between px-3 cursor-pointer"
                  style={{ backgroundColor: "var(--theme-bg)", borderTop: "1px solid var(--theme-border)" }}
                  onClick={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--theme-fg-muted)" }}>
                    Terminal
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: "var(--theme-fg-muted)" }}>Ctrl+`</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${isTerminalCollapsed ? "" : "rotate-180"}`}
                      style={{ color: "var(--theme-fg-muted)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                </div>
                {!isTerminalCollapsed && (
                  <div className="h-[calc(100%-2rem)]">
                    <TerminalPanel
                      logs={logs}
                      onClear={() => setLogs([])}
                      onInput={handleTerminalInput}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Split Editor (Right Pane) */}
            {splitTabs.length > 0 && (
              <div
                className="flex-1 flex flex-col min-w-0"
                style={{ borderLeft: "1px solid var(--theme-border)" }}
              >
                <div className="flex-1 flex flex-col min-h-0">
                  {activeSplitFileId && findFile(files, activeSplitFileId) ? (
                    <MonacoEditor
                      activeFile={findFile(files, activeSplitFileId)!}
                      onContentChange={handleContentChange}
                      onRun={handleRun}
                      isCompiling={isCompiling}
                      markers={markers}
                      openTabs={splitTabs}
                      files={files}
                      onTabClick={handleSplitTabClick}
                      onTabClose={handleSplitTabClose}
                    />
                  ) : (
                    <div
                      className="flex-1 flex items-center justify-center text-muted-foreground"
                      style={{ backgroundColor: "var(--theme-bg-dark)" }}
                    >
                      Select a file
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Update notification popup */}
        {updateInfo && (
          <UpdateNotification
            updateInfo={updateInfo}
            onDismiss={() => setUpdateInfo(null)}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
