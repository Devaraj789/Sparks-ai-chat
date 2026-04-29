import { useState } from 'react';
import { ChevronLeft, Plus, Trash2, FolderOpen } from 'lucide-react';
import type { Project } from '../lib/projects';

type Tab = 'games' | 'creative' | 'projects' | 'prompts';

const GAMES = [
  {
    title: 'Tic-Tac-Toe',
    emoji: '⭕',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0f0f1a;display:flex;flex-direction:column;align-items:center;padding:20px;margin:0;font-family:sans-serif;color:#fff}.board{display:grid;grid-template-columns:repeat(3,72px);gap:6px;margin:10px 0}.cell{width:72px;height:72px;background:#1a1a2e;border:2px solid #2a2a4a;font-size:1.8em;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:.15s}.cell:hover{background:#252545}#msg{font-size:13px;margin:6px 0}button{padding:6px 16px;background:#6366f1;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:13px}</style></head><body><h3 style="margin:0 0 4px;font-size:15px">Tic-Tac-Toe</h3><div id="msg">X's turn</div><div class="board" id="b"></div><button onclick="init()">Reset</button><script>let g=Array(9).fill(''),p='X',done=false;const W=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];function render(){document.getElementById('b').innerHTML=g.map((v,i)=>\`<div class="cell" onclick="go(\${i})">\${v}</div>\`).join('')}function go(i){if(g[i]||done)return;g[i]=p;let w=W.find(r=>r.every(x=>g[x]===p));if(w){document.getElementById('msg').textContent=p+' wins! 🎉';done=true}else if(g.every(v=>v)){document.getElementById('msg').textContent='Draw!';done=true}else{p=p==='X'?'O':'X';document.getElementById('msg').textContent=p+"'s turn"}render()}function init(){g=Array(9).fill('');p='X';done=false;document.getElementById('msg').textContent="X's turn";render()}init();<\/script></body></html>`,
  },
  {
    title: 'Snake',
    emoji: '🐍',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0f0f1a;display:flex;flex-direction:column;align-items:center;padding:14px;margin:0;font-family:sans-serif;color:#fff}canvas{border:2px solid #6366f1;border-radius:4px;display:block}#s{font-size:12px;margin:4px 0}button{padding:5px 14px;background:#6366f1;border:none;color:#fff;border-radius:6px;cursor:pointer;margin-top:6px;font-size:12px}</style></head><body><div id="s">Score: 0 — Arrow keys / WASD</div><canvas id="c" width="220" height="220"></canvas><button onclick="start()">Start</button><script>const C=document.getElementById('c'),ctx=C.getContext('2d'),N=20,SZ=11;let s,d,nd,f,sc,iv;function start(){s=[{x:10,y:10}];d={x:1,y:0};nd={x:1,y:0};f=rnd();sc=0;clearInterval(iv);iv=setInterval(step,130);draw()}function rnd(){return{x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}}function step(){d=nd;let h={x:s[0].x+d.x,y:s[0].y+d.y};if(h.x<0||h.x>=N||h.y<0||h.y>=N||s.some(p=>p.x===h.x&&p.y===h.y)){clearInterval(iv);ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,220,220);ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText('Game Over: '+sc,110,110);return}s.unshift(h);if(h.x===f.x&&h.y===f.y){sc++;f=rnd();document.getElementById('s').textContent='Score: '+sc}else s.pop();draw()}function draw(){ctx.fillStyle='#0f0f1a';ctx.fillRect(0,0,220,220);ctx.fillStyle='#22c55e';s.forEach(p=>{ctx.fillRect(p.x*SZ,p.y*SZ,SZ-1,SZ-1)});ctx.fillStyle='#f87171';ctx.fillRect(f.x*SZ,f.y*SZ,SZ-1,SZ-1)}document.addEventListener('keydown',e=>{const k={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},KeyW:{x:0,y:-1},KeyS:{x:0,y:1},KeyA:{x:-1,y:0},KeyD:{x:1,y:0}};if(k[e.code]&&!(k[e.code].x===-d.x&&k[e.code].y===-d.y)){nd=k[e.code];e.preventDefault()}});<\/script></body></html>`,
  },
  {
    title: 'Pong',
    emoji: '🏓',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;color:#fff;font-family:sans-serif}canvas{border:1px solid #222;display:block}p{margin:4px 0;font-size:11px;color:#666}</style></head><body><canvas id="c" width="280" height="190"></canvas><p>Move mouse over canvas to control left paddle</p><script>const c=document.getElementById('c'),ctx=c.getContext('2d');let b={x:140,y:95,vx:2.5,vy:1.5},p1=65,p2=65,s1=0,s2=0;c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect();p1=Math.min(130,Math.max(0,e.clientY-r.top-30))});function frame(){ctx.fillStyle='#000';ctx.fillRect(0,0,280,190);ctx.fillStyle='#fff';ctx.fillRect(8,p1,7,55);ctx.fillRect(265,p2,7,55);ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();ctx.font='15px monospace';ctx.textAlign='center';ctx.fillText(s1+':'+s2,140,15);b.x+=b.vx;b.y+=b.vy;if(b.y<5||b.y>185)b.vy*=-1;if(b.x<20&&b.y>p1&&b.y<p1+55){b.vx=Math.abs(b.vx)+.1;b.vy+=(b.y-p1-27)*.05}if(b.x>260&&b.y>p2&&b.y<p2+55){b.vx=-(Math.abs(b.vx)+.1);b.vy+=(b.y-p2-27)*.05}if(b.x<0){s2++;reset()}if(b.x>280){s1++;reset()}p2+=(b.y-p2-27)*.06;p2=Math.min(130,Math.max(0,p2));requestAnimationFrame(frame)}function reset(){b={x:140,y:95,vx:2.5*(Math.random()>.5?1:-1),vy:1.5*(Math.random()>.5?1:-1)}}frame();<\/script></body></html>`,
  },
  {
    title: 'Memory',
    emoji: '🃏',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0f0f1a;display:flex;flex-direction:column;align-items:center;padding:14px;margin:0;font-family:sans-serif;color:#fff}.grid{display:grid;grid-template-columns:repeat(4,56px);gap:5px;margin:10px 0}.card{width:56px;height:56px;background:#1a1a2e;border:2px solid #2a2a4a;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.6em;transition:.2s}.card.flip{background:#252560;border-color:#6366f1}.card.match{background:#1a3a1a;border-color:#22c55e;pointer-events:none}#msg{font-size:12px}button{padding:5px 13px;background:#6366f1;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px}</style></head><body><h3 style="margin:0 0 3px;font-size:14px">Memory Match</h3><div id="msg">Find all pairs!</div><div class="grid" id="g"></div><button onclick="init()">Reset</button><script>const EM=['🐱','🐶','🦊','🐸','🦁','🐯','🐻','🦄'];let cards,flipped,matched,lock;function init(){const e=[...EM,...EM].sort(()=>Math.random()-.5);cards=e.map((em,i)=>({id:i,em,fl:false,mt:false}));flipped=[];matched=0;lock=false;render();document.getElementById('msg').textContent='Find all pairs!'}function render(){document.getElementById('g').innerHTML=cards.map((c,i)=>\`<div class="card\${c.fl?' flip':''}\${c.mt?' match':''}" onclick="flip(\${i})">\${c.fl||c.mt?c.em:''}</div>\`).join('')}function flip(i){if(lock||cards[i].fl||cards[i].mt)return;cards[i].fl=true;flipped.push(i);render();if(flipped.length===2){lock=true;setTimeout(()=>{const[a,b]=flipped;if(cards[a].em===cards[b].em){cards[a].mt=cards[b].mt=true;matched++;if(matched===8)document.getElementById('msg').textContent='You won! 🎉'}else{cards[a].fl=cards[b].fl=false}flipped=[];lock=false;render()},700)}}init();<\/script></body></html>`,
  },
];

const CREATIVE = [
  {
    title: 'Color Picker',
    emoji: '🎨',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0f0f1a;display:flex;flex-direction:column;align-items:center;padding:20px;margin:0;font-family:sans-serif;color:#fff;gap:10px}#prev{width:150px;height:70px;border-radius:10px;border:2px solid #333;transition:.3s}input[type=range]{width:150px;accent-color:#6366f1}.row{display:flex;align-items:center;gap:8px}label{font-size:12px;width:14px}#hex{font-size:13px;letter-spacing:1px;padding:5px 10px;background:#1a1a2e;border:1px solid #333;border-radius:6px;color:#fff;text-align:center;width:90px}button{padding:5px 14px;background:#6366f1;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px}</style></head><body><h3 style="margin:0;font-size:14px">Color Picker</h3><div id="prev"></div><input id="hex" readonly value="#6366f1"><div class="row"><label>R</label><input type="range" id="r" min="0" max="255" value="99" oninput="upd()"></div><div class="row"><label>G</label><input type="range" id="g" min="0" max="255" value="102" oninput="upd()"></div><div class="row"><label>B</label><input type="range" id="b" min="0" max="255" value="241" oninput="upd()"></div><button onclick="copy()">Copy Hex</button><script>function upd(){const r=+document.getElementById('r').value,g=+document.getElementById('g').value,b=+document.getElementById('b').value;const h='#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');document.getElementById('prev').style.background=h;document.getElementById('hex').value=h}function copy(){navigator.clipboard?.writeText(document.getElementById('hex').value).then(()=>{const b=document.querySelector('button');b.textContent='Copied!';setTimeout(()=>b.textContent='Copy Hex',1500)})}upd();<\/script></body></html>`,
  },
  {
    title: 'Analog Clock',
    emoji: '🕐',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0f0f1a;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:#fff}</style></head><body><canvas id="c" width="200" height="200"></canvas><script>const c=document.getElementById('c'),ctx=c.getContext('2d');function draw(){const now=new Date(),h=now.getHours()%12,m=now.getMinutes(),s=now.getSeconds();ctx.clearRect(0,0,200,200);ctx.save();ctx.translate(100,100);ctx.beginPath();ctx.arc(0,0,88,0,Math.PI*2);ctx.fillStyle='#1a1a2e';ctx.fill();ctx.strokeStyle='#6366f1';ctx.lineWidth=3;ctx.stroke();for(let i=0;i<12;i++){ctx.save();ctx.rotate(i*Math.PI/6);ctx.fillStyle='#444';ctx.fillRect(-1,-88,2,8);ctx.restore()}ctx.save();ctx.rotate((h+m/60)*Math.PI/6);ctx.strokeStyle='#c3e88d';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(0,-52);ctx.stroke();ctx.restore();ctx.save();ctx.rotate((m+s/60)*Math.PI/30);ctx.strokeStyle='#c792ea';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,10);ctx.lineTo(0,-72);ctx.stroke();ctx.restore();ctx.save();ctx.rotate(s*Math.PI/30);ctx.strokeStyle='#f07178';ctx.lineWidth=1.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,14);ctx.lineTo(0,-80);ctx.stroke();ctx.restore();ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.restore()}setInterval(draw,1000);draw();<\/script></body></html>`,
  },
  {
    title: 'Calculator',
    emoji: '🔢',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0f0f1a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.calc{background:#1a1a2e;border-radius:14px;padding:16px;width:210px}#disp{background:#0a0a14;color:#c3e88d;font-size:1.3em;text-align:right;padding:8px 10px;border-radius:7px;margin-bottom:10px;min-height:1.8em;word-break:break-all;font-family:monospace}.btns{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}button{padding:10px;border:none;border-radius:7px;cursor:pointer;font-size:.9em;font-weight:600;transition:.1s}.n{background:#252545;color:#fff}.n:hover{background:#303060}.o{background:#6366f1;color:#fff}.e{background:#c792ea;color:#fff}.c{background:#f07178;color:#fff}</style></head><body><div class="calc"><div id="disp">0</div><div class="btns"><button class="c" onclick="clr()">C</button><button class="o" onclick="app('±')">±</button><button class="o" onclick="app('%')">%</button><button class="o" onclick="app('/')">÷</button><button class="n" onclick="app('7')">7</button><button class="n" onclick="app('8')">8</button><button class="n" onclick="app('9')">9</button><button class="o" onclick="app('*')">×</button><button class="n" onclick="app('4')">4</button><button class="n" onclick="app('5')">5</button><button class="n" onclick="app('6')">6</button><button class="o" onclick="app('-')">−</button><button class="n" onclick="app('1')">1</button><button class="n" onclick="app('2')">2</button><button class="n" onclick="app('3')">3</button><button class="o" onclick="app('+')">+</button><button class="n" style="grid-column:span 2" onclick="app('0')">0</button><button class="n" onclick="app('.')">.</button><button class="e" onclick="calc()">=</button></div></div><script>let x='';const d=document.getElementById('disp');function app(v){if(v==='±'){try{x=String(-eval(x))}catch{}d.textContent=x||'0';return}if(v==='%'){try{x=String(eval(x)/100)}catch{}d.textContent=x||'0';return}x+=v;d.textContent=x}function clr(){x='';d.textContent='0'}function calc(){try{x=String(eval(x.replace('÷','/').replace('×','*').replace('−','-')));d.textContent=x}catch{d.textContent='Err';x=''}}<\/script></body></html>`,
  },
  {
    title: 'Gradient Gen',
    emoji: '🌈',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0f0f1a;display:flex;flex-direction:column;align-items:center;padding:16px;margin:0;font-family:sans-serif;color:#fff;gap:8px}#prev{width:200px;height:80px;border-radius:10px;border:2px solid #333;transition:.4s}.row{display:flex;align-items:center;gap:8px;font-size:12px}input[type=color]{width:36px;height:28px;border:none;background:none;cursor:pointer;border-radius:4px}select{background:#1a1a2e;color:#fff;border:1px solid #333;padding:3px 6px;border-radius:5px;font-size:12px}#css{font-size:10px;background:#1a1a2e;padding:6px 8px;border-radius:6px;color:#c3e88d;width:200px;word-break:break-all;text-align:center}button{padding:4px 12px;background:#6366f1;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px}</style></head><body><h3 style="margin:0;font-size:14px">Gradient Gen</h3><div id="prev"></div><div class="row"><input type="color" id="c1" value="#6366f1" oninput="upd()"><span>→</span><input type="color" id="c2" value="#c792ea" oninput="upd()"><select id="dir" onchange="upd()"><option>to right</option><option>to bottom right</option><option>to bottom</option><option>135deg</option></select></div><div id="css"></div><button onclick="copy()">Copy CSS</button><script>function upd(){const c1=document.getElementById('c1').value,c2=document.getElementById('c2').value,dir=document.getElementById('dir').value;const g=\`linear-gradient(\${dir}, \${c1}, \${c2})\`;document.getElementById('prev').style.background=g;document.getElementById('css').textContent=\`background: \${g}\`}function copy(){navigator.clipboard?.writeText(document.getElementById('css').textContent)}upd();<\/script></body></html>`,
  },
];

const PROMPTS = [
  { label: '🧠 Explain like I\'m 5', text: 'Explain this topic like I\'m 5 years old: ' },
  { label: '💻 Write code for', text: 'Write code for: ' },
  { label: '🐛 Debug this code', text: 'Help me debug this code:\n```\n\n```' },
  { label: '📝 Summarize this', text: 'Summarize the following:\n\n' },
  { label: '✍️ Improve my writing', text: 'Improve the style and clarity of this text:\n\n' },
  { label: '🔍 Compare X vs Y', text: 'Compare and contrast: ' },
  { label: '📋 Create a plan for', text: 'Create a step-by-step plan for: ' },
  { label: '🌐 Translate to Tamil', text: 'Translate the following to Tamil:\n\n' },
];

interface ArtifactPanelProps {
  projects: Project[];
  activeProjectId: string | null;
  onLoadProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onPromptSelect: (text: string) => void;
}

export function ArtifactPanel({
  projects, activeProjectId, onLoadProject, onCreateProject, onDeleteProject, onPromptSelect,
}: ArtifactPanelProps) {
  const [tab, setTab] = useState<Tab>('games');
  const [openItem, setOpenItem] = useState<{ title: string; html: string } | null>(null);

  const items = tab === 'games' ? GAMES : CREATIVE;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'games', label: '🎮 Games' },
    { id: 'creative', label: '🎨 Creative' },
    { id: 'prompts', label: '💬 Prompts' },
    { id: 'projects', label: '📁 Projects' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border flex-shrink-0">
        {openItem ? (
          <button
            onClick={() => setOpenItem(null)}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={15} />
            Back
          </button>
        ) : (
          <span className="text-base font-semibold text-text-primary">⚡ Artifacts</span>
        )}
        {openItem && (
          <span className="text-sm font-medium text-text-primary truncate">{openItem.title}</span>
        )}
      </div>

      {/* Full iframe when item open */}
      {openItem ? (
        <iframe
          srcDoc={openItem.html}
          sandbox="allow-scripts allow-same-origin"
          className="flex-1 border-0 bg-white"
          title={openItem.title}
        />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-border flex-shrink-0 overflow-x-auto px-2 sm:px-4">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  tab === t.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content — full width grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {(tab === 'games' || tab === 'creative') && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
                {items.map(item => (
                  <button
                    key={item.title}
                    onClick={() => setOpenItem(item)}
                    className="flex flex-col rounded-xl border border-border bg-surface-2 hover:bg-surface-3 overflow-hidden transition-colors text-left group"
                  >
                    <div className="relative w-full" style={{ paddingBottom: '70%' }}>
                      <iframe
                        srcDoc={item.html}
                        sandbox="allow-scripts allow-same-origin"
                        className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                        title={item.title}
                        style={{ transform: 'scale(0.6)', transformOrigin: 'top left', width: '167%', height: '167%' }}
                      />
                    </div>
                    <div className="px-3 py-2.5 border-t border-border">
                      <span className="text-sm font-medium text-text-primary">{item.emoji} {item.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {tab === 'prompts' && (
              <div className="max-w-2xl mx-auto space-y-2">
                <p className="text-sm text-text-muted mb-4">Click any prompt to paste it into the chat input.</p>
                {PROMPTS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => onPromptSelect(p.text)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border transition-colors"
                  >
                    <span className="text-sm text-text-primary">{p.label}</span>
                  </button>
                ))}
              </div>
            )}

            {tab === 'projects' && (
              <div className="max-w-2xl mx-auto space-y-2">
                <button
                  onClick={onCreateProject}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors text-sm"
                >
                  <Plus size={14} />
                  New Project
                </button>
                {projects.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-8">No projects yet</p>
                ) : projects.map(proj => (
                  <div
                    key={proj.id}
                    className={`group flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
                      activeProjectId === proj.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-surface-2 hover:bg-surface-3'
                    }`}
                    onClick={() => onLoadProject(proj.id)}
                  >
                    <FolderOpen size={14} className={activeProjectId === proj.id ? 'text-accent' : 'text-text-muted'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{proj.name}</p>
                      {proj.systemPrompt && (
                        <p className="text-xs text-text-muted truncate">{proj.systemPrompt}</p>
                      )}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteProject(proj.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:text-red-400 text-text-muted transition-all flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
