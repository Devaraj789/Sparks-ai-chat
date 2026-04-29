import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Zap, Scale, Flame, Sparkles, Eye } from 'lucide-react';
import { models, categoryLabels, type Model } from '../lib/models';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const categoryIcons: Record<Model['category'], React.ReactNode> = {
  fast: <Zap size={12} className="text-amber-500" />,
  balanced: <Scale size={12} className="text-blue-500" />,
  powerful: <Flame size={12} className="text-red-500" />,
  creative: <Sparkles size={12} className="text-purple-500" />,
  vision: <Eye size={12} className="text-cyan-500" />,
};

const badgeColors: Record<string, string> = {
  'Popular': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  'New': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'Fastest': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  'Highest Quality': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  'Best for Code': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
};

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = models.find(m => m.id === selectedModel) ?? models[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface-2 hover:bg-surface-3 transition-colors text-sm w-full"
      >
        <span className="flex items-center gap-1.5 flex-1 min-w-0">
          {categoryIcons[selected.category]}
          <span className="font-medium text-text-primary truncate">{selected.name}</span>
          {selected.badge && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badgeColors[selected.badge]}`}>
              {selected.badge}
            </span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-xl border border-border bg-surface shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden animate-slide-up">
          <div className="p-1.5 max-h-72 overflow-y-auto">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => { onModelChange(model.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  selectedModel === model.id
                    ? 'bg-accent/10 text-accent'
                    : 'hover:bg-surface-2 text-text-primary'
                }`}
              >
                <span className="mt-0.5">{categoryIcons[model.category]}</span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{model.name}</span>
                    {model.badge && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeColors[model.badge]}`}>
                        {model.badge}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-text-muted block truncate">{model.description}</span>
                </span>
                {selectedModel === model.id && <Check size={14} className="flex-shrink-0 text-accent" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
