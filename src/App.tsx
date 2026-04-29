import { useState, useEffect, useRef } from 'react';
import {
  fetchConversations, fetchMessages, createConversation,
  updateConversation, deleteConversation as apiDeleteConversation,
  createMessage, deleteMessage as apiDeleteMessage, streamChat,
  type Message, type Conversation,
} from './lib/api';
import { models } from './lib/models';
import { useModels } from './lib/useModels';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Settings, DEFAULT_SETTINGS, type AppSettings } from './components/Settings';
import { ModelsPage } from './components/ModelsPage';
import { ArtifactPanel } from './components/ArtifactPanel';
import {
  loadProjects, saveProjectsToStorage as saveProjects, loadPersonalOpenRouterKey, type Project,
} from './lib/projects';
import { streamWebLLMChat } from './lib/webllm';
import {
  SquarePen, Search, MessageSquare, Trash2, PenLine, Settings as SettingsIcon,
  PanelLeft, X, LayoutGrid, Link, Check as CheckIcon, Zap, FolderOpen,
} from 'lucide-react';

type View = 'models' | 'chat' | 'artifacts';

function App() {
  // Settings (persisted)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('ai-chat-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Free models (for ChatInput dropdown)
  const { models: freeModels } = useModels();

  // View state
  const [view, setView] = useState<View>('models');
  const [urlCopied, setUrlCopied] = useState(false);

  // Chat state
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [contextWindow, setContextWindow] = useState<number | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  // Projects + Artifacts
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');
  const activeProject = activeProjectId ? projects.find(p => p.id === activeProjectId) ?? null : null;

  const updateProjects = (next: Project[]) => { setProjects(next); saveProjects(next); };

  const loadProject = (id: string) => {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    setActiveProjectId(id);
    setMessages(p.messages.map(m => ({ id: m.id, role: m.role, content: m.content })) as Message[]);
    setSelectedModel(p.model);
    setCurrentConversation(null);
    setView('chat');
    setShowArtifacts(false);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const createProject = () => {
    const name = window.prompt('Project name:');
    if (!name?.trim()) return;
    const sysPrompt = window.prompt('System prompt for this project (optional):') ?? '';
    const p: Project = {
      id: crypto.randomUUID(),
      name: name.trim(),
      model: selectedModel,
      systemPrompt: sysPrompt,
      messages: [],
      createdAt: Date.now(),
    };
    updateProjects([...projects, p]);
    loadProject(p.id);
  };

  const deleteProject = (id: string) => {
    if (!confirm('Delete this project?')) return;
    updateProjects(projects.filter(p => p.id !== id));
    if (activeProjectId === id) { setActiveProjectId(null); setMessages([]); }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Apply theme from settings
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.matches) root.classList.add('dark');
      else root.classList.remove('dark');
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { loadConversations(); }, []);

  const loadConversations = async () => {
    try { setConversations(await fetchConversations()); } catch {}
  };

  const loadConversation = async (id: string) => {
    try {
      const data = await fetchMessages(id);
      setMessages(data);
      setCurrentConversation(id);
      setView('chat');
      const conv = conversations.find(c => c.id === id);
      if (conv) setSelectedModel(conv.model);
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    } catch {}
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversation(null);
    setActiveProjectId(null);
    setView('chat');
    if (window.innerWidth < 768) {
      setShowSidebar(true);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.origin);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleChatWithModel = (modelId: string, ctxLength: number) => {
    setSelectedModel(modelId);
    setContextWindow(ctxLength);
    setMessages([]);
    setCurrentConversation(null);
    setView('chat');
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const deleteConversation = async (id: string) => {
    try {
      await apiDeleteConversation(id);
      await loadConversations();
      if (currentConversation === id) startNewChat();
    } catch {}
  };

  const renameConversation = async (id: string, title: string) => {
    if (!title.trim()) return;
    try {
      await updateConversation(id, title);
      await loadConversations();
      setRenamingId(null);
    } catch {}
  };

  const deleteMessageItem = async (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    if (currentConversation) {
      try { await apiDeleteMessage(messageId); } catch {}
    }
  };

  const handleSaveSettings = (s: AppSettings) => {
    setSettings(s);
    localStorage.setItem('ai-chat-settings', JSON.stringify(s));
  };

  const exportConversations = () => {
    const data = JSON.stringify({ conversations, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `ai-chat-export-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllHistory = async () => {
    if (!confirm('Delete all conversations? This cannot be undone.')) return;
    for (const c of conversations) {
      try { await apiDeleteConversation(c.id); } catch {}
    }
    setConversations([]);
    startNewChat();
  };

  const fontSizeClass = settings.fontSize === 'sm' ? 'text-xs' : settings.fontSize === 'lg' ? 'text-base' : 'text-sm';

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Auto-retry chat with model fallback ──────────────────────────────────
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const inProject = !!activeProject;
    let conversationId = currentConversation;
    if (!inProject && !conversationId) {
      try {
        const newConv = await createConversation(content.slice(0, 60), selectedModel);
        conversationId = newConv.id;
        setCurrentConversation(conversationId);
        await loadConversations();
      } catch { return; }
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    if (!inProject) { try { await createMessage(conversationId!, 'user', content); } catch {} }

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    // Build message history with optional system prompt + language instruction
    const msgHistory = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    const langMap: Record<string, string> = { english: 'English', tamil: 'Tamil', hindi: 'Hindi' };
    const langInstruction = settings.language && settings.language !== 'auto'
      ? `Respond only in ${langMap[settings.language]}.` : '';
    const projectSys = activeProject?.systemPrompt ?? '';
    const sysContent = [langInstruction, projectSys || settings.systemPrompt].filter(Boolean).join('\n');
    if (sysContent) msgHistory.unshift({ role: 'system', content: sysContent });

    // Lookup credentials:
    // 1. If a custom model is selected → use its own apiKey + baseUrl
    // 2. Else if user set a Personal OpenRouter Key → use that for all listed models
    // 3. Else fall back to the server's shared OPENROUTER_API_KEY
    const customMeta = freeModels.find(m => m.id === selectedModel && m.custom);
    const personalKey = loadPersonalOpenRouterKey();
    const customCreds = customMeta
      ? { apiKey: customMeta.apiKey || personalKey || undefined, baseUrl: customMeta.baseUrl }
      : (personalKey ? { apiKey: personalKey } : undefined);

    // Try models in order — skip silently on 429 rate-limit
    const modelQueue = [
      selectedModel,
      ...models.filter(m => m.id !== selectedModel).map(m => m.id),
    ];

    let usedModel: string | null = null;

    // Detect offline model — runs locally in browser via WebGPU, no fallback
    const offlineMeta = freeModels.find(m => m.id === selectedModel && m.offline);

    for (let i = 0; i < modelQueue.length; i++) {
      const modelId = modelQueue[i];
      try {
        let fullResponse = '';

        if (offlineMeta && i === 0) {
          // Local in-browser inference — no network, no fallback to cloud models
          for await (const delta of streamWebLLMChat(modelId, msgHistory, {
            temperature: settings.temperature,
            topP: settings.topP,
            maxTokens: settings.maxTokens,
            presencePenalty: settings.presencePenalty,
            frequencyPenalty: settings.frequencyPenalty,
          })) {
            fullResponse += delta;
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: fullResponse } : m
            ));
          }
        } else {
          if (offlineMeta) break; // don't fall back from offline to online
          const stream = await streamChat(modelId, msgHistory, {
            temperature: settings.temperature,
            topP: settings.topP,
            maxTokens: settings.maxTokens,
            presencePenalty: settings.presencePenalty,
            frequencyPenalty: settings.frequencyPenalty,
          }, customCreds);

          const reader = stream.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  fullResponse += delta;
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId ? { ...m, content: fullResponse } : m
                  ));
                }
              } catch {}
            }
          }
        }

        usedModel = modelId;
        if (!inProject && conversationId && fullResponse) {
          await createMessage(conversationId, 'assistant', fullResponse);
        }
        if (inProject && fullResponse && activeProjectId) {
          const updated = projects.map(p => p.id === activeProjectId
            ? { ...p, model: modelId, messages: [
                ...p.messages,
                { id: userMsg.id, role: 'user' as const, content },
                { id: assistantId, role: 'assistant' as const, content: fullResponse },
              ] }
            : p);
          updateProjects(updated);
        }
        break; // success — stop trying

      } catch (err: any) {
        if ((err as any).statusCode === 429 && i < modelQueue.length - 1) {
          // Rate-limited — silently try next model
          continue;
        }
        // Final error
        const msg = err?.message ?? 'Something went wrong. Please try again.';
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: `⚠️ ${msg}` } : m
        ));
        break;
      }
    }

    // If we fell back to a different model, update the selector
    if (usedModel && usedModel !== selectedModel) {
      setSelectedModel(usedModel);
    }

    setIsLoading(false);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={`flex h-screen bg-surface text-text-primary overflow-hidden ${fontSizeClass}`}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      {showSidebar && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setShowSidebar(false)}
        />
      )}
      <aside
        className={`${showSidebar ? 'w-full sm:w-56 fixed sm:relative inset-y-0 left-0 z-50 sm:z-auto' : 'w-0'} flex-shrink-0 transition-all duration-200 overflow-hidden border-r border-border bg-surface-2 flex flex-col`}
      >
        {/* Logo + close (mobile) */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0 flex items-center justify-between">
          <span className="font-mono font-bold text-base tracking-tight text-text-primary select-none">
            AI Chat
          </span>
          <button
            onClick={() => setShowSidebar(false)}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <div className="px-1.5 sm:px-2 space-y-0.5 flex-shrink-0">
          <button
            onClick={() => { setView('models'); if (window.innerWidth < 640) setShowSidebar(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${view === 'models' ? 'bg-surface-3 text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'}`}
          >
            <LayoutGrid size={14} className="flex-shrink-0" />
            <span>Models</span>
          </button>
          <button
            onClick={() => { startNewChat(); if (window.innerWidth < 640) setShowSidebar(false); }}
            data-testid="button-new-chat"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${view === 'chat' && !currentConversation ? 'bg-surface-3 text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'}`}
          >
            <SquarePen size={14} className="flex-shrink-0" />
            <span>New chat</span>
          </button>
          <button
            onClick={() => setShowSearch(v => !v)}
            data-testid="button-search"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
          >
            <Search size={14} className="flex-shrink-0" />
            <span>Search</span>
          </button>
          <button
            onClick={() => { setView('artifacts'); if (window.innerWidth < 640) setShowSidebar(false); }}
            data-testid="button-artifacts"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${view === 'artifacts' ? 'bg-surface-3 text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'}`}
          >
            <Zap size={14} className="flex-shrink-0" />
            <span>Artifacts</span>
          </button>
        </div>

        {/* Search input */}
        {showSearch && (
          <div className="px-1.5 sm:px-2 mt-1 animate-fade-in">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full px-2 sm:px-3 py-1.5 text-xs rounded-xl border border-border bg-surface placeholder-text-muted text-text-primary focus:outline-none focus:border-accent/40 transition-colors"
            />
          </div>
        )}

        {/* Projects */}
        <div className="mt-4 px-2 sm:px-3 mb-1 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-text-muted">Projects</span>
          <button
            onClick={createProject}
            title="New project"
            className="text-text-muted hover:text-accent transition-colors"
          >
            <SquarePen size={11} />
          </button>
        </div>
        <div className="px-1.5 sm:px-2 mb-2 flex-shrink-0 max-h-32 overflow-y-auto space-y-0.5">
          {projects.length === 0 ? (
            <p className="text-xs text-text-muted px-3 py-1.5">No projects</p>
          ) : projects.map(p => (
            <div
              key={p.id}
              className={`group rounded-xl flex items-center gap-2 px-2 sm:px-3 py-1.5 cursor-pointer transition-colors ${activeProjectId === p.id ? 'bg-surface-3' : 'hover:bg-surface-3'}`}
              onClick={() => loadProject(p.id)}
            >
              <FolderOpen size={11} className="flex-shrink-0 text-text-muted" />
              <span className="text-xs truncate flex-1 text-text-primary">{p.name}</span>
              <button
                onClick={e => { e.stopPropagation(); deleteProject(p.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-surface-2 text-text-muted hover:text-red-400 transition-opacity flex-shrink-0"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Conversations */}
        <div className="mt-2 px-2 sm:px-3 mb-1 flex-shrink-0">
          <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-text-muted">Chats</span>
        </div>

        <div className="flex-1 overflow-y-auto px-1.5 sm:px-2 pb-2 space-y-0.5">
          {filteredConversations.length === 0 ? (
            <p className="text-xs text-text-muted px-3 py-3">No chats</p>
          ) : filteredConversations.map(conv => (
            <div
              key={conv.id}
              className={`group rounded-xl transition-colors ${currentConversation === conv.id ? 'bg-surface-3' : 'hover:bg-surface-3'}`}
            >
              {renamingId === conv.id ? (
                <div className="flex gap-1 p-2">
                  <input
                    value={renameText}
                    onChange={e => setRenameText(e.target.value)}
                    autoFocus
                    className="flex-1 px-2 py-1 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent/40"
                    onKeyDown={e => {
                      if (e.key === 'Enter') renameConversation(conv.id, renameText);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                  />
                  <button onClick={() => renameConversation(conv.id, renameText)} className="text-[10px] px-1.5 bg-accent text-white rounded-lg flex-shrink-0">OK</button>
                </div>
              ) : (
                <div
                  onClick={() => loadConversation(conv.id)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-2 cursor-pointer"
                >
                  <MessageSquare size={11} className="flex-shrink-0 text-text-muted" />
                  <span className="text-xs truncate flex-1 text-text-primary">{conv.title}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); setRenamingId(conv.id); setRenameText(conv.title); }}
                      className="p-1 rounded-md hover:bg-surface-2 text-text-muted hover:text-text-primary"
                    >
                      <PenLine size={10} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                      className="p-1 rounded-md hover:bg-surface-2 text-text-muted hover:text-red-400"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Top bar */}
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2.5 z-10 bg-surface/80 backdrop-blur-sm">
          <button
            onClick={() => {
              if (currentConversation && window.innerWidth < 768) {
                setShowSidebar(true);
              } else {
                setShowSidebar(v => !v);
              }
            }}
            data-testid="button-sidebar-toggle"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            {showSidebar ? <X size={16} /> : <PanelLeft size={16} />}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyUrl}
              title="Copy app URL"
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              {urlCopied ? <CheckIcon size={13} className="text-green-500" /> : <Link size={13} />}
              <span className="hidden sm:inline text-[11px]">{urlCopied ? 'Copied!' : 'Copy URL'}</span>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              data-testid="button-settings"
              className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              <SettingsIcon size={16} />
            </button>
          </div>
        </header>

        {/* ── Models view ───────────────────────────────────────────────── */}
        {view === 'models' ? (
          <div className="flex-1 flex flex-col pt-12 overflow-hidden">
            <ModelsPage onChatWithModel={handleChatWithModel} />
          </div>
        ) : view === 'artifacts' ? (
          <div className="flex-1 flex flex-col pt-12 overflow-hidden">
            <ArtifactPanel
              projects={projects}
              activeProjectId={activeProjectId}
              onLoadProject={(id) => { loadProject(id); setView('chat'); }}
              onCreateProject={createProject}
              onDeleteProject={deleteProject}
              onPromptSelect={(text) => { setPendingPrompt(text); setView('chat'); }}
            />
          </div>
        ) : messages.length === 0 ? (
          /* ── Chat empty state: input centered ────────────────────────── */
          <div className="flex-1 flex items-center justify-center px-3 sm:px-4 pt-14 pb-4">
            <div className="w-full max-w-md sm:max-w-2xl lg:max-w-3xl">
              <div className="text-center mb-8 sm:mb-10">
                <h1 className="font-mono font-bold text-2xl sm:text-3xl tracking-tight text-text-primary mb-2">AI Chat</h1>
                <p className="text-xs sm:text-sm text-text-muted">Type a message to get started</p>
              </div>
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isLoading}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                contextWindow={contextWindow}
                freeModels={freeModels}
                language={settings.language}
                prefillText={pendingPrompt}
              />
              <p className="text-center text-[10px] sm:text-[11px] text-text-muted mt-2">
                <span className="hidden sm:inline">Press <kbd className="px-1 py-0.5 rounded bg-surface-3 border border-border font-mono text-[10px]">Enter</kbd> to send</span>
                <span className="sm:hidden">Tap send button</span>
              </p>
            </div>
          </div>
        ) : (
          /* ── Chat: messages + bottom input ───────────────────────────── */
          <>
            <div className="flex-1 overflow-y-auto pt-14 pb-2">
              <div className="max-w-3xl mx-auto w-full py-6 space-y-1 px-4">
                {messages.map(message => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    messageId={message.id}
                    onDelete={deleteMessageItem}
                  />
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>
            <div className="flex-shrink-0 border-t border-border bg-surface px-3 sm:px-4 py-3">
              <div className="max-w-md sm:max-w-2xl lg:max-w-3xl mx-auto">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  disabled={isLoading}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  contextWindow={contextWindow}
                  freeModels={freeModels}
                  language={settings.language}
                  prefillText={pendingPrompt}
                />
                <p className="text-center text-[10px] sm:text-[11px] text-text-muted mt-2">
                  <span className="hidden sm:inline">Press <kbd className="px-1 py-0.5 rounded bg-surface-3 border border-border font-mono text-[10px]">Enter</kbd> to send</span>
                  <span className="sm:hidden">Tap send button</span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Settings modal ───────────────────────────────────────────────── */}
      {settingsOpen && (
        <Settings
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
          onExport={exportConversations}
          onClearHistory={clearAllHistory}
        />
      )}

    </div>
  );
}

export default App;
