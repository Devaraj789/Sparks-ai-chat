import { useState, useEffect, useCallback } from 'react';
import { fetchFreeModels, type FreeModel } from './api';
import { loadCustomModels } from './projects';
import { OFFLINE_MODELS, loadDownloadedModels } from './webllm';

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export interface ModelWithStatus extends FreeModel {
  online: boolean;
}

export function useModels() {
  const [models, setModels] = useState<ModelWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const sync = useCallback(async () => {
    try {
      const fresh = await fetchFreeModels();
      const freshIds = new Set(fresh.map(m => m.id));

      setModels(prev => {
        const prevMap = new Map(prev.map(m => [m.id, m]));
        const merged = new Map<string, ModelWithStatus>();

        // Keep all known models, mark online status
        prevMap.forEach((m, id) => {
          merged.set(id, { ...m, online: freshIds.has(id) });
        });

        // Add new models
        fresh.forEach(m => {
          merged.set(m.id, { ...m, online: true });
        });

        // Merge user-defined custom models from localStorage (always online)
        loadCustomModels().forEach(c => {
          merged.set(c.model, {
            id: c.model,
            name: `⚡ ${c.name}`,
            context_length: 128000,
            pricing: { prompt: '0', completion: '0' },
            custom: true,
            apiKey: c.apiKey,
            baseUrl: c.baseUrl,
            online: true,
          });
        });

        // Merge downloaded offline models — usable without internet
        const downloaded = new Set(loadDownloadedModels());
        OFFLINE_MODELS.filter(m => downloaded.has(m.id)).forEach(m => {
          merged.set(m.id, {
            id: m.id,
            name: `💾 ${m.name}`,
            context_length: m.contextLength,
            pricing: { prompt: '0', completion: '0' },
            offline: true,
            online: true,
          });
        });

        return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
      });

      setError(null);
      setLastSynced(new Date());
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch models');
      // Mark all existing models as offline on error
      setModels(prev => prev.map(m => ({ ...m, online: false })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    sync();
    const interval = setInterval(sync, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sync]);

  return { models, loading, error, lastSynced, sync };
}
