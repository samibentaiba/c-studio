import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useTheme } from "../ThemeContext";

interface XtermTerminalProps {
  onData?: (data: string) => void;
}

export function XtermTerminal({ onData }: XtermTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const xterm = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace",
      theme: {
        background: theme.terminal?.background || "#1e1e1e",
        foreground: theme.terminal?.foreground || "#d4d4d4",
        cursor: theme.ui.accent,
        cursorAccent: theme.ui.background,
        selectionBackground: theme.ui.accent + "40",
      },
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Welcome message
    xterm.writeln("\x1b[1;34m╔════════════════════════════════════════════════════════╗\x1b[0m");
    xterm.writeln("\x1b[1;34m║\x1b[0m  \x1b[1;32mC-Studio Terminal\x1b[0m                                      \x1b[1;34m║\x1b[0m");
    xterm.writeln("\x1b[1;34m║\x1b[0m  Type commands to interact with the shell               \x1b[1;34m║\x1b[0m");
    xterm.writeln("\x1b[1;34m╚════════════════════════════════════════════════════════╝\x1b[0m");
    xterm.writeln("");

    // Set up shell via IPC
    let currentLine = "";
    const cwd = process.cwd?.() || "C:\\";
    
    const writePrompt = () => {
      xterm.write(`\x1b[1;32mPS\x1b[0m \x1b[1;34m${cwd}>\x1b[0m `);
    };
    
    writePrompt();

    xterm.onData((data) => {
      // Handle special keys
      if (data === "\r") {
        // Enter key - execute command
        xterm.writeln("");
        if (currentLine.trim()) {
          // Execute via IPC
          (window.electron as any)?.executeShellCommand?.(currentLine).then((result: { stdout: string; stderr: string; code: number }) => {
            if (result.stdout) xterm.write(result.stdout.replace(/\n/g, "\r\n"));
            if (result.stderr) xterm.write(`\x1b[31m${result.stderr.replace(/\n/g, "\r\n")}\x1b[0m`);
            writePrompt();
          }).catch((err: Error) => {
            xterm.writeln(`\x1b[31mError: ${err.message}\x1b[0m`);
            writePrompt();
          });
        } else {
          writePrompt();
        }
        currentLine = "";
      } else if (data === "\x7f" || data === "\b") {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          xterm.write("\b \b");
        }
      } else if (data === "\x03") {
        // Ctrl+C
        xterm.writeln("^C");
        currentLine = "";
        writePrompt();
      } else if (data.charCodeAt(0) >= 32) {
        // Regular character
        currentLine += data;
        xterm.write(data);
      }
    });

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      xterm.dispose();
      xtermRef.current = null;
    };
  }, []);

  // Update theme
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = {
        background: theme.terminal?.background || "#1e1e1e",
        foreground: theme.terminal?.foreground || "#d4d4d4",
        cursor: theme.ui.accent,
        cursorAccent: theme.ui.background,
        selectionBackground: theme.ui.accent + "40",
      };
    }
  }, [theme]);

  // Fit on container resize
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    });

    if (terminalRef.current) {
      observer.observe(terminalRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full"
      style={{ backgroundColor: theme.terminal?.background || "#1e1e1e" }}
    />
  );
}
