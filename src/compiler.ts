import path from "path";
import { app } from "electron";
import fs from "fs";
import { execFile, spawn, ChildProcess } from "child_process";
import os from "os";

// 1. Locate the Compiler
export const getGccPath = () => {
  const isDev = !app.isPackaged;
  // In Development: Use the folder in your project root
  // app.getAppPath() points to the 'c-studio' folder
  const basePath = isDev
    ? path.join(app.getAppPath(), "resources/mingw64")
    : path.join(process.resourcesPath, "mingw64");

  return {
    gcc: path.join(basePath, "bin", "gcc.exe"),
    binDir: path.join(basePath, "bin")
  };
};

export interface FileSystemItem {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  children?: FileSystemItem[];
}

interface CompileResult {
  success: boolean;
  exePath?: string;
  cwd?: string;
  error?: string;
}

interface SyntaxError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}

// Helper to write files recursively
const writeFilesRecursively = (items: FileSystemItem[], currentPath: string, cFiles: string[], tempDir: string) => {
  items.forEach((item) => {
    const itemPath = path.join(currentPath, item.name);
    
    if (item.type === "folder") {
      if (!fs.existsSync(itemPath)) fs.mkdirSync(itemPath);
      if (item.children) {
        writeFilesRecursively(item.children, itemPath, cFiles, tempDir);
      }
    } else {
      // Write file content
      fs.writeFileSync(itemPath, item.content || "");
      if (item.name.endsWith(".c")) {
        // Store relative path for gcc
        cFiles.push(path.relative(tempDir, itemPath));
      }
    }
  });
};

export const compileProject = async (
  items: FileSystemItem[],
  activeFileId?: string
): Promise<CompileResult> => {
  return new Promise((resolve) => {
    try {
      // 2. Setup Temporary Workspace
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "c-studio-"));
      const { gcc, binDir } = getGccPath();
      const outputExe = path.join(tempDir, "app.exe");

      // Verify Compiler Exists
      if (!fs.existsSync(gcc)) {
        resolve({
          success: false,
          error: `Critical Error: Compiler not found at:\n${gcc}\n\nDid you extract MinGW to 'resources/mingw64'?`
        });
        return;
      }

      // 3. Write Source Files Recursively
      const cFiles: string[] = [];
      writeFilesRecursively(items, tempDir, cFiles, tempDir);

      if (cFiles.length === 0) {
        resolve({ success: false, error: "No .c files found to compile." });
        return;
      }

      // Create a wrapper header to force unbuffered stdout/stderr
      // This ensures printf output appears before scanf blocks for input
      const unbufferHeader = path.join(tempDir, "_cstudio_unbuffer.h");
      fs.writeFileSync(unbufferHeader, `#ifndef _CSTUDIO_UNBUFFER_H
#define _CSTUDIO_UNBUFFER_H
#include <stdio.h>
__attribute__((constructor)) static void _cstudio_init(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}
#endif
`);

      // Filter C files:
      let filesToCompile = cFiles;
      let activeRelativePath: string | null = null;

      if (activeFileId) {
        const findActivePath = (items: FileSystemItem[], currentPath: string): string | null => {
          for (const item of items) {
            const itemPath = path.join(currentPath, item.name);
            if (item.id === activeFileId) {
              return path.relative(tempDir, itemPath);
            }
            if (item.children) {
              const found = findActivePath(item.children, itemPath);
              if (found) return found;
            }
          }
          return null;
        };

        activeRelativePath = findActivePath(items, tempDir);

        if (activeRelativePath && activeRelativePath.endsWith(".c")) {
          filesToCompile = cFiles.filter(file => {
            if (file === activeRelativePath) return true;
            const content = fs.readFileSync(path.join(tempDir, file), 'utf-8');
            const hasMain = /\bmain\s*\(/.test(content);
            return !hasMain;
          });
        }
      }

      if (filesToCompile.length === 0) {
         resolve({ success: false, error: "No suitable source files found to compile." });
         return;
      }

      // 4. Compile
      const env = { ...process.env, PATH: `${binDir};${process.env.PATH}` };

      execFile(
        gcc,
        [...filesToCompile, "-include", "_cstudio_unbuffer.h", "-o", "app.exe"],
        { cwd: tempDir, env },
        (error, stdout, stderr) => {
          if (error) {
            resolve({
              success: false,
              error: stderr || error.message || stdout,
            });
            return;
          }

          // Determine the working directory for execution
          let runCwd = tempDir;
          if (activeRelativePath) {
            runCwd = path.join(tempDir, path.dirname(activeRelativePath));
          }

          resolve({
            success: true,
            exePath: outputExe,
            cwd: runCwd
          });
        }
      );
    } catch (e) {
      const error = e as Error;
      resolve({ success: false, error: error.message });
    }
  });
};

export const runBinary = (
  exePath: string,
  cwd: string,
  onData: (data: string) => void,
  onExit: (code: number | null) => void
): ChildProcess => {
  const child = spawn(exePath, [], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });

  child.stdout.on("data", (data) => {
    onData(data.toString());
  });

  child.stderr.on("data", (data) => {
    onData(data.toString());
  });

  child.on("close", (code) => {
    onExit(code);
    // Cleanup is tricky here because we might want to keep the temp dir for debugging
    // or clean it up later. For now, we rely on OS temp cleanup or manual cleanup if needed.
    // Ideally, we should pass the tempDir to runBinary and clean it up here.
    // But since we split compile/run, the tempDir is created in compile.
    // We can extract the tempDir from exePath or cwd if we really want to clean up.
    try {
       // cwd is usually inside tempDir or is tempDir
       // If cwd is "tempDir/src", we want to remove "tempDir"
       // But "tempDir" is "c-studio-XXXXXX".
       // Let's just try to remove the parent of app.exe which is tempDir
       const tempDir = path.dirname(exePath);
       if (tempDir.includes("c-studio-")) {
          fs.rmSync(tempDir, { recursive: true, force: true });
       }
    } catch (e) { /* ignore */ }
  });

  return child;
};

export const checkSyntax = async (
  items: FileSystemItem[]
): Promise<SyntaxError[]> => {
  return new Promise((resolve) => {
    try {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "c-studio-syntax-"));
      const { gcc, binDir } = getGccPath();

      if (!fs.existsSync(gcc)) {
        resolve([]);
        return;
      }

      const cFiles: string[] = [];
      writeFilesRecursively(items, tempDir, cFiles, tempDir);

      if (cFiles.length === 0) {
        resolve([]);
        return;
      }

      const env = { ...process.env, PATH: `${binDir};${process.env.PATH}` };

      execFile(
        gcc,
        ["-fsyntax-only", ...cFiles],
        { cwd: tempDir, env },
        (error, stdout, stderr) => {
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }

          if (!error) {
            resolve([]);
            return;
          }

          const errors: SyntaxError[] = [];
          const lines = (stderr || "").split("\n");
          
          const regex = /^(.*?):(\d+):(\d+):\s+(error|warning):\s+(.*)$/;

          lines.forEach(line => {
            const match = line.match(regex);
            if (match) {
              errors.push({
                file: match[1],
                line: parseInt(match[2]),
                column: parseInt(match[3]),
                severity: match[4] as "error" | "warning",
                message: match[5]
              });
            }
          });

          resolve(errors);
        }
      );
    } catch (e) {
      resolve([]);
    }
  });
};