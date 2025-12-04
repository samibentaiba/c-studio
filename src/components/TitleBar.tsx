import React from "react";
import { Menu } from "lucide-react";

export function TitleBar() {
  return (
    <div className="h-8 bg-[#1e1e1e] flex items-center px-2 select-none border-b border-white/10 w-full draggable">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">C</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {["File", "Edit", "View", "Go", "Run", "Terminal", "Help"].map((item) => (
          <div
            key={item}
            className="px-2 py-1 text-xs text-[#cccccc] hover:bg-[#37373d] rounded cursor-pointer transition-colors"
          >
            {item}
          </div>
        ))}
      </div>
      <div className="flex-1 text-center text-xs text-[#999999] font-medium">
        C-Studio - v2.0
      </div>
      <div className="w-24" /> {/* Spacer for window controls */}
    </div>
  );
}
