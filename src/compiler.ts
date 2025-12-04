import path from "path";
import { app } from "electron";
import fs from "fs";
import { execFile } from "child_process";
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
  output: string;
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
          output: "",
          error: `Critical Error: Compiler not found at:\n${gcc}\n\nDid you extract MinGW to 'resources/mingw64'?`
        });
        return;
      }

      // 3. Write Source Files Recursively
      const cFiles: string[] = [];
      writeFilesRecursively(items, tempDir, cFiles, tempDir);

      if (cFiles.length === 0) {
        resolve({ success: false, output: "", error: "No .c files found to compile." });
        return;
      }

      // Filter C files:
      // 1. Always include the active file (if it's a .c file)
      // 2. Include other .c files ONLY IF they don't have a "main" function
      // This allows multiple "main" files to coexist in the project, but only one is compiled at a time.
      
      let filesToCompile = cFiles;
      let activeRelativePath: string | null = null;

      if (activeFileId) {
        // Find active file path relative to tempDir
        // We need to traverse the items to find the name/path of the active file
        // But cFiles contains relative paths.
        // Let's re-traverse to find the active file's relative path.
        
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
            // Always keep the active file
            if (file === activeRelativePath) return true;

            // For other files, check if they have 'main'
            const content = fs.readFileSync(path.join(tempDir, file), 'utf-8');
            // Simple regex to detect main function: int main(...) or void main(...)
            // We look for "main" followed by optional whitespace and "("
            // We also check it's not part of another word (boundary \b)
            const hasMain = /\bmain\s*\(/.test(content);
            
            return !hasMain;
          });
        }
      }

      if (filesToCompile.length === 0) {
         resolve({ success: false, output: "", error: "No suitable source files found to compile." });
         return;
      }

      // 4. Compile
      // IMPORTANT: We add the bin directory to PATH so gcc can find ld.exe (linker)
      const env = { ...process.env, PATH: `${binDir};${process.env.PATH}` };

      execFile(
        gcc,
        [...filesToCompile, "-o", "app.exe"],
        { cwd: tempDir, env },
        (error, stdout, stderr) => {
          if (error) {
            resolve({
              success: false,
              output: stdout,
              error: stderr || error.message,
            });
            return;
          }

          // 5. Run the Application
          // Determine the working directory for execution
          // If we have an active file, use its directory so relative paths (like fopen("data.txt")) work.
          let runCwd = tempDir;
          if (activeRelativePath) {
            runCwd = path.join(tempDir, path.dirname(activeRelativePath));
          }

          execFile(
            outputExe,
            [],
            { cwd: runCwd },
            (runError, runStdout, runStderr) => {
              // Clean up temp files (optional)
              try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }

              resolve({
                success: true,
                output: runStdout + (runStderr ? "\n" + runStderr : ""),
                error: runError ? runError.message : undefined
              });
            }
          );
        }
      );
    } catch (e) {
      const error = e as Error;
      resolve({ success: false, output: "", error: error.message });
    }
  });
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
          // Clean up
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }

          if (!error) {
            resolve([]);
            return;
          }

          // Parse stderr for errors
          // Format: filename:line:col: error: message
          const errors: SyntaxError[] = [];
          const lines = (stderr || "").split("\n");
          
          const regex = /^(.*?):(\d+):(\d+):\s+(error|warning):\s+(.*)$/;

          lines.forEach(line => {
            const match = line.match(regex);
            if (match) {
              errors.push({
                file: match[1], // This will be relative path like "main.c"
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