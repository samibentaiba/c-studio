/// <reference types="vite/client" />

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

interface Window {
  electron: {
    compileProject: (files: unknown, activeFileId?: string) => Promise<{ success: boolean; exePath?: string; cwd?: string; error?: string }>;
    runProject: (exePath: string, cwd: string) => void;
    writeStdin: (data: string) => void;
    killProcess: () => void;
    onProcessOutput: (callback: (data: string) => void) => void;
    onProcessExit: (callback: (code: number) => void) => void;
    checkSyntax: (files: unknown) => Promise<{ file: string; line: number; column: number; message: string; severity: "error" | "warning" }[]>;
  };
}
