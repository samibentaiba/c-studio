import path from "path";
import { app } from "electron";
import fs from "fs";
import { execFile, spawn, ChildProcess } from "child_process";
import os from "os";
import { compile as compileUSDB, isUSDBFile } from "./usdb-compiler";

// 1. Locate the Compiler
export const getGccPath = () => {
  // On Linux/macOS, use system GCC
  if (process.platform !== "win32") {
    return {
      gcc: "gcc", // Use system gcc from PATH
      binDir: "", // Not needed, gcc is in PATH
    };
  }

  // On Windows, use bundled MinGW
  const isDev = !app.isPackaged;
  // In Development: Use the folder in your project root
  // app.getAppPath() points to the 'c-studio' folder
  const basePath = isDev
    ? path.join(app.getAppPath(), "resources/mingw64")
    : path.join(process.resourcesPath, "mingw64");

  return {
    gcc: path.join(basePath, "bin", "gcc.exe"),
    binDir: path.join(basePath, "bin"),
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

// Helper to write files recursively (with USDB transpilation)
const writeFilesRecursively = (
  items: FileSystemItem[],
  currentPath: string,
  cFiles: string[],
  tempDir: string,
  transpileErrors: string[]
) => {
  items.forEach((item) => {
    const itemPath = path.join(currentPath, item.name);

    if (item.type === "folder") {
      if (!fs.existsSync(itemPath)) fs.mkdirSync(itemPath);
      if (item.children) {
        writeFilesRecursively(
          item.children,
          itemPath,
          cFiles,
          tempDir,
          transpileErrors
        );
      }
    } else {
      // Handle .algo files - transpile to C
      if (isUSDBFile(item.name)) {
        const result = compileUSDB(item.content || "");
        if (result.success && result.cCode) {
          // Write the transpiled C file
          const cFileName = item.name.replace(/\.algo$/i, ".c");
          const cFilePath = path.join(currentPath, cFileName);
          fs.writeFileSync(cFilePath, result.cCode);
          cFiles.push(path.relative(tempDir, cFilePath));

          // Also write the original .algo for reference
          fs.writeFileSync(itemPath, item.content || "");
        } else {
          // Collect transpilation errors
          const errors = result.errors.map((e) => e.toString()).join("\n");
          transpileErrors.push(`${item.name}:\n${errors}`);
        }
      } else {
        // Write file content normally
        fs.writeFileSync(itemPath, item.content || "");
        if (item.name.endsWith(".c")) {
          // Store relative path for gcc
          cFiles.push(path.relative(tempDir, itemPath));
        }
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
      const outputExe = path.join(
        tempDir,
        process.platform === "win32" ? "app.exe" : "app"
      );

      // Verify Compiler Exists (skip for system GCC on Linux/macOS)
      if (process.platform === "win32" && !fs.existsSync(gcc)) {
        resolve({
          success: false,
          error: `Critical Error: Compiler not found at:\n${gcc}\n\nDid you extract MinGW to 'resources/mingw64'?`,
        });
        return;
      }

      // 3. Write Source Files Recursively (and transpile .algo files)
      const cFiles: string[] = [];
      const transpileErrors: string[] = [];
      writeFilesRecursively(items, tempDir, cFiles, tempDir, transpileErrors);

      // Check for transpilation errors first
      if (transpileErrors.length > 0) {
        resolve({
          success: false,
          error:
            "USDB Algo transpilation failed:\n" + transpileErrors.join("\n\n"),
        });
        return;
      }

      if (cFiles.length === 0) {
        resolve({
          success: false,
          error: "No .c or .algo files found to compile.",
        });
        return;
      }

      // Create a wrapper header to force unbuffered stdout/stderr
      // This ensures printf output appears before scanf blocks for input
      const unbufferHeader = path.join(tempDir, "_cstudio_unbuffer.h");
      fs.writeFileSync(
        unbufferHeader,
        `#ifndef _CSTUDIO_UNBUFFER_H
#define _CSTUDIO_UNBUFFER_H
#include <stdio.h>
__attribute__((constructor)) static void _cstudio_init(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}
#endif
`
      );

      // Filter C files:
      let filesToCompile = cFiles;
      let activeRelativePath: string | null = null;

      if (activeFileId) {
        const findActiveFile = (
          items: FileSystemItem[],
          currentPath: string
        ): { relativePath: string; name: string } | null => {
          for (const item of items) {
            const itemPath = path.join(currentPath, item.name);
            if (item.id === activeFileId) {
              return {
                relativePath: path.relative(tempDir, itemPath),
                name: item.name,
              };
            }
            if (item.children) {
              const found = findActiveFile(item.children, itemPath);
              if (found) return found;
            }
          }
          return null;
        };

        const activeFile = findActiveFile(items, tempDir);
        if (activeFile) {
          activeRelativePath = activeFile.relativePath;

          // If active file is .algo, only compile the transpiled C file
          if (isUSDBFile(activeFile.name)) {
            const transpiledName = activeFile.name.replace(/\.algo$/i, ".c");
            const transpiledPath = cFiles.find((f) =>
              f.endsWith(transpiledName)
            );
            if (transpiledPath) {
              filesToCompile = [transpiledPath];
            }
          } else if (activeRelativePath && activeRelativePath.endsWith(".c")) {
            // For .c files, filter out other files with main()
            filesToCompile = cFiles.filter((file) => {
              if (file === activeRelativePath) return true;
              const content = fs.readFileSync(
                path.join(tempDir, file),
                "utf-8"
              );
              const hasMain = /\bmain\s*\(/.test(content);
              return !hasMain;
            });
          }
        }
      }

      if (filesToCompile.length === 0) {
        resolve({
          success: false,
          error: "No suitable source files found to compile.",
        });
        return;
      }

      // 4. Compile
      const pathSep = process.platform === "win32" ? ";" : ":";
      const env = {
        ...process.env,
        PATH: `${binDir}${pathSep}${process.env.PATH}`,
      };
      const outputName = process.platform === "win32" ? "app.exe" : "app";

      // On Linux/macOS, we need to link the math library
      const gccArgs = [
        ...filesToCompile,
        "-include",
        "_cstudio_unbuffer.h",
        "-o",
        outputName,
        ...(process.platform !== "win32" ? ["-lm"] : []),
      ];

      execFile(gcc, gccArgs, { cwd: tempDir, env }, (error, stdout, stderr) => {
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
          cwd: runCwd,
        });
      });
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
  const child = spawn(exePath, [], { cwd, stdio: ["pipe", "pipe", "pipe"] });

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
    } catch (e) {
      /* ignore */
    }
  });

  return child;
};

export const checkSyntax = async (
  items: FileSystemItem[]
): Promise<SyntaxError[]> => {
  return new Promise((resolve) => {
    try {
      const tempDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "c-studio-syntax-")
      );
      const { gcc, binDir } = getGccPath();

      if (!fs.existsSync(gcc)) {
        resolve([]);
        return;
      }

      const cFiles: string[] = [];
      const transpileErrors: string[] = [];
      writeFilesRecursively(items, tempDir, cFiles, tempDir, transpileErrors);

      if (cFiles.length === 0 || transpileErrors.length > 0) {
        resolve([]);
        return;
      }

      const env = { ...process.env, PATH: `${binDir};${process.env.PATH}` };

      execFile(
        gcc,
        ["-fsyntax-only", ...cFiles],
        { cwd: tempDir, env },
        (error, stdout, stderr) => {
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (e) {
            /* ignore */
          }

          if (!error) {
            resolve([]);
            return;
          }

          const errors: SyntaxError[] = [];
          const lines = (stderr || "").split("\n");

          const regex = /^(.*?):(\d+):(\d+):\s+(error|warning):\s+(.*)$/;

          lines.forEach((line) => {
            const match = line.match(regex);
            if (match) {
              errors.push({
                file: match[1],
                line: parseInt(match[2]),
                column: parseInt(match[3]),
                severity: match[4] as "error" | "warning",
                message: match[5],
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
