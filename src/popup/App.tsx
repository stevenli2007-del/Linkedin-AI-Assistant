import { useState, useEffect, useCallback, useRef } from "react";
import type { TargetProfile, GeneratedMessage, MessageStyle, HistoryEntry } from "@/types";
import { buildPrompt, buildSingleStylePrompt, buildFindCommonPrompt } from "@/services/prompt";
import { generateMessages, regenerateMessage, findCommonPoints } from "@/services/llm";
import { loadSettings, saveSettings, saveHistoryEntry, DEFAULT_SETTINGS, type AppSettings } from "@/services/settings";
import { Settings } from "./Settings";
import { History } from "./History";

const STYLE_LABELS: Record<MessageStyle, string> = {
  professional: "Professional",
  friendly: "Friendly",
  entrepreneur: "Entrepreneur",
  academic: "Academic",
};

const STYLE_ORDER: MessageStyle[] = [
  "professional",
  "friendly",
  "entrepreneur",
  "academic",
];

function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [regeneratingStyles, setRegeneratingStyles] = useState<Set<MessageStyle>>(new Set());
  const [targetProfile, setTargetProfile] = useState<TargetProfile | null>(null);
  const [messages, setMessages] = useState<GeneratedMessage[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<GeneratedMessage | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Find Common feature state
  const [commonPoints, setCommonPoints] = useState<string[]>([]);
  const [selectedCommonPoint, setSelectedCommonPoint] = useState<string | null>(null);
  const [isFindingCommon, setIsFindingCommon] = useState(false);

  // Load settings from Chrome storage on mount
  useEffect(() => {
    let cancelled = false;

    loadSettings()
      .then((loaded) => {
        if (!cancelled) {
          setSettings(loaded);
          setSettingsLoaded(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          // Load failed — log and use defaults, but show toast so user knows
          console.error("Failed to load settings:", err);
          setSettings(DEFAULT_SETTINGS);
          setSettingsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-focus textarea when edit modal opens
  useEffect(() => {
    if (editingMessage && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.setSelectionRange(
        editTextareaRef.current.value.length,
        editTextareaRef.current.value.length
      );
    }
  }, [editingMessage]);

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2000);
  }, []);

  const handleSaveSettings = async (next: AppSettings) => {
    await saveSettings(next);
    setSettings(next);
    setShowSettings(false);
    showToast("Settings saved");
  };

  const handleGenerate = async () => {
    // Phase 09: In shared mode, no API key needed
    if (settings.apiMode === "custom" && !settings.apiKey.trim()) {
      setError("Please enter your DeepSeek API Key in Settings first (Custom Mode).");
      return;
    }
    if (!settings.userProfile.userName.trim()) {
      setError("Please fill in your name in Settings first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessages([]);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) throw new Error("Cannot access current tab");

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "EXTRACT_PROFILE",
      });

      if (!response?.success) {
        throw new Error(response?.error || "Failed to extract profile");
      }

      const profile = response.data as TargetProfile;
      setTargetProfile(profile);

      const prompt = buildPrompt(settings.userProfile, profile, settings.maxMessageLength, selectedCommonPoint ?? undefined);
      const generated = await generateMessages(
        settings.apiMode,
        settings.apiMode === "custom" ? settings.apiKey.trim() : null,
        prompt,
        {
          model: settings.model,
          temperature: settings.temperature,
          maxMessageLength: settings.maxMessageLength,
        }
      );
      setMessages(generated);
    } catch (err) {
      let message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Make sure you're on a LinkedIn profile page.";

      if (message.includes("Receiving end does not exist")) {
        message =
          "Extension was updated. Please refresh the LinkedIn page and try again.";
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindCommon = async () => {
    if (!settings.userProfile.userName.trim()) {
      setError("Please fill in your name in Settings first.");
      return;
    }

    setIsFindingCommon(true);
    setError("");
    setCommonPoints([]);
    setSelectedCommonPoint(null);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) throw new Error("Cannot access current tab");

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "EXTRACT_PROFILE",
      });

      if (!response?.success) {
        throw new Error(response?.error || "Failed to extract profile");
      }

      const profile = response.data as TargetProfile;

      const prompt = buildFindCommonPrompt(settings.userProfile, profile);
      const points = await findCommonPoints(
        settings.apiMode,
        settings.apiMode === "custom" ? settings.apiKey.trim() : null,
        prompt,
        {
          temperature: 0.5,
          maxTokens: 512,
        }
      );

      setCommonPoints(points);
      setTargetProfile(profile);
    } catch (err) {
      let message =
        err instanceof Error
          ? err.message
          : "Failed to find common points. Make sure you're on a LinkedIn profile page.";

      if (message.includes("Receiving end does not exist")) {
        message =
          "Extension was updated. Please refresh the LinkedIn page and try again.";
      }

      setError(message);
    } finally {
      setIsFindingCommon(false);
    }
  };

  const handleCopy = async (msg: GeneratedMessage) => {
    try {
      await navigator.clipboard.writeText(msg.messageContent);
      showToast("Copied to clipboard");

      // Save to history if enabled
      if (settings.historyEnabled && targetProfile) {
        const entry: HistoryEntry = {
          id: `${Date.now()}-${msg.messageStyle}`,
          timestamp: Date.now(),
          targetName: targetProfile.targetName,
          targetHeadline: targetProfile.targetHeadline,
          targetCompany: targetProfile.targetCompany,
          messageStyle: msg.messageStyle,
          messageContent: msg.messageContent,
          commonPoint: selectedCommonPoint ?? "",
        };
        saveHistoryEntry(entry).catch(() => {});
      }
    } catch {
      showToast("Copy failed");
    }
  };

  const handleEditStart = (msg: GeneratedMessage) => {
    setEditingMessage(msg);
    setEditDraft(msg.messageContent);
  };

  const handleEditCancel = () => {
    setEditingMessage(null);
    setEditDraft("");
  };

  const handleEditSave = () => {
    if (!editingMessage) return;

    const trimmed = editDraft.trim();
    if (!trimmed) {
      setError("Message cannot be empty.");
      return;
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.messageId === editingMessage.messageId
          ? { ...msg, messageContent: trimmed }
          : msg
      )
    );
    setEditingMessage(null);
    setEditDraft("");
    setError("");
    showToast("Changes saved");
  };

  const handleRegenerate = async (style: MessageStyle) => {
    // Phase 09: In shared mode, no API key needed
    if (settings.apiMode === "custom" && !settings.apiKey.trim()) {
      setError("Please enter your DeepSeek API Key in Settings first (Custom Mode).");
      return;
    }
    if (!targetProfile) {
      setError("No profile found. Please generate messages first.");
      return;
    }

    setRegeneratingStyles((prev) => new Set(prev).add(style));
    setError("");

    try {
      const prompt = buildSingleStylePrompt(
        settings.userProfile,
        targetProfile,
        style,
        settings.maxMessageLength,
      );
      const regenerated = await regenerateMessage(
        settings.apiMode,
        settings.apiMode === "custom" ? settings.apiKey.trim() : null,
        prompt,
        style,
        {
          model: settings.model,
          temperature: settings.temperature,
          maxMessageLength: settings.maxMessageLength,
        }
      );

      setMessages((prev) => {
        const existingIndex = prev.findIndex((msg) => msg.messageStyle === style);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = regenerated;
          return next;
        }
        return [...prev, regenerated];
      });

      showToast(`${STYLE_LABELS[style]} regenerated`);
    } catch (err) {
      let message =
        err instanceof Error
          ? err.message
          : `Failed to regenerate ${STYLE_LABELS[style]} message.`;

      if (message.includes("Receiving end does not exist")) {
        message =
          "Extension was updated. Please refresh the LinkedIn page and try again.";
      }

      setError(message);
    } finally {
      setRegeneratingStyles((prev) => {
        const next = new Set(prev);
        next.delete(style);
        return next;
      });
    }
  };

  const orderedMessages = STYLE_ORDER.map(
    (style) => messages.find((msg) => msg.messageStyle === style)
  ).filter(Boolean) as GeneratedMessage[];

  if (showSettings) {
    return (
      <Settings
        settings={settings}
        onSave={handleSaveSettings}
        onCancel={() => setShowSettings(false)}
      />
    );
  }

  if (showHistory) {
    return <History onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="w-[360px] min-h-[400px] bg-white p-5 font-sans relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-semibold text-sm">
            L
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900 leading-tight">
              LinkedIn AI Assistant
            </h1>
            <p className="text-xs text-gray-500">Smart connection messages</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(true)}
            className="text-[11px] text-gray-500 hover:text-brand-600 font-medium"
            title="History"
          >
            History
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="text-[11px] text-gray-500 hover:text-brand-600 font-medium"
            title="Settings"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Onboarding Guide — shown until profile name is set and (shared mode or custom mode with API key) */}
      {!settingsLoaded ? (
        <div className="mb-4 p-3 rounded-apple bg-gray-50 text-xs text-gray-500">
          Loading settings...
        </div>
      ) : (!settings.userProfile.userName.trim() || (settings.apiMode === "custom" && !settings.apiKey.trim())) ? (
        <div className="mb-4 p-4 rounded-apple bg-gray-50 border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-900 mb-3">Get Started in 3 Steps</h3>
          <ol className="space-y-2.5">
            <li className="flex items-start gap-2">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5 shrink-0 ${(settings.apiMode === "shared" || settings.apiKey.trim()) ? "bg-green-500 text-white" : "bg-gray-300 text-white"}`}>
                {(settings.apiMode === "shared" || settings.apiKey.trim()) ? "\u2713" : "1"}
              </span>
              <div>
                <p className="text-xs text-gray-700">
                  {settings.apiMode === "shared" ? "API Mode: Shared (ready to use)" : "Add your DeepSeek API Key"}
                </p>
                {settings.apiMode === "custom" && !settings.apiKey.trim() && (
                  <button onClick={() => setShowSettings(true)} className="text-[10px] text-brand-600 hover:underline mt-0.5">
                    Go to Settings →
                  </button>
                )}
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5 shrink-0 ${settings.userProfile.userName.trim() ? "bg-green-500 text-white" : "bg-gray-300 text-white"}`}>
                {settings.userProfile.userName.trim() ? "\u2713" : "2"}
              </span>
              <div>
                <p className="text-xs text-gray-700">Fill in your profile</p>
                {!settings.userProfile.userName.trim() && (
                  <button onClick={() => setShowSettings(true)} className="text-[10px] text-brand-600 hover:underline mt-0.5">
                    Go to Settings →
                  </button>
                )}
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5 bg-gray-300 text-white shrink-0">3</span>
              <div>
                <p className="text-xs text-gray-700">Open a LinkedIn profile &amp; click Generate</p>
              </div>
            </li>
          </ol>
        </div>
      ) : null}

      {/* Message Length Limit — inline with Generate */}
      <div className="flex items-center gap-3 mb-3">
        <label className="text-[11px] font-medium text-gray-600 whitespace-nowrap shrink-0">
          Max chars
        </label>
        <input
          type="number"
          value={settings.maxMessageLength}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "" || raw === "-") return;
            const val = Number.parseInt(raw, 10);
            if (!Number.isNaN(val)) {
              setSettings((prev) => ({ ...prev, maxMessageLength: val }));
              saveSettings({ maxMessageLength: val }).catch(() => {});
            }
          }}
          onBlur={(e) => {
            let val = Number.parseInt(e.target.value, 10);
            if (Number.isNaN(val)) val = 300;
            val = Math.max(50, Math.min(1000, val));
            setSettings((prev) => ({ ...prev, maxMessageLength: val }));
            saveSettings({ maxMessageLength: val }).catch(() => {});
          }}
          className="w-20 px-2.5 py-1.5 text-xs text-center border border-gray-300 rounded-apple
                     focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
                     text-gray-700 font-medium tabular-nums"
        />
        <span className="text-[10px] text-gray-400">
          per message
        </span>
      </div>

      {/* Find Common Button */}
      <button
        onClick={handleFindCommon}
        disabled={isFindingCommon || !settingsLoaded || (settings.apiMode === "custom" && !settings.apiKey.trim())}
        className="w-full py-2 mt-3 rounded-apple bg-white text-brand-600 font-medium text-sm
                   border border-brand-200 hover:bg-brand-50 active:scale-[0.98] transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isFindingCommon ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            Finding common points...
          </span>
        ) : (
          "Find Common Points"
        )}
      </button>

      {/* Common Points Display */}
      {commonPoints.length > 0 && (
        <div className="mt-3 p-3 rounded-apple bg-brand-50 border border-brand-100">
          <p className="text-[11px] font-medium text-brand-700 mb-2">
            Select a common point to focus on:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {commonPoints.map((point, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedCommonPoint(selectedCommonPoint === point ? null : point);
                }}
                className={`px-2.5 py-1.5 rounded-full text-[10px] font-medium transition-all
                  ${selectedCommonPoint === point
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-brand-700 border border-brand-200 hover:border-brand-400"
                  }`}
              >
                {point}
              </button>
            ))}
          </div>
          {selectedCommonPoint && (
            <p className="text-[10px] text-brand-600 mt-2">
              ✓ Focusing on: {selectedCommonPoint}
            </p>
          )}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading || regeneratingStyles.size > 0 || !settingsLoaded || (settings.apiMode === "custom" && !settings.apiKey.trim())}
        className="w-full py-2.5 rounded-apple bg-brand-600 text-white font-medium text-sm
                  hover:bg-brand-700 active:scale-[0.98] transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          "Generate Messages"
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-apple bg-red-50 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Target Profile Summary */}
      {targetProfile && (
        <div className="mt-4 p-3 rounded-apple bg-gray-50 text-xs text-gray-600">
          <p className="font-semibold text-gray-900 text-sm mb-1">
            {targetProfile.targetName}
          </p>
          {targetProfile.targetHeadline && (
            <p className="mb-1">{targetProfile.targetHeadline}</p>
          )}
          {(targetProfile.targetCompany || targetProfile.targetSchool) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-gray-500 mt-2">
              {targetProfile.targetCompany && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-brand-500" />
                  {targetProfile.targetCompany}
                </span>
              )}
              {targetProfile.targetSchool && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-brand-500" />
                  {targetProfile.targetSchool}
                </span>
              )}
              {targetProfile.targetLocation && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-brand-500" />
                  {targetProfile.targetLocation}
                </span>
              )}
            </div>
          )}
          {targetProfile.targetAbout && (
            <p className="mt-2 text-gray-500 line-clamp-3">
              {targetProfile.targetAbout}
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      {orderedMessages.length > 0 && (
        <div className="mt-4 space-y-3">
          {orderedMessages.map((msg) => {
            const isRegenerating = regeneratingStyles.has(msg.messageStyle);

            return (
              <div
                key={msg.messageId}
                className="p-3 rounded-apple border border-gray-200 hover:border-brand-300 transition-colors bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                    {STYLE_LABELS[msg.messageStyle]}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRegenerate(msg.messageStyle)}
                      disabled={isRegenerating}
                      className="text-[11px] text-gray-500 hover:text-brand-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Regenerate"
                    >
                      {isRegenerating ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                          Generating
                        </span>
                      ) : (
                        "Regenerate"
                      )}
                    </button>
                    <button
                      onClick={() => handleEditStart(msg)}
                      className="text-[11px] text-gray-500 hover:text-brand-600 font-medium"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleCopy(msg)}
                      className="text-[11px] text-brand-600 hover:text-brand-700 font-medium"
                      title="Copy"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {msg.messageContent}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!targetProfile && !isLoading && !error && (
        <div className="mt-8 text-center text-gray-400">
          <p className="text-sm">
            Open a LinkedIn profile page,
            <br />
            then click "Generate Messages"
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center gap-1.5">
          <p className="text-[10px] text-gray-400">
            LinkedIn AI Assistant v1.0.0
          </p>
          <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">
            Beta
          </span>
        </div>
        <div className="flex justify-center gap-3 mt-1.5">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              chrome.tabs.create({ url: chrome.runtime.getURL("privacy.html") });
            }}
            className="text-[10px] text-gray-400 hover:text-brand-600 transition-colors"
          >
            Privacy
          </a>
          <span className="text-gray-300">·</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              chrome.tabs.create({ url: "mailto:stevenli2007@berkeley.edu" });
            }}
            className="text-[10px] text-gray-400 hover:text-brand-600 transition-colors"
          >
            Feedback
          </a>
          <span className="text-gray-300">·</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              chrome.tabs.create({ url: "https://weixin.qq.com" });
            }}
            title="WeChat: Listeven2007"
            className="text-[10px] text-gray-400 hover:text-brand-600 transition-colors"
          >
            WeChat
          </a>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-gray-900/90 text-white text-xs font-medium shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Edit Modal */}
      {editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="w-full max-w-[320px] bg-white rounded-apple shadow-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Edit {STYLE_LABELS[editingMessage.messageStyle]} Message
            </h3>
            <textarea
              ref={editTextareaRef}
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-apple
                        focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
                        resize-none text-gray-700 leading-relaxed"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleEditCancel}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 rounded-apple hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-3 py-1.5 text-xs font-medium text-white bg-brand-600 rounded-apple hover:bg-brand-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;