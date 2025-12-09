import { useState } from "react";

interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion?: string;
  latestVersion?: string;
  releaseUrl?: string;
  downloadUrl?: string;
  releaseNotes?: string;
  releaseName?: string;
}

interface UpdateNotificationProps {
  updateInfo: UpdateInfo;
  onDismiss: () => void;
}

export function UpdateNotification({ updateInfo, onDismiss }: UpdateNotificationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!updateInfo.hasUpdate) return null;

  const handleDownload = () => {
    // Open the download URL in the default browser
    if (updateInfo.downloadUrl) {
      window.open(updateInfo.downloadUrl, "_blank");
    } else if (updateInfo.releaseUrl) {
      window.open(updateInfo.releaseUrl, "_blank");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e1e] border-b border-[#3c3c3c]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-white">Update Available</span>
          </div>
          <button
            onClick={onDismiss}
            className="text-[#999999] hover:text-white transition-colors p-1"
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#999999] text-sm">
              v{updateInfo.currentVersion}
            </span>
            <span className="text-[#999999]">→</span>
            <span className="text-green-400 font-medium text-sm">
              v{updateInfo.latestVersion}
            </span>
          </div>

          {/* Release name */}
          {updateInfo.releaseName && (
            <h3 className="text-white font-medium mb-2">
              {updateInfo.releaseName}
            </h3>
          )}

          {/* Expandable release notes */}
          {updateInfo.releaseNotes && (
            <div className="mb-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-[#007acc] hover:text-[#1a9fff] flex items-center gap-1"
              >
                {isExpanded ? "Hide" : "Show"} release notes
                <svg
                  className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isExpanded && (
                <div className="mt-2 p-2 bg-[#1e1e1e] rounded text-xs text-[#cccccc] max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">
                    {updateInfo.releaseNotes}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 bg-[#007acc] hover:bg-[#1a9fff] text-white text-sm font-medium py-2 px-4 rounded transition-colors"
            >
              Download Update
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-sm text-[#999999] hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
