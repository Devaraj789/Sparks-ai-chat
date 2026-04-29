import type { MLCEngine } from '@mlc-ai/web-llm';

export interface OfflineModelInfo {
  id: string;
  name: string;
  size: string;
  contextLength: number;
  tier: 'tiny' | 'small' | 'medium' | 'power';
  ramNeeded: string;
  goodFor: string;
}

export const OFFLINE_MODELS: OfflineModelInfo[] = [
  // ── Tiny — runs on weak laptops / phones ─────────────────────────────────
  { id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', name: 'SmolLM2 360M', size: '~280 MB', contextLength: 2048, tier: 'tiny', ramNeeded: '1 GB', goodFor: 'Quick replies, summaries' },
  { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 0.5B', size: '~350 MB', contextLength: 4096, tier: 'tiny', ramNeeded: '1 GB', goodFor: 'Multilingual chat' },
  // ── Small — modest laptops ───────────────────────────────────────────────
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B', size: '~880 MB', contextLength: 4096, tier: 'small', ramNeeded: '2 GB', goodFor: 'General chat, light coding' },
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 1.5B', size: '~950 MB', contextLength: 4096, tier: 'small', ramNeeded: '2 GB', goodFor: 'Reasoning, writing' },
  { id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 Coder 1.5B', size: '~1.0 GB', contextLength: 4096, tier: 'small', ramNeeded: '2 GB', goodFor: 'Code generation, debugging' },
  // ── Medium — needs a real laptop ─────────────────────────────────────────
  { id: 'gemma-2-2b-it-q4f16_1-MLC', name: 'Gemma 2 2B', size: '~1.6 GB', contextLength: 4096, tier: 'medium', ramNeeded: '4 GB', goodFor: 'Quality writing, ideas' },
  { id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 3B', size: '~1.9 GB', contextLength: 4096, tier: 'medium', ramNeeded: '4 GB', goodFor: 'Reasoning, planning' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 3B', size: '~2.0 GB', contextLength: 4096, tier: 'medium', ramNeeded: '4 GB', goodFor: 'Balanced general use' },
  { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', name: 'Phi 3.5 Mini', size: '~2.2 GB', contextLength: 4096, tier: 'medium', ramNeeded: '4 GB', goodFor: 'Reasoning, code, math' },
  // ── Power — needs 8 GB+ RAM, modern GPU ─────────────────────────────────
  { id: 'Mistral-7B-Instruct-v0.3-q4f16_1-MLC', name: 'Mistral 7B', size: '~4.0 GB', contextLength: 4096, tier: 'power', ramNeeded: '8 GB', goodFor: 'Heavy general tasks' },
  { id: 'Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 Coder 7B', size: '~4.5 GB', contextLength: 4096, tier: 'power', ramNeeded: '8 GB', goodFor: 'Production-grade coding, debugging, refactors' },
  { id: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC', name: 'Hermes 3 Llama 3.1 8B', size: '~5.0 GB', contextLength: 4096, tier: 'power', ramNeeded: '10 GB', goodFor: 'Deep reasoning, agents, project planning' },
  { id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC', name: 'Llama 3.1 8B', size: '~5.0 GB', contextLength: 4096, tier: 'power', ramNeeded: '10 GB', goodFor: 'All-purpose flagship — coding, PM, deployment' },
  { id: 'DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC', name: 'DeepSeek R1 Distill 8B', size: '~5.0 GB', contextLength: 4096, tier: 'power', ramNeeded: '10 GB', goodFor: 'Step-by-step reasoning, complex problem solving' },
];

export const TIER_LABELS: Record<OfflineModelInfo['tier'], { label: string; desc: string }> = {
  tiny:   { label: '🪶 Tiny',   desc: 'Phones & weak laptops (under 4 GB RAM)' },
  small:  { label: '⚡ Small',  desc: 'Most laptops (4 GB+ RAM)' },
  medium: { label: '🔥 Medium', desc: 'Modern laptops (8 GB+ RAM, decent GPU)' },
  power:  { label: '🚀 Power',  desc: 'Workstations (16 GB+ RAM, dedicated GPU). Coding · debugging · deep reasoning · PM' },
};

const DOWNLOADED_KEY = 'ai-chat-offline-downloaded';

export function loadDownloadedModels(): string[] {
  try {
    const raw = localStorage.getItem(DOWNLOADED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function markDownloaded(modelId: string) {
  const list = loadDownloadedModels();
  if (!list.includes(modelId)) {
    list.push(modelId);
    localStorage.setItem(DOWNLOADED_KEY, JSON.stringify(list));
  }
}

export function unmarkDownloaded(modelId: string) {
  const list = loadDownloadedModels().filter(id => id !== modelId);
  localStorage.setItem(DOWNLOADED_KEY, JSON.stringify(list));
}

let enginePromise: Promise<MLCEngine> | null = null;
let currentModelId: string | null = null;

export function isWebGPUSupported(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

export async function ensureEngine(
  modelId: string,
  onProgress?: (text: string, percent: number) => void,
): Promise<MLCEngine> {
  const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

  if (currentModelId === modelId && enginePromise) {
    return enginePromise;
  }

  currentModelId = modelId;
  enginePromise = CreateMLCEngine(modelId, {
    initProgressCallback: (report) => {
      const pct = Math.round((report.progress ?? 0) * 100);
      onProgress?.(report.text || '', pct);
    },
  });

  try {
    const engine = await enginePromise;
    markDownloaded(modelId);
    return engine;
  } catch (err) {
    enginePromise = null;
    currentModelId = null;
    throw err;
  }
}

export async function deleteOfflineModel(modelId: string): Promise<void> {
  const { deleteModelAllInfoInCache } = await import('@mlc-ai/web-llm');
  await deleteModelAllInfoInCache(modelId);
  unmarkDownloaded(modelId);
  if (currentModelId === modelId) {
    enginePromise = null;
    currentModelId = null;
  }
}

export interface StreamOptions {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export async function* streamWebLLMChat(
  modelId: string,
  messages: { role: string; content: string }[],
  opts: StreamOptions = {},
): AsyncGenerator<string, void, unknown> {
  const engine = await ensureEngine(modelId);
  const stream = await engine.chat.completions.create({
    messages: messages as any,
    stream: true,
    temperature: opts.temperature,
    top_p: opts.topP,
    max_tokens: opts.maxTokens && opts.maxTokens > 0 ? opts.maxTokens : undefined,
    presence_penalty: opts.presencePenalty,
    frequency_penalty: opts.frequencyPenalty,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content ?? '';
    if (delta) yield delta;
  }
}
