/// <reference types="vite/client" />

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

interface Window {
  electron: {
    compileProject: (files: unknown, activeFileId?: string) => Promise<{ success: boolean; output: string; error?: string }>;
    checkSyntax: (files: unknown) => Promise<{ file: string; line: number; column: number; message: string; severity: "error" | "warning" }[]>;
  };
}
