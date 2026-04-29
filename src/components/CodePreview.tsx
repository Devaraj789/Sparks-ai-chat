import { useState } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface CodeBlock {
  lang: string;
  code: string;
}

function buildPreviewHtml(lang: string, code: string): string {
  const defaultStyle = `<style>
body{font-family:'Segoe UI',sans-serif;background:#f8f9ff;color:#1a1a2e;padding:24px;margin:0}
button{background:#6366f1;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer}
input,select{border:1px solid #d1d5db;padding:8px 12px;border-radius:6px;width:100%;margin:4px 0}
h1,h2,h3{color:#4f46e5}
.card{background:white;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.1);margin:8px 0}
</style>`;
  const injectedHTML = code.includes('<style>') ? code : defaultStyle + code;
  const base = `<meta charset="utf-8">`;
  if (lang === 'html') {
    if (code.includes('<!DOCTYPE') || code.includes('<html')) return injectedHTML;
    return `<!DOCTYPE html><html><head>${base}</head><body>${injectedHTML}</body></html>`;
  }
  if (lang === 'css') {
    return `<!DOCTYPE html><html><head>${base}<style>${code}</style></head><body>
      <div style="padding:16px">
        <h3 style="color:#888;font-size:12px;margin:0 0 8px">CSS Preview</h3>
        <div class="preview-target">Preview element</div>
      </div>
    </body></html>`;
  }
  if (lang === 'javascript' || lang === 'js') {
    return `<!DOCTYPE html><html><head>${base}</head><body>
      <div id="output" style="padding:16px;font-family:monospace;font-size:13px;"></div>
      <script>
        const output = document.getElementById('output');
        const log = (...args) => {
          const line = document.createElement('div');
          line.textContent = args.join(' ');
          output.appendChild(line);
        };
        const origLog = console.log;
        console.log = (...args) => { log(...args); origLog(...args); };
        try { ${code} } catch(e) { log('Error: ' + e.message); }
      <\/script>
    </body></html>`;
  }
  if (lang === 'jsx' || lang === 'tsx' || lang === 'react') {
    return `<!DOCTYPE html><html><head>${base}
      <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
    </head><body>
      <div id="root" style="padding:16px"></div>
      <script type="text/babel">
        ${code}
        const rootEl = document.getElementById('root');
        if (typeof App !== 'undefined') {
          ReactDOM.createRoot(rootEl).render(React.createElement(App));
        } else if (typeof default_1 !== 'undefined') {
          ReactDOM.createRoot(rootEl).render(React.createElement(default_1));
        }
      <\/script>
    </body></html>`;
  }
  return '';
}

function downloadPython(code: string) {
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'code.py';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCode(codeContent: string, filename: string) {
  const blob = new Blob([codeContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF() {
  window.print();
}

export function isPreviewable(lang: string): boolean {
  return ['html', 'css', 'js', 'javascript', 'jsx', 'tsx', 'react'].includes(lang.toLowerCase());
}

export function isPython(lang: string): boolean {
  return ['python', 'py'].includes(lang.toLowerCase());
}

interface CodePreviewPanelProps {
  blocks: CodeBlock[];
  onClose: () => void;
}

export function CodePreviewPanel({ blocks, onClose }: CodePreviewPanelProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const block = blocks[activeIdx];
  const lang = block?.lang?.toLowerCase() ?? '';
  const previewHtml = isPreviewable(lang) ? buildPreviewHtml(lang, block.code) : '';
  const downloadName = isPython(lang)
    ? 'code.py'
    : lang === 'css'
    ? 'code.css'
    : lang === 'json'
    ? 'code.json'
    : 'code.html';

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex flex-col bg-surface border-l border-border shadow-2xl"
      style={{ width: 'min(50vw, 700px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <ExternalLink size={14} className="text-accent" />
          <span className="text-sm font-medium text-text-primary">Live Preview</span>
        </div>
        <div className="flex items-center gap-2">
          {isPython(lang) && (
            <button
              onClick={() => downloadPython(block.code)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-border transition-colors"
            >
              <Download size={12} />
              Download .py
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Tab bar if multiple blocks */}
      {blocks.length > 1 && (
        <div className="flex gap-1 px-4 pt-2 border-b border-border flex-shrink-0 overflow-x-auto pb-2">
          {blocks.map((b, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`px-3 py-1 rounded-lg text-xs flex-shrink-0 transition-colors ${
                i === activeIdx
                  ? 'bg-accent text-white'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary'
              }`}
            >
              {b.lang || 'code'} {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Preview area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {blocks.some(b => isPreviewable(b.lang)) ? (
          <>
            <iframe
              srcDoc={previewHtml}
              sandbox="allow-scripts allow-same-origin"
              className="w-full flex-1 border-0 bg-white"
              title="code-preview"
            />
            <div className="flex-shrink-0 px-4 py-2 border-t border-border bg-surface-2">
              <button
                onClick={() => {
                  const blob = new Blob([block.code], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `code.${lang === 'python' || lang === 'py' ? 'py' : lang === 'css' ? 'css' : 'html'}`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="mt-2 px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                ⬇️ Download .{lang === 'python' || lang === 'py' ? 'py' : lang === 'css' ? 'css' : 'html'}
              </button>
            </div>
          </>
        ) : isPython(lang) ? (
          <div className="p-4 h-full overflow-y-auto">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-text-muted">Python — no browser runtime available</span>
            </div>
            <pre className="text-sm text-text-primary bg-surface-2 p-4 rounded-xl overflow-x-auto border border-border font-mono">
              {block.code}
            </pre>
            <button
              onClick={() => downloadCode(block.code, downloadName)}
              className="mt-2 flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-surface-2 text-text-secondary hover:text-text-primary border border-border transition-colors"
            >
              <Download size={11} />
              Download .py
            </button>
          </div>
        ) : (
          <div className="p-4 h-full overflow-y-auto">
            <pre className="text-sm text-text-primary bg-surface-2 p-4 rounded-xl overflow-x-auto border border-border font-mono">
              {block.code}
            </pre>
            <button
              onClick={() => downloadCode(block.code, downloadName)}
              className="mt-2 flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-surface-2 text-text-secondary hover:text-text-primary border border-border transition-colors"
            >
              <Download size={11} />
              {isPreviewable(lang) ? 'Download .html' : lang === 'json' ? 'Download .json' : 'Download file'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface InlinePreviewActionsProps {
  blocks: CodeBlock[];
  hasTable: boolean;
  onPreview: () => void;
}

export function InlinePreviewActions({ blocks, hasTable, onPreview }: InlinePreviewActionsProps) {
  const previewable = blocks.filter(b => isPreviewable(b.lang));
  const pythonBlocks = blocks.filter(b => isPython(b.lang));

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {previewable.length > 0 && (
        <button
          onClick={onPreview}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors font-medium"
        >
          <ExternalLink size={11} />
          Preview
        </button>
      )}
      {pythonBlocks.map((b, i) => (
        <button
          key={i}
          onClick={() => downloadPython(b.code)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 text-text-secondary hover:text-text-primary border border-border transition-colors"
        >
          <Download size={11} />
          Download .py
        </button>
      ))}
      {hasTable && (
        <button
          onClick={downloadPDF}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 text-text-secondary hover:text-text-primary border border-border transition-colors"
        >
          <Download size={11} />
          Download PDF
        </button>
      )}
    </div>
  );
}
