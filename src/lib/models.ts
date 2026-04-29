export interface Model {
  id: string;
  name: string;
  description: string;
  category: 'fast' | 'balanced' | 'powerful' | 'creative' | 'vision';
  badge?: string;
}

export const models: Model[] = [
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "Nemotron 120B",
    description: "Code Master",
    category: "powerful",
    badge: "Best for Code"
  },
  {
    id: "nvidia/nemotron-3-nano-30b-a3b:free",
    name: "Nemotron 30B",
    description: "Quick & Smart",
    category: "fast",
    badge: "Recommended"
  },
];

export const categoryLabels: Record<Model['category'], string> = {
  fast: "⚡ Fast",
  balanced: "⚖️ Balanced",
  powerful: "🔥 Powerful",
  creative: "✨ Creative",
  vision: "👁️ Vision",
};

/** Strip provider prefix and "(free)" from API model names */
export function cleanModelName(rawName: string): string {
  let name = rawName;
  // Remove "Provider: " prefix (e.g. "Google: ", "Arcee AI: ")
  name = name.replace(/^[^:]+:\s+/, '');
  // Remove "(free)" suffix
  name = name.replace(/\s*\(free\)\s*/gi, '').trim();
  return name;
}

/** Emoji badges for a model based on its ID and optional context length */
export function getModelBadges(id: string, contextLength?: number): string[] {
  const s = id.toLowerCase();
  const badges: string[] = [];
  if (/r1|qwq|thinking/.test(s)) badges.push('🧠');
  if (/code|coder/.test(s)) badges.push('💻');
  if (/[\/-]vl[\/-:]|vision/.test(s)) badges.push('👁️');
  if (/gemma|llama|mistral|qwen|aya|command/.test(s)) badges.push('🇹🇳');
  if (contextLength !== undefined) {
    if (contextLength < 32_000) badges.push('⚡');
    if (contextLength > 100_000) badges.push('🔥');
  }
  return badges;
}

/** True if model is likely to support Tamil well */
export function isTamilModel(id: string): boolean {
  return /gemma|llama|mistral|qwen|aya|command/.test(id.toLowerCase());
}
