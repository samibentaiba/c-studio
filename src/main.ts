import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
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
