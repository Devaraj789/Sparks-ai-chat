export interface Project {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  messages: { id: string; role: 'user' | 'assistant'; content: string }[];
}

export interface CustomModel {
  id: string;
  name: string;
  model: string;
  baseUrl: string;
  apiKey: string;
}

export function loadProjects(): Project[] {
  try { return JSON.parse(localStorage.getItem('ai-chat-projects') || '[]'); } catch { return []; }
}

export function saveProjectsToStorage(projects: Project[]) {
  localStorage.setItem('ai-chat-projects', JSON.stringify(projects));
}

export function loadCustomModels(): CustomModel[] {
  try { return JSON.parse(localStorage.getItem('ai-chat-custom-models') || '[]'); } catch { return []; }
}

export function saveCustomModelsToStorage(models: CustomModel[]) {
  localStorage.setItem('ai-chat-custom-models', JSON.stringify(models));
}

const PERSONAL_KEY_STORAGE = 'ai-chat-personal-openrouter-key';

export function loadPersonalOpenRouterKey(): string {
  try { return localStorage.getItem(PERSONAL_KEY_STORAGE) || ''; } catch { return ''; }
}

export function savePersonalOpenRouterKey(key: string) {
  if (key.trim()) localStorage.setItem(PERSONAL_KEY_STORAGE, key.trim());
  else localStorage.removeItem(PERSONAL_KEY_STORAGE);
}
