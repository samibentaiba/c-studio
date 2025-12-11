import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export function XtermTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!terminalRef.current || xtermRef.current) return;

      const container = terminalRef.current;
      if (container.clientWidth === 0 || container.clientHeight === 0) return;

      const xterm = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "Consolas, 'Courier New', monospace",
        theme: {
          background: "#1e1e1e",
          foreground: "#cccccc",
          cursor: "#ffffff",
          cursorAccent: "#1e1e1e",
          selectionBackground: "#264f78",
        },
      });

      const fitAddon = new FitAddon();
      xterm.loadAddon(fitAddon);
      xterm.open(container);
      
      setTimeout(() => {
        try { fitAddon.fit(); } catch (e) {}
      }, 50);

      xtermRef.current = xterm;
      fitAddonRef.current = fitAddon;
      setIsReady(true);

      // Simple PowerShell prompt
      let currentLine = "";
      
      const writePrompt = () => {
        xterm.write("PS> ");
      };
      
      writePrompt();

      xterm.onData((data) => {
        if (data === "\r") {
          xterm.writeln("");
          if (currentLine.trim()) {
            (window.electron as any)?.executeShellCommand?.(currentLine)
              .then((result: { stdout: string; stderr: string; code: number }) => {
                if (result.stdout) {
                  result.stdout.split("\n").forEach((line: string) => {
                    xterm.writeln(line);
                  });
                }
                if (result.stderr) {
                  result.stderr.split("\n").forEach((line: string) => {
                    xterm.writeln(line);
                  });
                }
                writePrompt();
              })
              .catch((err: Error) => {
                xterm.writeln(`Error: ${err.message}`);
                writePrompt();
              });
          } else {
            writePrompt();
          }
          currentLine = "";
        } else if (data === "\x7f" || data === "\b") {
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            xterm.write("\b \b");
          }
        } else if (data === "\x03") {
          xterm.writeln("^C");
          currentLine = "";
          writePrompt();
        } else if (data.charCodeAt(0) >= 32) {
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

  useEffect(() => {
    if (!isReady) return;

    const handleResize = () => {
      try { fitAddonRef.current?.fit(); } catch (e) {}
    };

    window.addEventListener("resize", handleResize);
    const observer = new ResizeObserver(handleResize);
    if (terminalRef.current) observer.observe(terminalRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [isReady]);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full"
      style={{ backgroundColor: "#1e1e1e", padding: "4px" }}
    />
  );
}
