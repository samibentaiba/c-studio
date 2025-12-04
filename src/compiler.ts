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

      // 3. Write Source Files
      const cFiles: string[] = [];
      files.forEach((file) => {
        fs.writeFileSync(path.join(tempDir, file.name), file.content);
        if (file.name.endsWith(".c")) cFiles.push(file.name);
      });

      if (cFiles.length === 0) {
        resolve({ success: false, output: "", error: "No .c files found to compile." });
        return;
      }

      // 4. Compile
      // IMPORTANT: We add the bin directory to PATH so gcc can find ld.exe (linker)
      const env = { ...process.env, PATH: `${binDir};${process.env.PATH}` };

      execFile(
        gcc,
        [...cFiles, "-o", "app.exe"],
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
          execFile(
            outputExe,
            [],
            { cwd: tempDir },
            (runError, runStdout, runStderr) => {
              // Clean up temp files (optional)
              try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}

              resolve({
                success: true,
                output: runStdout + (runStderr ? "\n" + runStderr : ""),
                error: runError ? runError.message : undefined
              });
            }
          );
        }
      );
    } catch (e: any) {
      resolve({ success: false, output: "", error: e.message });
    }
  });
};