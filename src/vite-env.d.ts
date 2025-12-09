/// <reference types="vite/client" />

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

interface DialogResult {
  canceled: boolean;
  filePath?: string;
  filePaths?: string[];
}

interface FileResult {
  success: boolean;
  content?: string;
  error?: string;
}

interface FolderResult {
  success: boolean;
  files?: { name: string; type: "file" | "folder"; content?: string; children?: unknown[] }[];
  folderName?: string;
  error?: string;
}

interface SaveResult {
  success: boolean;
  error?: string;
}

interface Window {
  electron: {
    // Compiler operations
    compileProject: (files: unknown, activeFileId?: string) => Promise<{ success: boolean; exePath?: string; cwd?: string; error?: string }>;
    runProject: (exePath: string, cwd: string) => void;
    writeStdin: (data: string) => void;
    killProcess: () => void;
    onProcessOutput: (callback: (data: string) => void) => void;
    onProcessExit: (callback: (code: number) => void) => void;
    checkSyntax: (files: unknown) => Promise<{ file: string; line: number; column: number; message: string; severity: "error" | "warning" }[]>;

    // File system operations
    showSaveDialog: (options: {
      title?: string;
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
    }) => Promise<DialogResult>;

    showOpenDialog: (options: {
      title?: string;
      filters?: { name: string; extensions: string[] }[];
      properties?: ("openFile" | "openDirectory" | "multiSelections")[];
    }) => Promise<DialogResult>;

    saveFile: (filePath: string, content: string) => Promise<SaveResult>;
    readFile: (filePath: string) => Promise<FileResult>;
    readFolder: (folderPath: string) => Promise<FolderResult>;
    
    // WASM path helpers
    getClangFormatWasmPath: () => Promise<string>;
    
    // Auto-update
    checkForUpdates: () => Promise<UpdateInfo>;
    downloadAndInstallUpdate: (downloadUrl: string, version: string) => Promise<{ success: boolean; error?: string }>;
    onUpdateProgress: (callback: (data: { status: string; progress?: number }) => void) => void;
  };
}

interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion?: string;
  latestVersion?: string;
  releaseUrl?: string;
  downloadUrl?: string;
  releaseNotes?: string;
  releaseName?: string;
  error?: string;
}
