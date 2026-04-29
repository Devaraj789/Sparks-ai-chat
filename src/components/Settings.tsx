import { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Monitor, Sliders, AlertTriangle, ArrowDownUp, RotateCcw, Key, Plus, Trash2, HardDrive, Download, CheckCircle2, ChevronDown } from 'lucide-react';
import { loadCustomModels, saveCustomModelsToStorage, loadPersonalOpenRouterKey, savePersonalOpenRouterKey, type CustomModel } from '../lib/projects';
import { OFFLINE_MODELS, TIER_LABELS, loadDownloadedModels, ensureEngine, deleteOfflineModel, isWebGPUSupported, type OfflineModelInfo } from '../lib/webllm';

export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  language: 'auto' | 'english' | 'tamil' | 'hindi';
  systemPrompt: string;
  fontSize: 'sm' | 'base' | 'lg';
  temperature: number;
  topP: number;
  maxTokens: number;
  presencePenalty: number;
  frequencyPenalty: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'auto',
  systemPrompt: '',
  fontSize: 'base',
  temperature: 0.8,
  topP: 0.95,
  maxTokens: 0,
  presencePenalty: 0,
  frequencyPenalty: 0,
};

type Tab = 'general' | 'display' | 'sampling' | 'penalties' | 'import-export' | 'custom-models' | 'offline-models';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <SettingsIcon size={15} /> },
  { id: 'display', label: 'Display', icon: <Monitor size={15} /> },
  { id: 'sampling', label: 'Sampling', icon: <Sliders size={15} /> },
  { id: 'penalties', label: 'Penalties', icon: <AlertTriangle size={15} /> },
  { id: 'import-export', label: 'Import/Export', icon: <ArrowDownUp size={15} /> },
  { id: 'custom-models', label: 'Custom Models', icon: <Key size={15} /> },
  { id: 'offline-models', label: 'Offline Models', icon: <HardDrive size={15} /> },
];

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}

function SliderRow({ label, value, min, max, step, onChange, hint }: SliderRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-20 px-2 py-1 text-xs rounded-lg border border-border bg-surface-3 text-text-primary text-right focus:outline-none focus:border-accent/50"
        />
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent"
      />
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

const OPENROUTER_PRESETS = [
  { name: 'GPT-4o', model: 'openai/gpt-4o' },
  { name: 'GPT-4o Mini', model: 'openai/gpt-4o-mini' },
  { name: 'Claude 3.5 Sonnet', model: 'anthropic/claude-3.5-sonnet' },
  { name: 'Claude 3.5 Haiku', model: 'anthropic/claude-3.5-haiku' },
  { name: 'DeepSeek V3', model: 'deepseek/deepseek-chat' },
  { name: 'DeepSeek R1', model: 'deepseek/deepseek-r1' },
  { name: 'Llama 3.3 70B', model: 'meta-llama/llama-3.3-70b-instruct' },
  { name: 'Gemini 2.0 Flash', model: 'google/gemini-2.0-flash-exp:free' },
];

function CustomModelsTab() {
  const [models, setModels] = useState<CustomModel[]>(() => loadCustomModels());
  const [personalKey, setPersonalKey] = useState(() => loadPersonalOpenRouterKey());
  const [keySaved, setKeySaved] = useState(false);
  const [form, setForm] = useState({ name: '', model: '', baseUrl: 'https://openrouter.ai/api/v1', apiKey: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [addedFlash, setAddedFlash] = useState(false);

  const savePersonalKey = () => {
    savePersonalOpenRouterKey(personalKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 1500);
  };

  const save = () => {
    setFormError(null);
    if (!form.name.trim()) { setFormError('Display Name is required.'); return; }
    if (!form.model.trim()) { setFormError('Model ID is required (e.g. openai/gpt-4o).'); return; }
    if (!form.baseUrl.trim()) { setFormError('Base URL is required.'); return; }
    const updated = [...models, { ...form, id: Date.now().toString() }];
    setModels(updated);
    saveCustomModelsToStorage(updated);
    setForm({ name: '', model: '', baseUrl: 'https://openrouter.ai/api/v1', apiKey: '' });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
  };

  const usePreset = (preset: { name: string; model: string }) => {
    setForm(p => ({ ...p, name: preset.name, model: preset.model }));
    setFormError(null);
  };

  const remove = (id: string) => {
    const updated = models.filter(m => m.id !== id);
    setModels(updated);
    saveCustomModelsToStorage(updated);
  };

  return (
    <div className="space-y-5">
      {/* ── Personal OpenRouter Key — applies to all listed models too ─── */}
      <div className="p-3 rounded-xl border border-accent/30 bg-accent/5 space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-text-primary">Personal OpenRouter Key</p>
          <span className="text-[10px] text-text-muted">Optional · stored locally</span>
        </div>
        <p className="text-xs text-text-secondary">
          Paste your own key from <span className="font-mono">openrouter.ai/keys</span>. If set, it will be used for <strong>all</strong> listed cloud models too — bypassing the shared key.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="sk-or-v1-..."
            value={personalKey}
            onChange={e => setPersonalKey(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface-3 text-sm text-text-primary focus:outline-none focus:border-accent/50"
          />
          <button
            onClick={savePersonalKey}
            className="px-3 py-2 rounded-xl bg-accent text-white text-xs hover:bg-accent-hover transition-colors flex items-center gap-1.5"
          >
            {keySaved ? <><CheckCircle2 size={13} /> Saved</> : 'Save Key'}
          </button>
        </div>
      </div>

      {/* ── Add Custom Model ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-text-primary">Add Custom Model</p>
        <p className="text-xs text-text-muted">
          Quick presets (1-click fill):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {OPENROUTER_PRESETS.map(p => (
            <button
              key={p.model}
              onClick={() => usePreset(p)}
              className="px-2.5 py-1 rounded-lg border border-border bg-surface-2 text-[11px] text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>

        <input
          placeholder="Display Name (e.g. GPT-4o)"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-border bg-surface-3 text-sm text-text-primary focus:outline-none focus:border-accent/50"
        />
        <input
          placeholder="Model ID (e.g. openai/gpt-4o)"
          value={form.model}
          onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-border bg-surface-3 text-sm text-text-primary focus:outline-none focus:border-accent/50"
        />
        <input
          placeholder="Base URL"
          value={form.baseUrl}
          onChange={e => setForm(p => ({ ...p, baseUrl: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-border bg-surface-3 text-sm text-text-primary focus:outline-none focus:border-accent/50"
        />
        <input
          type="password"
          placeholder="API Key (leave blank to use Personal key above)"
          value={form.apiKey}
          onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-border bg-surface-3 text-sm text-text-primary focus:outline-none focus:border-accent/50"
        />

        {formError && (
          <p className="text-xs text-red-400">⚠️ {formError}</p>
        )}
        {addedFlash && (
          <p className="text-xs text-green-400">✓ Added! It will appear in the model picker with a ⚡ badge.</p>
        )}

        <button
          onClick={save}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors"
        >
          <Plus size={13} /> Add Model
        </button>
        <p className="text-[11px] text-text-muted">
          Click "+ Add Model" above to save this custom entry. The bottom "Save settings" button only saves general preferences.
        </p>
      </div>

      {models.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted font-medium">Saved Custom Models</p>
          {models.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{m.name}</p>
                <p className="text-xs text-text-muted truncate">{m.model}</p>
              </div>
              <button
                onClick={() => remove(m.id)}
                className="text-text-muted hover:text-red-400 transition-colors p-2 flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OfflineModelsTab() {
  const [downloaded, setDownloaded] = useState<string[]>(() => loadDownloadedModels());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ text: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => { setSupported(isWebGPUSupported()); }, []);

  const download = async (id: string) => {
    setBusyId(id); setError(null); setProgress({ text: 'Starting…', pct: 0 });
    try {
      await ensureEngine(id, (text, pct) => setProgress({ text, pct }));
      setDownloaded(loadDownloadedModels());
      setProgress({ text: 'Ready', pct: 100 });
    } catch (err: any) {
      setError(err?.message ?? 'Download failed');
    } finally {
      setBusyId(null);
      setTimeout(() => setProgress(null), 1500);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this offline model from your browser cache?')) return;
    setBusyId(id);
    try {
      await deleteOfflineModel(id);
      setDownloaded(loadDownloadedModels());
    } catch (err: any) {
      setError(err?.message ?? 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const grouped: Record<OfflineModelInfo['tier'], OfflineModelInfo[]> = { tiny: [], small: [], medium: [], power: [] };
  OFFLINE_MODELS.forEach(m => grouped[m.tier].push(m));
  const tierOrder: OfflineModelInfo['tier'][] = ['tiny', 'small', 'medium', 'power'];

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl border border-border bg-surface-2 text-xs text-text-secondary space-y-1">
        <p className="font-medium text-text-primary">Run models 100% offline</p>
        <p>Models download once into your browser, then run on your GPU via WebGPU. After that, no internet needed.</p>
        {!supported && (
          <p className="text-red-400 mt-2">⚠️ WebGPU not detected on this device. Try Chrome / Edge / Brave on a desktop with a modern GPU.</p>
        )}
      </div>

      <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-text-secondary space-y-1">
        <p className="font-medium text-amber-400">📋 Pick by your hardware</p>
        <p>Match a tier to your device's RAM. Trying to run a model larger than your RAM will fail or freeze the browser.</p>
        <p className="text-text-muted">For real "Power" coding/reasoning models on weaker hardware, install <span className="font-mono text-text-primary">Ollama</span> or <span className="font-mono text-text-primary">LM Studio</span> on a desktop, then add it via the Custom Models tab using <span className="font-mono">http://localhost:11434/v1</span>.</p>
      </div>

      {progress && (
        <div className="p-3 rounded-xl border border-accent/30 bg-accent/5 space-y-2">
          <p className="text-xs text-text-primary truncate">{progress.text}</p>
          <div className="w-full h-1.5 rounded-full bg-surface-3 overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-400">{error}</div>
      )}

      {tierOrder.map(tier => (
        <div key={tier} className="space-y-2">
          <div className="flex items-baseline justify-between px-1">
            <p className="text-sm font-semibold text-text-primary">{TIER_LABELS[tier].label}</p>
            <p className="text-[11px] text-text-muted">{TIER_LABELS[tier].desc}</p>
          </div>
          {grouped[tier].map(m => {
            const isDown = downloaded.includes(m.id);
            const isBusy = busyId === m.id;
            return (
              <div key={m.id} className="flex items-center justify-between gap-2 p-3 rounded-xl border border-border bg-surface-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-text-primary truncate">{m.name}</p>
                    {isDown && <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-text-muted truncate">{m.size} download · needs {m.ramNeeded} RAM</p>
                  <p className="text-[11px] text-text-secondary truncate mt-0.5">{m.goodFor}</p>
                </div>
                {isDown ? (
                  <button
                    onClick={() => remove(m.id)}
                    disabled={isBusy}
                    className="text-text-muted hover:text-red-400 transition-colors p-2 disabled:opacity-50 flex-shrink-0"
                    title="Delete from cache"
                  >
                    <Trash2 size={13} />
                  </button>
                ) : (
                  <button
                    onClick={() => download(m.id)}
                    disabled={isBusy || !supported}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white text-xs hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Download size={12} />
                    {isBusy ? '…' : 'Get'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface SettingsProps {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onClose: () => void;
  onExport: () => void;
  onClearHistory: () => void;
}

export function Settings({ settings, onSave, onClose, onExport, onClearHistory }: SettingsProps) {
  const [draft, setDraft] = useState<AppSettings>({ ...settings });
  const [tab, setTab] = useState<Tab>('general');
  const [mobileOpen, setMobileOpen] = useState<Tab | null>('general');

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }));

  const renderTabContent = (currentTab: Tab) => (
    <>
            {currentTab === 'general' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Theme</label>
                  <select
                    value={draft.theme}
                    onChange={e => update('theme', e.target.value as AppSettings['theme'])}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-3 text-sm text-text-primary focus:outline-none focus:border-accent/50"
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                  <p className="text-xs text-text-muted">Choose between System, Light, or Dark.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Response Language</label>
                  <select
                    value={draft.language}
                    onChange={e => update('language', e.target.value as AppSettings['language'])}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-3 text-sm text-text-primary focus:outline-none focus:border-accent/50"
                  >
                    <option value="auto">Auto (model decides)</option>
                    <option value="english">English</option>
                    <option value="tamil">Tamil — தமிழ்</option>
                    <option value="hindi">Hindi — हिन्दी</option>
                  </select>
                  <p className="text-xs text-text-muted">Prepends a language instruction to every API call.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">System Prompt</label>
                  <textarea
                    value={draft.systemPrompt}
                    onChange={e => update('systemPrompt', e.target.value)}
                    placeholder="You are a helpful assistant..."
                    rows={5}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 resize-none"
                  />
                  <p className="text-xs text-text-muted">Added as the first system message in every conversation.</p>
                </div>
              </>
            )}

            {currentTab === 'display' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Font Size</label>
                  <div className="flex gap-2">
                    {(['sm', 'base', 'lg'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => update('fontSize', s)}
                        className={`flex-1 py-2 rounded-xl border text-sm transition-colors ${
                          draft.fontSize === s
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border bg-surface-2 text-text-secondary hover:bg-surface-3'
                        }`}
                      >
                        {s === 'sm' ? 'Small' : s === 'base' ? 'Medium' : 'Large'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentTab === 'sampling' && (
              <>
                <SliderRow label="Temperature" value={draft.temperature} min={0} max={2} step={0.05}
                  onChange={v => update('temperature', v)}
                  hint="Controls randomness. Lower = more focused, higher = more creative." />
                <SliderRow label="Top P" value={draft.topP} min={0} max={1} step={0.01}
                  onChange={v => update('topP', v)}
                  hint="Nucleus sampling threshold. 0.95 is usually a good default." />
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-text-primary">Max Tokens</label>
                    <input
                      type="number"
                      value={draft.maxTokens}
                      min={0}
                      onChange={e => update('maxTokens', parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-xs rounded-lg border border-border bg-surface-3 text-text-primary text-right focus:outline-none focus:border-accent/50"
                    />
                  </div>
                  <p className="text-xs text-text-muted">Maximum tokens in the response. Set to 0 for unlimited.</p>
                </div>
              </>
            )}

            {currentTab === 'penalties' && (
              <>
                <SliderRow label="Presence Penalty" value={draft.presencePenalty} min={-2} max={2} step={0.05}
                  onChange={v => update('presencePenalty', v)}
                  hint="Positive values penalize tokens that have appeared, encouraging new topics." />
                <SliderRow label="Frequency Penalty" value={draft.frequencyPenalty} min={-2} max={2} step={0.05}
                  onChange={v => update('frequencyPenalty', v)}
                  hint="Positive values penalize repeated tokens based on their frequency." />
              </>
            )}

            {currentTab === 'import-export' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-border bg-surface-2 space-y-3">
                  <p className="text-sm font-medium text-text-primary">Export conversations</p>
                  <p className="text-xs text-text-muted">Download all your conversations as a JSON file.</p>
                  <button onClick={onExport} className="px-4 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors">
                    Export JSON
                  </button>
                </div>
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-3">
                  <p className="text-sm font-medium text-red-400">Danger zone</p>
                  <p className="text-xs text-text-muted">Permanently delete all conversations. This cannot be undone.</p>
                  <button onClick={onClearHistory} className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition-colors">
                    Clear all history
                  </button>
                </div>
              </div>
            )}

            {currentTab === 'custom-models' && (
              <CustomModelsTab />
            )}

            {currentTab === 'offline-models' && (
              <OfflineModelsTab />
            )}
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden animate-fade-in flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <SettingsIcon size={16} className="text-accent" />
            <span className="font-semibold text-text-primary">Settings</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-3 text-text-muted hover:text-text-primary transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Mobile: accordion */}
        <div className="sm:hidden flex-1 overflow-y-auto">
          {tabs.map(t => {
            const isOpen = mobileOpen === t.id;
            return (
              <div key={t.id} className="border-b border-border last:border-b-0">
                <button
                  onClick={() => setMobileOpen(isOpen ? null : t.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors text-left ${
                    isOpen ? 'bg-surface-2 text-text-primary font-medium' : 'text-text-secondary hover:bg-surface-2'
                  }`}
                >
                  {t.icon}
                  <span className="flex-1">{t.label}</span>
                  <ChevronDown
                    size={16}
                    className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 py-4 space-y-5 bg-surface">
                    {renderTabContent(t.id)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop: sidebar + content */}
        <div className="hidden sm:flex h-[440px]">
          <div className="w-44 border-r border-border p-2 space-y-0.5 flex-shrink-0">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-left ${
                  tab === t.id
                    ? 'bg-surface-3 text-text-primary font-medium'
                    : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {renderTabContent(tab)}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={() => setDraft({ ...DEFAULT_SETTINGS })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-text-secondary hover:bg-surface-2 transition-colors"
          >
            <RotateCcw size={13} />
            Reset to default
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm text-text-secondary hover:bg-surface-2 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => { onSave(draft); onClose(); }}
              className="px-4 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors"
            >
              Save settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}