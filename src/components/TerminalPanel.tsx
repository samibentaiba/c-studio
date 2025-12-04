import React, { useEffect, useRef } from "react";
import { Terminal, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { LogMessage } from "../types";
import { cn } from "../lib/utils";

interface TerminalPanelProps {
  logs: LogMessage[];
  onClear: () => void;
}

export function TerminalPanel({ logs, onClear }: TerminalPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-t border-white/10">
      <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-[#2d2d2d]">
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          <Terminal size={16} /> Output
        </span>
        <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8">
          <Trash2 size={16} className="text-muted-foreground hover:text-foreground" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4 font-mono text-sm">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 text-slate-300 mb-1">
            <span className="text-slate-600 text-xs pt-1">{log.timestamp}</span>
            <span
              className={cn(
                log.type === "error"
                  ? "text-red-400"
                  : log.type === "success"
                    ? "text-green-400"
                    : "text-slate-300"
              )}
            >
              {log.content}
            </span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </ScrollArea>
    </div>
  );
}
