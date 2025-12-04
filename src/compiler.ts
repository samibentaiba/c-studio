import path from "path";
import { app } from "electron";
import fs from "fs";
import { execFile } from "child_process";
import os from "os";

// Helper to get the path to the bundled GCC
export const getGccPath = () => {
  const isDev = !app.isPackaged;
  // Windows-only logic as requested
  return isDev
    ? path.join(__dirname, "../../resources/mingw64/bin/gcc.exe")
    : path.join(process.resourcesPath, "mingw64/bin/gcc.exe");
};

interface CodeFile {
  name: string;
  content: string;
}

interface CompileResult {
  success: boolean;
  output: string;
  error?: string;
}

export const compileProject = async (
  files: CodeFile[]
): Promise<CompileResult> => {
  return new Promise((resolve) => {
    // 1. Create a temp directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "c-studio-"));

    try {
      // 2. Write all files to the temp directory
      files.forEach((file) => {
        fs.writeFileSync(path.join(tempDir, file.name), file.content);
      });

      const gccPath = getGccPath();
      const outputExe = path.join(tempDir, "app.exe");
      const binDir = path.dirname(gccPath); // Get the 'bin' folder path

      // 3. Compile using GCC
      // Command: gcc.exe *.c -o app.exe
      const cFiles = files
        .filter((f) => f.name.endsWith(".c"))
        .map((f) => f.name);

      if (cFiles.length === 0) {
        resolve({
          success: false,
          output: "",
          error: "No .c files found to compile.",
        });
        return;
      }

      // Check if GCC exists
      if (!fs.existsSync(gccPath)) {
        resolve({
          success: false,
          output: "",
          error: `Compiler not found at ${gccPath}. Please ensure MinGW is installed in resources/mingw64.`,
        });
        return;
      }

      // CRITICAL: Add MinGW bin to PATH so gcc can find ld.exe, as.exe, etc.
      const childEnv = {
        ...process.env,
        PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
      };

      execFile(
        gccPath,
        [...cFiles, "-o", "app.exe"],
        { cwd: tempDir, env: childEnv },
        (error, stdout, stderr) => {
          if (error) {
            resolve({
              success: false,
              output: stdout,
              error: stderr || error.message,
            });
            return;
          }

          // 4. Run the resulting executable
          execFile(
            outputExe,
            [],
            { cwd: tempDir },
            (runError, runStdout, runStderr) => {
              if (runError) {
                resolve({
                  success: false,
                  output: runStdout,
                  error: runStderr || runError.message,
                });
              } else {
                resolve({
                  success: true,
                  output: runStdout + (runStderr ? "\n" + runStderr : ""),
                });
              }
            }
          );
        }
      );
    } catch (e: any) {
      resolve({ success: false, output: "", error: e.message });
    }
  });
};
