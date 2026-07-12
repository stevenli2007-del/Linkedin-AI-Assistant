import { useState, useEffect } from "react";
import type { HistoryEntry } from "@/types";
import { loadHistory, clearHistory } from "@/services/settings";

const STYLE_LABELS: Record<string, string> = {
  professional: "Professional",
  friendly: "Friendly",
  entrepreneur: "Entrepreneur",
  academic: "Academic",
};

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date}, ${time}`;
}

function exportToCSV(entries: HistoryEntry[]): void {
  const headers = [
    "Date",
    "Target Name",
    "Target Headline",
    "Target Company",
    "Style",
    "Common Point",
    "Message",
  ];

  const escapeCSV = (val: string): string => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = entries.map((e) =>
    [
      formatDate(e.timestamp),
      e.targetName,
      e.targetHeadline,
      e.targetCompany,
      STYLE_LABELS[e.messageStyle] ?? e.messageStyle,
      e.commonPoint,
      e.messageContent,
    ]
      .map(escapeCSV)
      .join(",")
  );

  // UTF-8 BOM for Excel compatibility
  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);
  const filename = `linkedin-ai-history-${today}.csv`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface HistoryProps {
  onBack: () => void;
}

export function History({ onBack }: HistoryProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    loadHistory()
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleClearAll = async () => {
    await clearHistory();
    setEntries([]);
    setConfirmClear(false);
  };

  return (
    <div className="w-[360px] min-h-[400px] bg-white p-5 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-gray-900">History</h1>
          {!loading && entries.length > 0 && (
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {entries.length}
            </span>
          )}
        </div>
        <button
          onClick={onBack}
          className="text-xs text-gray-500 hover:text-gray-900 font-medium"
        >
          Back
        </button>
      </div>

      {/* Actions */}
      {!loading && entries.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => exportToCSV(entries)}
            className="flex-1 py-2 rounded-apple bg-brand-600 text-white text-xs font-medium
                       hover:bg-brand-700 active:scale-[0.98] transition-all"
          >
            Export to CSV
          </button>
          <button
            onClick={() => setConfirmClear(true)}
            className="px-3 py-2 rounded-apple border border-red-300 text-red-600 text-xs font-medium
                       hover:bg-red-50 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Clear confirmation */}
      {confirmClear && (
        <div className="mb-4 p-3 rounded-apple bg-red-50 border border-red-200">
          <p className="text-xs text-red-700 mb-2">
            Are you sure? This permanently deletes all {entries.length} records.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmClear(false)}
              className="flex-1 py-1.5 rounded-apple border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 py-1.5 rounded-apple bg-red-600 text-white text-xs font-medium hover:bg-red-700"
            >
              Delete All
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <span className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="mt-8 text-center text-gray-400">
          <p className="text-sm font-medium text-gray-500 mb-1">No history yet</p>
          <p className="text-xs leading-relaxed">
            When you copy a generated message, it will appear here.
            <br />
            Enable this feature in Settings.
          </p>
        </div>
      )}

      {/* History list */}
      {!loading && entries.length > 0 && (
        <div className="space-y-2.5">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-apple border border-gray-200 bg-white hover:border-brand-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400">
                  {formatDate(entry.timestamp)}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wide text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">
                  {STYLE_LABELS[entry.messageStyle] ?? entry.messageStyle}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {entry.targetName}
              </p>
              {entry.targetHeadline && (
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {entry.targetHeadline}
                </p>
              )}
              {entry.commonPoint && (
                <p className="text-[10px] text-brand-600 mt-1.5">
                  Common: {entry.commonPoint}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                {entry.messageContent}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
