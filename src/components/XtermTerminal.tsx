import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useTheme } from "../ThemeContext";

export function XtermTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { theme } = useTheme();

  // Initialize terminal when container is ready
  useEffect(() => {
    // Wait a frame to ensure container has dimensions
    const timer = setTimeout(() => {
      if (!terminalRef.current || xtermRef.current) return;

      const container = terminalRef.current;
      
      // Ensure container has dimensions
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        console.log("Container has no dimensions, retrying...");
        return;
      }

      const xterm = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace",
        theme: {
          background: "#1e1e2e",
          foreground: "#cdd6f4",
          cursor: "#f5e0dc",
          cursorAccent: "#1e1e2e",
          selectionBackground: "#585b7066",
          black: "#45475a",
          red: "#f38ba8",
          green: "#a6e3a1",
          yellow: "#f9e2af",
          blue: "#89b4fa",
          magenta: "#f5c2e7",
          cyan: "#94e2d5",
          white: "#bac2de",
          brightBlack: "#585b70",
          brightRed: "#f38ba8",
          brightGreen: "#a6e3a1",
          brightYellow: "#f9e2af",
          brightBlue: "#89b4fa",
          brightMagenta: "#f5c2e7",
          brightCyan: "#94e2d5",
          brightWhite: "#a6adc8",
        },
      });

      const fitAddon = new FitAddon();
      xterm.loadAddon(fitAddon);

      xterm.open(container);
      
      // Fit after opening
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          console.log("Fit error:", e);
        }
      }, 100);

      xtermRef.current = xterm;
      fitAddonRef.current = fitAddon;
      setIsReady(true);

      // Welcome message
      xterm.writeln("\x1b[1;34m╔════════════════════════════════════════════════════════════╗\x1b[0m");
      xterm.writeln("\x1b[1;34m║\x1b[0m  \x1b[1;32mC-Studio Terminal\x1b[0m - Interactive PowerShell              \x1b[1;34m║\x1b[0m");
      xterm.writeln("\x1b[1;34m║\x1b[0m  Type commands to interact with the shell                  \x1b[1;34m║\x1b[0m");
      xterm.writeln("\x1b[1;34m║\x1b[0m  Example: \x1b[1;33mgcc --version\x1b[0m, \x1b[1;33mdir\x1b[0m, \x1b[1;33mecho Hello\x1b[0m                   \x1b[1;34m║\x1b[0m");
      xterm.writeln("\x1b[1;34m╚════════════════════════════════════════════════════════════╝\x1b[0m");
      xterm.writeln("");

      // Shell prompt
      let currentLine = "";
      
      const writePrompt = () => {
        xterm.write("\x1b[1;32mPS>\x1b[0m ");
      };
      
      writePrompt();

      xterm.onData((data) => {
        if (data === "\r") {
          // Enter key
          xterm.writeln("");
          if (currentLine.trim()) {
            xterm.writeln(`\x1b[90mExecuting: ${currentLine}\x1b[0m`);
            // Execute via IPC
            (window.electron as any)?.executeShellCommand?.(currentLine)
              .then((result: { stdout: string; stderr: string; code: number }) => {
                if (result.stdout) {
                  const lines = result.stdout.split("\n");
                  lines.forEach((line: string) => {
                    if (line.trim()) xterm.writeln(line);
                  });
                }
                if (result.stderr) {
                  const lines = result.stderr.split("\n");
                  lines.forEach((line: string) => {
                    if (line.trim()) xterm.writeln(`\x1b[31m${line}\x1b[0m`);
                  });
                }
                writePrompt();
              })
              .catch((err: Error) => {
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
    }, 50);

    return () => {
      clearTimeout(timer);
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, []);

  // Handle resize
  useEffect(() => {
    if (!isReady) return;

    const handleResize = () => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (e) {
          // Ignore fit errors
        }
      }
    };

    window.addEventListener("resize", handleResize);

    const observer = new ResizeObserver(handleResize);
    if (terminalRef.current) {
      observer.observe(terminalRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [isReady]);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full"
      style={{ 
        backgroundColor: "#1e1e2e",
        padding: "8px",
        minHeight: "200px",
      }}
    />
  );
}
