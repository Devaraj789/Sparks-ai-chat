import { Bot, User, Copy, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { CodePreviewPanel, InlinePreviewActions, isPreviewable, isPython } from './CodePreview';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  messageId?: string;
  onDelete?: (id: string) => void;
}

interface CodeBlock {
  lang: string;
  code: string;
}

function extractThinking(raw: string): { thinking: string; answer: string } {
  const matches: string[] = [];
  const cleaned = raw.replace(/<(think|thinking)>([\s\S]*?)<\/\1>/gi, (_, _tag, content) => {
    matches.push(content.trim());
    return '';
  });
  return { thinking: matches.join('\n\n').trim(), answer: cleaned.trim() };
}

function extractCodeBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ lang: (match[1] ?? '').toLowerCase(), code: match[2]?.trim() ?? '' });
  }
  return blocks;
}

function hasMarkdownTable(text: string): boolean {
  return /\|.+\|/.test(text) && /\|-+\|/.test(text);
}

function highlightCode(raw: string, lang: string): string {
  let h = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (['html', 'xml', 'jsx', 'tsx'].includes(lang))
    h = h.replace(/(&lt;\/?[\w][\w:-]*)/g, '<span style="color:#f07178">$1</span>');
  h = h.replace(/(["'`])([^"'`\n]*?)\1/g, '<span style="color:#c3e88d">$1$2$1</span>');
  h = h.replace(/(\/\/[^\n]*)/g, '<span style="color:#546e7a;font-style:italic">$1</span>');
  if (['python', 'py', 'bash', 'sh'].includes(lang))
    h = h.replace(/(#[^\n]*)/g, '<span style="color:#546e7a;font-style:italic">$1</span>');
  h = h.replace(/\b(if|else|elif|for|while|function|return|const|let|var|import|export|from|default|class|extends|new|this|typeof|instanceof|try|catch|finally|throw|async|await|def|lambda|print|True|False|None|and|or|not|in|is|pass|break|continue|yield)\b/g,
    '<span style="color:#c792ea">$1</span>');
  h = h.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f78c6c">$1</span>');
  return h;
}

function parseMarkdown(text: string): string {
  const codeBlocks: Array<{lang: string; code: string}> = [];
  let t = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push({ lang: (lang || '').toLowerCase(), code: code.trim() });
    return `\x00CB${idx}\x00`;
  });
  t = t
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code style="background:#1e1e2e;padding:2px 5px;border-radius:4px;font-size:0.85em;color:#cdd6f4">$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^\> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\s*[-*+] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\s*\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hH\d]|<ul|<ol|<li|<pre|<block|<hr|\x00)(.+)$/gm, (m) =>
      m.startsWith('<') ? m : `<p>${m}</p>`)
    .replace(/<p><\/p>/g, '');
  t = t.replace(/\x00CB(\d+)\x00/g, (_m, i) => {
    const { lang, code } = codeBlocks[+i];
    return `<pre style="background:#1e1e2e;border-radius:10px;margin:10px 0;max-height:400px;overflow-y:auto"><code class="language-${lang}" style="display:block;padding:12px;font-size:0.875rem;tab-size:2;white-space:pre;color:#cdd6f4;font-family:monospace;line-height:1.6">${highlightCode(code, lang)}</code></pre>`;
  });
  return t;
}

export function ChatMessage({ role, content, messageId, onDelete }: ChatMessageProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { thinking, answer } = useMemo(() => extractThinking(content), [content]);
  const displayContent = answer || content;
  const codeBlocks = useMemo(() => extractCodeBlocks(displayContent), [displayContent]);
  const previewableBlocks = useMemo(
    () => codeBlocks.filter(b => isPreviewable(b.lang) || isPython(b.lang)),
    [codeBlocks]
  );
  const hasTable = useMemo(() => hasMarkdownTable(displayContent), [displayContent]);
  const showActions = previewableBlocks.length > 0 || hasTable;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-2 animate-fade-in group">
        <div className="flex items-end gap-2 max-w-[80%]">
          <div className="flex flex-col items-end gap-1">
            <div className="px-4 py-3 rounded-2xl rounded-br-sm bg-accent text-white text-sm leading-relaxed shadow-sm">
              {content}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {messageId && onDelete && (
                <button
                  onClick={() => onDelete(messageId)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center mb-6">
            <User size={14} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 px-4 py-2 animate-fade-in group">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-surface-3 border border-border flex items-center justify-center mt-0.5">
          <Bot size={14} className="text-accent" />
        </div>

        <div className="flex-1 min-w-0">
          {/* ── Thinking section ─────────────────────────────────────── */}
          {thinking && (
            <div className="mb-3 rounded-xl border border-border bg-surface-2 overflow-hidden">
              <button
                onClick={() => setThinkingOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span>💭</span>
                  <span className="font-medium">Thinking</span>
                </span>
                {thinkingOpen
                  ? <ChevronUp size={12} />
                  : <ChevronDown size={12} />}
              </button>
              {thinkingOpen && (
                <div className="px-3 pb-3 border-t border-border">
                  <p className="text-xs text-text-muted italic leading-relaxed whitespace-pre-wrap mt-2">
                    {thinking}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Main answer ──────────────────────────────────────────── */}
          <div className={`text-sm text-text-primary prose-message ${!displayContent ? 'flex items-center gap-1' : ''}`}>
            {!displayContent ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: parseMarkdown(displayContent) }} />
            )}
          </div>

          {/* ── Preview / download actions ────────────────────────────── */}
          {displayContent && showActions && (
            <InlinePreviewActions
              blocks={previewableBlocks}
              hasTable={hasTable}
              onPreview={() => setPreviewOpen(true)}
            />
          )}

          {/* ── Message actions ──────────────────────────────────────── */}
          {displayContent && (
            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {messageId && onDelete && (
                <button
                  onClick={() => onDelete(messageId)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Live preview side panel ───────────────────────────────────── */}
      {previewOpen && previewableBlocks.length > 0 && (
        <CodePreviewPanel
          blocks={previewableBlocks}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
