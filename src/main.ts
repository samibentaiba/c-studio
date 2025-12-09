import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import fs from "node:fs";
import started from "electron-squirrel-startup";
import { compileProject, checkSyntax, runBinary } from "./compiler";
import { ChildProcess } from "child_process";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Fix for SUID sandbox helper issue in some environments
app.commandLine.appendSwitch("no-sandbox");

let mainWindow: BrowserWindow | null = null;
let runningProcess: ChildProcess | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    autoHideMenuBar: true, // Hide the native menu bar
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  ipcMain.handle("compile-project", async (event, files, activeFileId) => {
    try {
      return await compileProject(files, activeFileId);
    } catch (error) {
      const err = error as Error;
      return { success: false, error: err.message };
    }
  });

  ipcMain.on("run-project", (event, exePath, cwd) => {
    if (runningProcess) {
      runningProcess.kill();
    }

    runningProcess = runBinary(
      exePath,
      cwd,
      (data) => {
        if (mainWindow) {
          mainWindow.webContents.send("process-output", data);
        }
      },
      (code) => {
        if (mainWindow) {
          mainWindow.webContents.send("process-exit", code);
        }
        runningProcess = null;
      }
    );
  });

  ipcMain.on("write-stdin", (event, data) => {
    if (runningProcess && runningProcess.stdin) {
      runningProcess.stdin.write(data + "\n");
    }
  });

  ipcMain.on("kill-process", () => {
    if (runningProcess) {
      runningProcess.kill();
      runningProcess = null;
    }
  });

  ipcMain.handle("syntax-check", async (event, files) => {
    try {
      return await checkSyntax(files);
    } catch (error) {
      return [];
    }
  });

  // Get the path to the clang-format WASM file
  ipcMain.handle("get-clang-format-wasm-path", () => {
    const isDev = !!MAIN_WINDOW_VITE_DEV_SERVER_URL;
    if (isDev) {
      // In development, Vite serves from public folder
      return `${MAIN_WINDOW_VITE_DEV_SERVER_URL}clang-format.wasm`;
    } else {
      // In production, it's in the resources folder
      const wasmPath = path.join(process.resourcesPath, "clang-format.wasm");
      // Convert to file:// URL for the fetch API
      return `file://${wasmPath.replace(/\\/g, "/")}`;
    }
  });

  // ===== Auto-Update Check =====
  ipcMain.handle("check-for-updates", async () => {
    try {
      // Get current version from package.json
      const currentVersion = app.getVersion();
      
      // Fetch latest release from GitHub
      const response = await fetch(
        "https://api.github.com/repos/samibentaiba/c-studio/releases/latest",
        {
          headers: {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "C-Studio-App"
          }
        }
      );
      
      if (!response.ok) {
        return { hasUpdate: false, error: "Failed to check for updates" };
      }
      
      const release = await response.json();
      const latestVersion = release.tag_name.replace(/^v/, ""); // Remove 'v' prefix
      
      // Compare versions
      const hasUpdate = isNewerVersion(currentVersion, latestVersion);
      
      return {
        hasUpdate,
        currentVersion,
        latestVersion,
        releaseUrl: release.html_url,
        downloadUrl: release.assets?.[0]?.browser_download_url || release.html_url,
        releaseNotes: release.body || "No release notes available.",
        releaseName: release.name || `v${latestVersion}`
      };
    } catch (error) {
      console.error("Update check failed:", error);
      return { hasUpdate: false, error: "Failed to check for updates" };
    }
  });

  // Helper function to compare semantic versions
  function isNewerVersion(current: string, latest: string): boolean {
    const a = current.split(".").map(Number);
    const b = latest.split(".").map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if ((b[i] || 0) > (a[i] || 0)) return true;
      if ((b[i] || 0) < (a[i] || 0)) return false;
    }
    return false;
  }

  // Download and install update
  ipcMain.handle("download-and-install-update", async (event, downloadUrl: string, version: string) => {
    try {
      const os = await import("os");
      const https = await import("https");
      const http = await import("http");
      const { pipeline } = await import("stream/promises");
      const { spawn } = await import("child_process");
      
      // Notify renderer of progress
      const sendProgress = (status: string, progress?: number) => {
        if (mainWindow) {
          mainWindow.webContents.send("update-progress", { status, progress });
        }
      };

      sendProgress("Downloading update...", 0);

      // Download the ZIP file
      const tempDir = os.tmpdir();
      const zipPath = path.join(tempDir, `c-studio-update-${version}.zip`);
      
      // Use https or http based on URL
      const protocol = downloadUrl.startsWith("https") ? https : http;
      
      // Follow redirects for GitHub releases
      const downloadWithRedirects = (url: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          const request = protocol.get(url, { headers: { "User-Agent": "C-Studio-App" } }, (response) => {
            // Handle redirects
            if (response.statusCode === 302 || response.statusCode === 301) {
              const redirectUrl = response.headers.location;
              if (redirectUrl) {
                downloadWithRedirects(redirectUrl).then(resolve).catch(reject);
                return;
              }
            }
            
            if (response.statusCode !== 200) {
              reject(new Error(`Failed to download: ${response.statusCode}`));
              return;
            }
            
            const totalSize = parseInt(response.headers["content-length"] || "0", 10);
            let downloadedSize = 0;
            
            const writeStream = fs.createWriteStream(zipPath);
            
            response.on("data", (chunk) => {
              downloadedSize += chunk.length;
              if (totalSize > 0) {
                const progress = Math.round((downloadedSize / totalSize) * 100);
                sendProgress("Downloading update...", progress);
              }
            });
            
            response.pipe(writeStream);
            
            writeStream.on("finish", () => {
              writeStream.close();
              resolve();
            });
            
            writeStream.on("error", reject);
          });
          
          request.on("error", reject);
        });
      };
      
      await downloadWithRedirects(downloadUrl);
      
      sendProgress("Extracting update...", 100);
      
      // Get installation directory (where app is running from)
      const installDir = app.isPackaged 
        ? path.dirname(app.getPath("exe"))
        : path.join(__dirname, "..", "..");
      
      // Create update script that runs after app closes
      const updateScript = path.join(tempDir, "c-studio-update.ps1");
      const scriptContent = `
# Wait for app to close
Start-Sleep -Seconds 2

# Extract ZIP (skip mingw64 folder if it exists)
$zipPath = "${zipPath.replace(/\\/g, "\\\\")}"
$installDir = "${installDir.replace(/\\/g, "\\\\")}"

# Create temp extraction folder
$tempExtract = Join-Path $env:TEMP "c-studio-extract"
if (Test-Path $tempExtract) { Remove-Item -Recurse -Force $tempExtract }
Expand-Archive -Path $zipPath -DestinationPath $tempExtract -Force

# Find the inner folder (c-studio-win32-x64)
$innerFolder = Get-ChildItem -Path $tempExtract -Directory | Select-Object -First 1

if ($innerFolder) {
    # Copy all files except mingw64 (preserve existing)
    Get-ChildItem -Path $innerFolder.FullName | Where-Object { $_.Name -ne "resources" } | ForEach-Object {
        $dest = Join-Path $installDir $_.Name
        if ($_.PSIsContainer) {
            Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
        } else {
            Copy-Item -Path $_.FullName -Destination $dest -Force
        }
    }
    
    # Handle resources folder specially - preserve mingw64
    $resourcesSrc = Join-Path $innerFolder.FullName "resources"
    if (Test-Path $resourcesSrc) {
        $resourcesDest = Join-Path $installDir "resources"
        Get-ChildItem -Path $resourcesSrc | Where-Object { $_.Name -ne "mingw64" } | ForEach-Object {
            $dest = Join-Path $resourcesDest $_.Name
            if ($_.PSIsContainer) {
                Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
            } else {
                Copy-Item -Path $_.FullName -Destination $dest -Force
            }
        }
    }
}

# Cleanup
Remove-Item -Recurse -Force $tempExtract -ErrorAction SilentlyContinue
Remove-Item -Force $zipPath -ErrorAction SilentlyContinue

# Restart app
$exePath = Join-Path $installDir "c-studio.exe"
if (Test-Path $exePath) { Start-Process $exePath }
`;
      
      fs.writeFileSync(updateScript, scriptContent, "utf-8");
      
      sendProgress("Installing update...", 100);
      
      // Run update script and quit app
      spawn("powershell", ["-ExecutionPolicy", "Bypass", "-File", updateScript], {
        detached: true,
        stdio: "ignore",
      }).unref();
      
      // Quit app after short delay
      setTimeout(() => {
        app.quit();
      }, 500);
      
      return { success: true };
    } catch (error) {
      console.error("Update failed:", error);
      return { success: false, error: (error as Error).message };
    }
  });

  // ===== File System IPC Handlers =====

  // Show save dialog
  ipcMain.handle("show-save-dialog", async (event, options: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => {
    if (!mainWindow) return { canceled: true };
    const result = await dialog.showSaveDialog(mainWindow, {
      title: options.title || "Save File",
      defaultPath: options.defaultPath,
      filters: options.filters || [{ name: "All Files", extensions: ["*"] }],
    });
    return result;
  });

  // Show open dialog
  ipcMain.handle("show-open-dialog", async (event, options: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    properties?: ("openFile" | "openDirectory" | "multiSelections")[];
  }) => {
    if (!mainWindow) return { canceled: true };
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || "Open",
      filters: options.filters || [{ name: "All Files", extensions: ["*"] }],
      properties: options.properties || ["openFile"],
    });
    return result;
  });

  // Save file to disk
  ipcMain.handle("save-file", async (event, filePath: string, content: string) => {
    try {
      fs.writeFileSync(filePath, content, "utf-8");
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Read file from disk
  ipcMain.handle("read-file", async (event, filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return { success: true, content };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Read folder recursively
  ipcMain.handle("read-folder", async (event, folderPath: string) => {
    try {
      const readDirRecursive = (dir: string): { name: string; type: "file" | "folder"; content?: string; children?: unknown[] }[] => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        return items.map((item) => {
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            return {
              name: item.name,
              type: "folder" as const,
              children: readDirRecursive(fullPath),
            };
          } else {
            // Only read text files
            const ext = path.extname(item.name).toLowerCase();
            const textExts = [".c", ".h", ".txt", ".md", ".json", ".js", ".ts", ".css", ".html"];
            let content = "";
            if (textExts.includes(ext) || ext === "") {
              try {
                content = fs.readFileSync(fullPath, "utf-8");
              } catch {
                content = "";
              }
            }
            return {
              name: item.name,
              type: "file" as const,
              content,
            };
          }
        });
      };

      const files = readDirRecursive(folderPath);
      return { success: true, files, folderName: path.basename(folderPath) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
