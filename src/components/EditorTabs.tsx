import React, { useState } from "react";
import { X, FileCode, SplitSquareHorizontal } from "lucide-react";
import { FileSystemItem } from "../types";
import { useTheme } from "../ThemeContext";

interface EditorTabsProps {
  openTabs: string[];
  activeFileId: string | null;
  files: FileSystemItem[];
  onTabClick: (fileId: string) => void;
  onTabClose: (fileId: string) => void;
  onSplitRight?: (fileId: string) => void;
}

export function EditorTabs({
  openTabs,
  activeFileId,
  files,
  onTabClick,
  onTabClose,
  onSplitRight,
}: EditorTabsProps) {
  const { theme } = useTheme();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);

  // Find file by ID recursively
  const findFile = (items: FileSystemItem[], id: string): FileSystemItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findFile(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  if (openTabs.length === 0) return null;

  return (
    <div
      className="flex items-center overflow-x-auto relative"
      style={{
        backgroundColor: theme.ui.backgroundDark,
        borderBottom: `1px solid ${theme.ui.border}`,
      }}
    >
      {openTabs.map((tabId) => {
        const file = findFile(files, tabId);
        if (!file) return null;

        const isActive = tabId === activeFileId;

        return (
          <div
            key={tabId}
            className="flex items-center gap-1 px-3 py-2 cursor-pointer select-none group min-w-0"
            style={{
              backgroundColor: isActive ? theme.ui.background : "transparent",
              borderRight: `1px solid ${theme.ui.border}`,
              borderBottom: isActive ? `2px solid ${theme.ui.accent}` : "2px solid transparent",
            }}
            onClick={() => onTabClick(tabId)}
            onMouseDown={(e) => {
              // Middle click to close
              if (e.button === 1) {
                e.preventDefault();
                onTabClose(tabId);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (onSplitRight) {
                setContextMenu({ x: e.clientX, y: e.clientY, tabId });
              }
            }}
          >
            <FileCode
              size={14}
              style={{ color: isActive ? theme.ui.accent : theme.ui.foregroundMuted }}
              className="flex-shrink-0"
            />
            <span
              className="text-xs truncate max-w-[120px]"
              style={{ color: isActive ? theme.ui.foreground : theme.ui.foregroundMuted }}
            >
              {file.name}
            </span>
            <button
              className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity"
              style={{ color: theme.ui.foregroundMuted }}
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tabId);
              }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      {/* Context Menu */}
      {contextMenu && onSplitRight && (
        <div
          className="fixed z-50 py-1 rounded-md shadow-lg min-w-[140px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: theme.ui.background,
            border: `1px solid ${theme.ui.border}`,
          }}
        >
          <button
            className="w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 hover:bg-white/10"
            style={{ color: theme.ui.foreground }}
            onClick={() => {
              onSplitRight(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            <SplitSquareHorizontal size={14} />
            Split Right
          </button>
        </div>
      )}
    </div>
  );
}
