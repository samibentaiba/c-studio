import React, { useState, useRef, useEffect } from "react";

interface MenuItem {
  label?: string;
  action?: () => void;
  divider?: boolean;
  shortcut?: string;
}

interface MenuProps {
  label: string;
  items: MenuItem[];
}

function DropdownMenu({ label, items }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <div
        className={`px-2 py-1 text-xs text-[#cccccc] hover:bg-[#37373d] rounded cursor-pointer transition-colors ${
          isOpen ? "bg-[#37373d]" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-[#252526] border border-[#3c3c3c] rounded-md shadow-lg min-w-[200px] py-1 z-50">
          {items.map((item, index) =>
            item.divider ? (
              <div key={index} className="border-t border-[#3c3c3c] my-1" />
            ) : (
              <div
                key={index}
                className="px-3 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771] cursor-pointer flex justify-between items-center"
                onClick={() => {
                  item.action?.();
                  setIsOpen(false);
                }}
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="text-[#808080] text-[10px] ml-4">
                    {item.shortcut}
                  </span>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

interface TitleBarProps {
  onNewFile?: () => void;
  onOpenFile?: () => void;
  onOpenFolder?: () => void;
  onSaveFile?: () => void;
  onExportWorkspace?: () => void;
  onImportWorkspace?: () => void;
}

export function TitleBar({
  onNewFile,
  onOpenFile,
  onOpenFolder,
  onSaveFile,
  onExportWorkspace,
  onImportWorkspace,
}: TitleBarProps) {
  const fileMenuItems: MenuItem[] = [
    { label: "New File", action: onNewFile, shortcut: "Ctrl+N" },
    { divider: true },
    { label: "Open File...", action: onOpenFile, shortcut: "Ctrl+O" },
    { label: "Open Folder...", action: onOpenFolder },
    { divider: true },
    { label: "Save", action: onSaveFile, shortcut: "Ctrl+S" },
    { divider: true },
    { label: "Export Workspace...", action: onExportWorkspace },
    { label: "Import Workspace...", action: onImportWorkspace },
  ];

  const editMenuItems: MenuItem[] = [
    { label: "Undo", shortcut: "Ctrl+Z" },
    { label: "Redo", shortcut: "Ctrl+Y" },
    { divider: true },
    { label: "Cut", shortcut: "Ctrl+X" },
    { label: "Copy", shortcut: "Ctrl+C" },
    { label: "Paste", shortcut: "Ctrl+V" },
  ];

  const viewMenuItems: MenuItem[] = [
    { label: "Toggle Terminal" },
    { label: "Toggle Sidebar" },
  ];

  const helpMenuItems: MenuItem[] = [
    { label: "About C-Studio" },
    { label: "Documentation" },
  ];

  return (
    <div className="h-8 bg-[#1e1e1e] flex items-center px-2 select-none border-b border-white/10 w-full draggable">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">C</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <DropdownMenu label="File" items={fileMenuItems} />
        <DropdownMenu label="Edit" items={editMenuItems} />
        <DropdownMenu label="View" items={viewMenuItems} />
        <DropdownMenu label="Help" items={helpMenuItems} />
      </div>
      <div className="flex-1 text-center text-xs text-[#999999] font-medium">
        C-Studio - v1.4.0
      </div>
      <div className="w-24" /> {/* Spacer for window controls */}
    </div>
  );
}
