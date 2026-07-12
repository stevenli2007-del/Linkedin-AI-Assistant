import { useState, useEffect, useCallback } from "react";
import type { UserProfile } from "@/types";
import type { AppSettings } from "@/services/settings";
import {
  setImportPending,
  loadPendingRawText,
  clearPendingRawText,
  saveSettings,
} from "@/services/settings";
import { refineProfile } from "@/services/llm";

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "What is API Mode?",
    a: "Shared Mode (recommended) uses Youcheng's API key — no setup needed. Custom Mode lets you use your own DeepSeek API key.",
  },
  {
    q: "How do I get a DeepSeek API Key?",
    a: "Only needed for Custom Mode. Visit platform.deepseek.com, sign up, and generate an API key. It starts with \"sk-\".",
  },
  {
    q: "Is my data safe?",
    a: "Your settings and profile are stored locally in Chrome. In Custom Mode, your API key is sent only to our backend (not stored). See Privacy Policy.",
  },
  {
    q: "Why do I need to fill in my profile?",
    a: "Your profile helps the AI personalize each message. More context = better messages.",
  },
  {
    q: "Can I edit generated messages?",
    a: "Yes \u2014 click \"Edit\" to modify, or \"Regenerate\" to get a new version of any style.",
  },
  {
    q: "Does this send messages automatically?",
    a: "No. You review, copy, and send every message yourself. Nothing is automated.",
  },
  {
    q: "How do I report bugs or share feedback?",
    a: "This is a Beta version — your feedback is invaluable! Email: stevenli2007@berkeley.edu | WeChat: Listeven2007. Bugs, ideas, or even a quick \"it works!\" all help us improve.",
  },
];

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onCancel: () => void;
}

const USER_PROFILE_FIELDS: Array<{
  key: keyof UserProfile;
  label: string;
  placeholder: string;
  required?: boolean;
}> = [
  {
    key: "userName",
    label: "Your Name",
    placeholder: "e.g. Alex Chen",
    required: true,
  },
  {
    key: "userHeadline",
    label: "Headline / Title",
    placeholder: "e.g. Product Manager at Stripe",
  },
  {
    key: "userCompany",
    label: "Company",
    placeholder: "e.g. Stripe",
  },
  {
    key: "userLocation",
    label: "Location",
    placeholder: "e.g. San Francisco Bay Area",
  },
  {
    key: "userSchool",
    label: "School",
    placeholder: "e.g. Tsinghua University",
  },
  {
    key: "userBackground",
    label: "Background Summary",
    placeholder: "Briefly describe your professional background...",
  },
  {
    key: "userGoals",
    label: "Networking Goals",
    placeholder: "What do you hope to get from these connections?",
  },
  {
    key: "userInterests",
    label: "Interests / Topics",
    placeholder: "e.g. AI, fintech, climate tech",
  },
];

export function Settings({ settings, onSave, onCancel }: SettingsProps) {
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "refining" | "preview">("idle");
  const [previewProfile, setPreviewProfile] = useState<UserProfile | null>(null);

  // Phase 09: Load API mode from settings
  const [apiMode, setApiMode] = useState<"shared" | "custom">(settings.apiMode || "shared");

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  // Phase 7: Detect pending raw profile text, refine via LLM, show preview
  useEffect(() => {
    let mounted = true;

    const handleRawText = async () => {
      const rawText = await loadPendingRawText();
      if (!mounted || !rawText) return;

      // Phase 09: Check API mode — shared mode doesn't need user API key
      if (draft.apiMode === "custom" && !draft.apiKey.trim()) {
        setError("Please set your DeepSeek API Key first (Custom Mode).");
        setImportStatus("idle");
        await clearPendingRawText();
        return;
      }

      setImportStatus("refining");
      setError("");

      try {
        const refined = await refineProfile(
          draft.apiMode,
          draft.apiMode === "custom" ? draft.apiKey.trim() : null,
          rawText,
          { model: draft.model }
        );
        if (mounted) {
          setPreviewProfile(refined);
          setImportStatus("preview");
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to refine profile with AI. Please try again."
          );
          setImportStatus("idle");
        }
      } finally {
        await clearPendingRawText();
      }
    };

    handleRawText();

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>
    ) => {
      if (changes.pendingRawProfileText?.newValue) {
        handleRawText();
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, [draft.apiKey, draft.model]);

  const updateProfile = useCallback(
    (key: keyof UserProfile, value: string) => {
      setDraft((prev) => ({
        ...prev,
        userProfile: { ...prev.userProfile, [key]: value },
      }));
    },
    []
  );

  const handleImportFromLinkedIn = async () => {
    setError("");
    setImportStatus("importing");

    try {
      await setImportPending(true);
      await chrome.tabs.create({
        url: "https://www.linkedin.com/in/me/",
        active: true,
      });
    } catch (err) {
      setImportStatus("idle");
      setError(
        err instanceof Error
          ? err.message
          : "Failed to open LinkedIn. Please try again."
      );
    }
  };

  const handlePreviewConfirm = async () => {
    if (!previewProfile) return;
    // Update local draft
    setDraft((prev) => ({ ...prev, userProfile: previewProfile }));
    // Immediately persist profile to storage (user shouldn't need to remember to click Save)
    try {
      await saveSettings({ userProfile: previewProfile });
    } catch (err) {
      // Don't block UI — settings page is still open, user can still click Save manually
      console.error("Auto-save after Apply failed:", err);
    }
    setPreviewProfile(null);
    setImportStatus("idle");
  };

  const handlePreviewDiscard = () => {
    setPreviewProfile(null);
    setImportStatus("idle");
  };

  const handlePreviewEdit = (key: keyof UserProfile, value: string) => {
    setPreviewProfile((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleSave = async () => {
    if (!draft.userProfile.userName.trim()) {
      setError("Please enter your name.");
      return;
    }
    // Only validate API key if in custom mode
    if (draft.apiMode === "custom") {
      if (!draft.apiKey.trim()) {
        setError("Please enter your DeepSeek API Key (Custom Mode).");
        return;
      }
      if (!draft.apiKey.trim().startsWith("sk-")) {
        setError("API Key should start with 'sk-'.");
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      await onSave(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  // Preview mode — replace entire page content
  if (previewProfile && importStatus === "preview") {
    return (
      <div className="w-[360px] min-h-[400px] bg-white font-sans flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-gray-900">
              AI-Refined Profile
            </h1>
            <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              Preview
            </span>
          </div>
          <button
            onClick={handlePreviewDiscard}
            className="text-xs text-gray-500 hover:text-gray-900 font-medium"
          >
            Back
          </button>
        </div>

        {/* Hint */}
        <p className="text-[10px] text-gray-500 px-5 pt-3 pb-1">
          Review and edit the AI-refined profile. Click "Apply" to save, or go "Back" to cancel.
        </p>

        {/* Scrollable fields */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div className="space-y-3 pt-2">
            {USER_PROFILE_FIELDS.map((field) =>
              field.key === "userBackground" ||
              field.key === "userGoals" ||
              field.key === "userInterests" ? (
                <div key={`preview-${field.key}`}>
                  <label className="block text-[10px] font-medium text-gray-600 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <textarea
                    value={previewProfile[field.key]}
                    onChange={(e) => handlePreviewEdit(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded-md
                               focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400
                               placeholder-gray-400 resize-none bg-purple-50/30"
                  />
                </div>
              ) : (
                <div key={`preview-${field.key}`}>
                  <label className="block text-[10px] font-medium text-gray-600 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type="text"
                    value={previewProfile[field.key]}
                    onChange={(e) => handlePreviewEdit(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded-md
                               focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400
                               placeholder-gray-400 bg-purple-50/30"
                  />
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handlePreviewDiscard}
            className="flex-1 py-2 rounded-apple border border-gray-300 text-xs font-medium text-gray-600
                       hover:bg-gray-50 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handlePreviewConfirm}
            className="flex-1 py-2 rounded-apple bg-brand-600 text-white text-xs font-medium
                       hover:bg-brand-700 active:scale-[0.98] transition-all"
          >
            Apply &amp; Fill Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[360px] min-h-[400px] bg-white p-5 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-base font-semibold text-gray-900">Settings</h1>
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-900 font-medium"
        >
          Back
        </button>
      </div>

      {/* Import from LinkedIn */}
      <section className="mb-5 p-3 rounded-apple bg-gray-50">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-xs font-semibold text-gray-900">
            Import from LinkedIn
          </h2>
          {importStatus === "refining" && (
            <span className="text-[10px] font-medium text-brand-600">
              AI Refining...
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-500 mb-2.5">
          Sync your LinkedIn profile, then AI refines it into a clean,
          structured profile for generating better messages.
        </p>
        <button
          onClick={handleImportFromLinkedIn}
          disabled={importStatus === "importing" || importStatus === "refining"}
          className="w-full py-2 rounded-apple border border-brand-300 text-brand-700 text-xs font-medium
                     hover:bg-brand-50 active:scale-[0.98] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importStatus === "importing" ? (
            <span className="inline-flex items-center justify-center gap-1.5">
              <span className="w-3 h-3 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              Opening LinkedIn...
            </span>
          ) : importStatus === "refining" ? (
            <span className="inline-flex items-center justify-center gap-1.5">
              <span className="w-3 h-3 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              AI is refining your profile...
            </span>
          ) : (
            "Sync My LinkedIn Profile"
          )}
        </button>
      </section>

      {/* API Mode */}
      <section className="mb-5">
        <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
          API Mode
        </h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="apiMode"
              checked={apiMode === "shared"}
              onChange={() => {
                setApiMode("shared");
                setDraft((prev) => ({ ...prev, apiMode: "shared" }));
              }}
              className="accent-brand-600"
            />
            <div>
              <p className="text-xs font-medium text-gray-900">
                Use Youcheng's API (Recommended)
              </p>
              <p className="text-[10px] text-gray-500">
                No API key needed. Ready to use immediately.
              </p>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="apiMode"
              checked={apiMode === "custom"}
              onChange={() => {
                setApiMode("custom");
                setDraft((prev) => ({ ...prev, apiMode: "custom" }));
              }}
              className="accent-brand-600"
            />
            <div>
              <p className="text-xs font-medium text-gray-900">
                Use my own API key
              </p>
              <p className="text-[10px] text-gray-500">
                Use your own DeepSeek API key. You pay for usage.
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* API Key */}
      <section className={`mb-5 ${apiMode === "shared" ? "opacity-50" : ""}`}>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          DeepSeek API Key
          {apiMode === "custom" && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            value={draft.apiKey}
            onChange={(e) => setDraft((prev) => ({ ...prev, apiKey: e.target.value }))}
            placeholder="sk-..."
            disabled={apiMode === "shared"}
            className={`w-full px-3 py-2 pr-16 text-xs border border-gray-300 rounded-apple
                       focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
                       placeholder-gray-400 ${apiMode === "shared" ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowApiKey((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand-600 font-medium"
          >
            {showApiKey ? "Hide" : "Show"}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          Stored securely in Chrome local storage. Never leaves your browser.
        </p>
      </section>

      {/* Model & Temperature */}
      <section className="mb-5">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Model
        </label>
        <input
          type="text"
          value={draft.model}
          onChange={(e) => setDraft((prev) => ({ ...prev, model: e.target.value }))}
          placeholder="deepseek-chat"
          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-apple
                     focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
                     placeholder-gray-400 mb-3"
        />

        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-gray-600">Temperature</label>
          <span className="text-xs font-medium text-brand-600">
            {draft.temperature.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={draft.temperature}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              temperature: Number.parseFloat(e.target.value),
            }))
          }
          className="w-full accent-brand-600"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>Precise</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
      </section>

      {/* Message History Toggle */}
      <section className="mb-5">
        <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
          Message History
        </h2>
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex-1 mr-3">
            <p className="text-xs font-medium text-gray-900">
              Record copied messages
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
              When enabled, each message you copy is saved locally with the target's
              name, style, and common points. You can view and export to CSV from the
              History page. All data stays on your device.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDraft((prev) => ({ ...prev, historyEnabled: !prev.historyEnabled }))}
            className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
              draft.historyEnabled ? "bg-brand-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                draft.historyEnabled ? "translate-x-4" : ""
              }`}
            />
          </button>
        </label>
      </section>

      {/* User Profile */}
      <section className="mb-5">
        <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
          Your Profile
        </h2>
        <div className="space-y-3">
          {USER_PROFILE_FIELDS.map((field) =>
            field.key === "userBackground" ||
            field.key === "userGoals" ||
            field.key === "userInterests" ? (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <textarea
                  value={draft.userProfile[field.key]}
                  onChange={(e) => updateProfile(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-apple
                             focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
                             placeholder-gray-400 resize-none"
                />
              </div>
            ) : (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type="text"
                  value={draft.userProfile[field.key]}
                  onChange={(e) => updateProfile(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-apple
                             focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
                             placeholder-gray-400"
                />
              </div>
            )
          )}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-apple bg-red-50 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-apple border border-gray-300 text-xs font-medium text-gray-700
                     hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 rounded-apple bg-brand-600 text-white text-xs font-medium
                     hover:bg-brand-700 active:scale-[0.98] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Legal Links */}
      <div className="mt-4 flex justify-center gap-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            chrome.tabs.create({ url: chrome.runtime.getURL("privacy.html") });
          }}
          className="text-[10px] text-gray-400 hover:text-brand-600 transition-colors"
        >
          Privacy Policy
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
          Support
        </a>
      </div>

      {/* FAQ */}
      <details className="mt-4 group">
        <summary className="text-[10px] text-gray-400 hover:text-brand-600 cursor-pointer transition-colors text-center list-none">
          Frequently Asked Questions
        </summary>
        <div className="mt-3 space-y-3 px-1">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i}>
              <p className="text-[10px] font-medium text-gray-700">{item.q}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
