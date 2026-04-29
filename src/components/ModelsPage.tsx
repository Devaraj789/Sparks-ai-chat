import { useState, useMemo } from 'react';
import { MessageSquare, RefreshCw, Cpu } from 'lucide-react';
import { useModels } from '../lib/useModels';
import type { FreeModel } from '../lib/api';
import { cleanModelName, isTamilModel } from '../lib/models';

interface ModelsPageProps {
  onChatWithModel: (modelId: string, contextLength: number) => void;
}

const CATEGORIES = ['All', 'Coding', 'Reasoning', 'Vision', 'Research', 'Chat'] as const;
type Category = typeof CATEGORIES[number];

function getModelCategory(model: FreeModel): Category {
  const s = (model.id + ' ' + model.name).toLowerCase();
  if (/coder|starcoder|codestral|deepseek-coder|qwen2\.5-coder/.test(s)) return 'Coding';
  if (/thinking|reasoning|deepseek-r1|\/r1[:-]|qwq|\/o1[:-]/.test(s)) return 'Reasoning';
  if (/vision|[\/-]vl[:\-\/]|visual|pixtral|llava/.test(s)) return 'Vision';
  if (/sonar|search|perplexity/.test(s)) return 'Research';
  return 'Chat';
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString();
}

function getProvider(modelId: string): string {
  const part = modelId.split('/')[0] ?? modelId;
  return part.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function ModelsPage({ onChatWithModel }: ModelsPageProps) {
  const { models, loading, error, lastSynced, sync } = useModels();
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const categorized = useMemo(() => {
    const online = models.filter(m => m.online);
    const offline = models.filter(m => !m.online);
    const all = [...online, ...offline];
    if (activeCategory === 'All') return all;
    return all.filter(m => getModelCategory(m) === activeCategory);
  }, [models, activeCategory]);

  const counts = useMemo(() => {
    const online = models.filter(m => m.online);
    const offline = models.filter(m => !m.online);
    const all = [...online, ...offline];
    const result: Record<Category, number> = { All: all.length, Coding: 0, Reasoning: 0, Vision: 0, Research: 0, Chat: 0 };
    all.forEach(m => { result[getModelCategory(m)]++; });
    return result;
  }, [models]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-mono font-bold text-xl text-text-primary">Free Models</h1>
            <p className="text-xs text-text-muted mt-0.5">
              {loading
                ? 'Loading from OpenRouter…'
                : error
                ? 'Failed to fetch — showing last known state'
                : `${models.filter(m => m.online).length} available · auto-syncs every 30 min`}
            </p>
          </div>
          <button
            onClick={sync}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-border transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Sync
          </button>
        </div>

        {lastSynced && (
          <p className="text-[11px] text-text-muted mb-4">
            Last synced: {lastSynced.toLocaleTimeString()}
          </p>
        )}

        {error && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto pb-1 flex-nowrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 transition-colors ${
                activeCategory === cat
                  ? 'bg-accent text-white'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              {cat}
              {counts[cat] > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeCategory === cat ? 'bg-white/20' : 'bg-surface-3 text-text-muted'
                }`}>
                  {counts[cat]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && categorized.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface-2 p-4 animate-pulse">
                <div className="h-4 bg-surface-3 rounded mb-2 w-2/3" />
                <div className="h-3 bg-surface-3 rounded mb-4 w-1/3" />
                <div className="h-3 bg-surface-3 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Model grid */}
        {categorized.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categorized.map(model => (
              <div
                key={model.id}
                className={`rounded-2xl border bg-surface-2 p-4 flex flex-col gap-3 transition-colors ${
                  model.online ? 'border-border' : 'border-border opacity-60'
                }`}
              >
                {/* Status + provider */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-text-muted font-medium truncate">
                    {getProvider(model.id)}
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full ${model.online ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={`text-[10px] ${model.online ? 'text-green-500' : 'text-red-400'}`}>
                      {model.online ? 'Available' : 'Unavailable'}
                    </span>
                  </span>
                </div>

                {/* Name */}
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-semibold text-text-primary leading-snug">
                      {cleanModelName(model.name)}
                    </h3>
                    {isTamilModel(model.id) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-orange-500/15 text-orange-400 font-medium flex-shrink-0">
                        தமிழ்
                      </span>
                    )}
                  </div>
                </div>

                {/* Context */}
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <Cpu size={11} className="flex-shrink-0" />
                  <span>
                    Context:{' '}
                    <span className="text-text-secondary font-medium">
                      {model.context_length.toLocaleString()} tokens
                    </span>
                  </span>
                </div>

                {/* Context bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent/40 rounded-full"
                      style={{ width: `${Math.min(100, (model.context_length / 200_000) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-text-muted flex-shrink-0">
                    {formatTokens(model.context_length)}
                  </span>
                </div>

                {/* Chat button */}
                <button
                  disabled={!model.online}
                  onClick={() => onChatWithModel(model.id, model.context_length)}
                  className={`mt-auto flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    model.online
                      ? 'bg-accent text-white hover:bg-accent-hover'
                      : 'bg-surface-3 text-text-muted cursor-not-allowed'
                  }`}
                >
                  <MessageSquare size={12} />
                  Chat
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && categorized.length === 0 && !error && (
          <div className="text-center py-16 text-text-muted text-sm">
            No models in this category.
          </div>
        )}
      </div>
    </div>
  );
}
