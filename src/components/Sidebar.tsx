import React, { useState } from "react";
import {
  FileCode,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Trash2,
  FilePlus,
  FolderPlus,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { FileSystemItem } from "../types";
import { cn } from "../lib/utils";

interface SidebarProps {
  files: FileSystemItem[];
  activeFileId: string | null;
  onFileSelect: (file: FileSystemItem) => void;
  onFileCreate: (name: string, type: "file" | "folder", parentId?: string) => void;
  onDelete: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onMoveFile: (sourceId: string, targetId: string | null) => void;
  onGenerateTest: (type: "multi-main" | "nested" | "assets" | "complex-nested" | "multi-input" | "pointers") => void;
}

export function Sidebar({
  files,
  activeFileId,
  onFileSelect,
  onFileCreate,
  onDelete,
  onToggleFolder,
  onMoveFile,
  onGenerateTest,
}: SidebarProps) {
  const [creatingState, setCreatingState] = useState<{
    type: "file" | "folder";
    parentId?: string;
  } | null>(null);
  const [newItemName, setNewItemName] = useState("");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !creatingState) return;
    onFileCreate(newItemName, creatingState.type, creatingState.parentId);
    setNewItemName("");
    setCreatingState(null);
  };

  const renderTree = (items: FileSystemItem[], depth = 0) => {
    return items.map((item) => (
      <div key={item.id}>
        <div
          className={cn(
            "flex items-center justify-between px-2 py-1 group cursor-pointer select-none transition-colors",
            // Default state (inactive): Light gray text, dark hover bg
            "text-[#CCCCCC] hover:bg-[#2A2D2E] hover:text-white",
            // Active state: Darker gray bg, white text
            activeFileId === item.id && "bg-[#37373D] text-white",
            depth > 0 && "ml-4" // Simple indentation
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", item.id);
            e.stopPropagation();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (item.type === "folder") {
              e.currentTarget.classList.add("bg-[#37373D]");
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove("bg-[#37373D]");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove("bg-[#37373D]");
            const sourceId = e.dataTransfer.getData("text/plain");
            if (item.type === "folder") {
              onMoveFile(sourceId, item.id);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (item.type === "folder") {
              onToggleFolder(item.id);
            } else {
              onFileSelect(item);
            }
          }}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            {item.type === "folder" ? (
              <>
                {item.isOpen ? (
                  <ChevronDown size={14} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={14} className="text-muted-foreground" />
                )}
                {item.isOpen ? (
                  <FolderOpen size={16} className="text-blue-400" />
                ) : (
                  <Folder size={16} className="text-blue-400" />
                )}
              </>
            ) : (
              <FileCode size={16} className="text-current opacity-70 group-hover:opacity-100" />
            )}
            <span className="text-sm truncate">{item.name}</span>
          </div>
          
          <div className="flex items-center opacity-0 group-hover:opacity-100">
            {item.type === "folder" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingState({ type: "file", parentId: item.id });
                    if (!item.isOpen) onToggleFolder(item.id);
                  }}
                >
                  <FilePlus size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingState({ type: "folder", parentId: item.id });
                    if (!item.isOpen) onToggleFolder(item.id);
                  }}
                >
                  <FolderPlus size={12} />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>

        {/* Render Children */}
        {item.type === "folder" && item.isOpen && item.children && (
          <div>
            {renderTree(item.children, depth + 1)}
            {/* Input for creating new item inside this folder */}
            {creatingState?.parentId === item.id && (
              <form
                onSubmit={handleCreateSubmit}
                className="pr-2 py-1"
                style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
              >
                <div className="flex items-center gap-2">
                  {creatingState.type === "folder" ? (
                    <Folder size={16} className="text-blue-400" />
                  ) : (
                    <FileCode size={16} className="text-slate-400" />
                  )}
                  <Input
                    autoFocus
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onBlur={() => setCreatingState(null)}
                    className="h-6 text-xs py-0"
                    placeholder="Name..."
                  />
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: 'var(--theme-bg)',
        borderRight: '1px solid var(--theme-border)',
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData("text/plain");
        onMoveFile(sourceId, null);
      }}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2 text-primary">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          C-Studio
        </h1>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCreatingState({ type: "file" })}
            title="New File"
          >
            <FilePlus size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCreatingState({ type: "folder" })}
            title="New Folder"
          >
            <FolderPlus size={16} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 py-2">
        {/* Root Level Input */}
        {creatingState && !creatingState.parentId && (
          <form onSubmit={handleCreateSubmit} className="px-2 mb-2">
            <div className="flex items-center gap-2">
              {creatingState.type === "folder" ? (
                <Folder size={16} className="text-blue-400" />
              ) : (
                <FileCode size={16} className="text-slate-400" />
              )}
              <Input
                autoFocus
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onBlur={() => setCreatingState(null)}
                className="h-6 text-xs py-0"
                placeholder="Name..."
              />
            </div>
          </form>
        )}
        {renderTree(files)}
      </ScrollArea>
      <div className="p-4 border-t border-white/10">
        <h3 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Test Scenarios</h3>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-7 bg-[#2A2D2E] border-white/5 hover:bg-[#37373D] hover:text-white text-[#CCCCCC]"
            onClick={() => onGenerateTest("multi-main")}
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
            Multi-Main
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-7 bg-[#2A2D2E] border-white/5 hover:bg-[#37373D] hover:text-white text-[#CCCCCC]"
            onClick={() => onGenerateTest("nested")}
          >
            <div className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
            Nested Project
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-7 bg-[#2A2D2E] border-white/5 hover:bg-[#37373D] hover:text-white text-[#CCCCCC]"
            onClick={() => onGenerateTest("assets")}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            Assets / I/O
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-7 bg-[#2A2D2E] border-white/5 hover:bg-[#37373D] hover:text-white text-[#CCCCCC]"
            onClick={() => onGenerateTest("complex-nested")}
          >
            <div className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
            Complex Nested
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-7 bg-[#2A2D2E] border-white/5 hover:bg-[#37373D] hover:text-white text-[#CCCCCC]"
            onClick={() => onGenerateTest("multi-input")}
          >
            <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2" />
            Multi-Input
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-7 bg-[#2A2D2E] border-white/5 hover:bg-[#37373D] hover:text-white text-[#CCCCCC]"
            onClick={() => onGenerateTest("pointers")}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
            Pointers & Libraries
          </Button>
        </div>
      </div>
    </div>
  );
}
