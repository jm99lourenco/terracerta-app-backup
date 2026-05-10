import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import {
  Upload, FileText, MapPin, Ruler,
  Calendar, Hash, Search, Plus, ChevronRight, ChevronLeft,
  Download, CheckCircle2, AlertCircle, XCircle, TrendingUp,
  LogOut, Settings, Filter, ArrowUpDown, FileCheck,
  Building2, Mountain, Lock, Mail, Layers,
  Shield, Activity, Zap, ArrowRight, Sparkles, AlertTriangle,
  CheckCircle, Info, ExternalLink, Bell, Loader2, RefreshCw,
  Satellite, Map as MapIcon, Calculator, Globe2, Eye, EyeOff, HelpCircle
} from "lucide-react";

// ----------------- CONFIG & DB -----------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const db = createClient(supabaseUrl, supabaseAnonKey);

const ALLOWED_USERS = {
  "admin1@terracerta.pt": "portugal2026",
  "admin2@terracerta.pt": "portugal2026",
};

// ----------------- DATASET: CONCELHOS E FREGUESIAS -----------------
const CONCELHOS_PORTUGAL = {
  "Lisboa": ["Ajuda", "Alcântara", "Alvalade", "Areeiro", "Arroios", "Avenidas Novas", "Beato", "Belém", "Benfica", "Campo de Ourique", "Campolide", "Carnide", "Estrela", "Lumiar", "Marvila", "Misericórdia", "Olivais", "Parque das Nações", "Penha de França", "Santa Clara", "Santa Maria Maior", "Santo António", "São Domingos de Benfica", "São Vicente"],
  "Oeiras": ["Algés, Linda-a-Velha e Cruz Quebrada-Dafundo", "Barcarena", "Carnaxide e Queijas", "Oeiras e São Julião da Barra, Paço de Arcos e Caxias", "Porto Salvo"],
  "Cascais": ["Alcabideche", "Carcavelos e Parede", "Cascais e Estoril", "São Domingos de Rana"],
  "Sintra": ["Agualva e Mira-Sintra", "Algueirão-Mem Martins", "Almargem do Bispo, Pêro Pinheiro e Montelavar", "Cacém e São Marcos", "Casal de Cambra", "Colares", "Massamá e Monte Abraão", "Queluz e Belas", "Rio de Mouro", "Sintra (Santa Maria e São Miguel, São Martinho e São Pedro de Penaferrim)"],
  "Amadora": ["Águas Livres", "Alfragide", "Encosta do Sol", "Falagueira-Venda Nova", "Mina de Água", "Venteira"],
  "Porto": ["Bonfim", "Campanhã", "Cedofeita, Santo Ildefonso, Sé, Miragaia, São Nicolau e Vitória", "Lordelo do Ouro e Massarelos", "Paranhos", "Ramalde", "Vila Nova da Telha"],
  "Gaia": ["Arcozelo", "Avintes", "Canidelo", "Gulpilhares e Valadares", "Madalena", "Mafamude e Vilar do Paraíso", "Oliveira do Douro", "Pedroso e Seixezelo", "Sandim, Olival, Lever e Crestuma", "Santa Marinha e São Pedro da Afurada", "São Félix da Marinha", "Vilar de Andorinho"],
  "Braga": ["Arentim e Cunha", "Braga (Maximinos, Sé e Cividade)", "Braga (São José de São Lázaro e São João do Souto)", "Celeirós, Aveleda e Vimieiro", "Crespos e Pousada", "Este (São Pedro e São Mamede)", "Ferreiros e Gondizalves", "Gualtar", "Merelim (São Paio), Panoias e Parada de Tibães", "Nogueira, Fraião e Lamaçães", "Real, Dume e Semelhe", "Tadim"],
  "Coimbra": ["Almedina", "Santa Cruz", "Sé Nova", "São Bartolomeu"],
  "Faro": ["Conceição e Estoi", "Faro (Sé e São Pedro)", "Montenegro", "Santa Bárbara de Nexe"],
  "Funchal": ["Imaculado Coração de Maria", "Monte", "Santa Luzia", "Santa Maria Maior", "Santo António", "São Gonçalo", "São Martinho", "São Pedro", "São Roque", "Sé"]
};

// ----------------- UTILS -----------------
const formatNumber = (n) => n == null ? "—" : new Intl.NumberFormat("pt-PT").format(n);
const formatArea = (m2) => {
  if (m2 == null || m2 === 0) return "—";
  if (m2 >= 10000) return `${(m2 / 10000).toLocaleString("pt-PT", { maximumFractionDigits: 2 })} ha`;
  return `${formatNumber(m2)} m²`;
};

const scoreColor = (s) => {
  if (s >= 80) return { text: "text-emerald-600", bg: "bg-emerald-50", fill: "bg-emerald-500", border: "border-emerald-100", label: "Viabilidade elevada" };
  if (s >= 60) return { text: "text-lime-600", bg: "bg-lime-50", fill: "bg-lime-500", border: "border-lime-100", label: "Viabilidade média" };
  if (s >= 40) return { text: "text-amber-600", bg: "bg-amber-50", fill: "bg-amber-500", border: "border-amber-100", label: "Viabilidade reduzida" };
  return { text: "text-rose-600", bg: "bg-rose-50", fill: "bg-rose-500", border: "border-rose-100", label: "Inviável / Restrito" };
};

// ----------------- COMPONENTS -----------------

const LandscapeBackground = () => (
  <div className="absolute inset-0 overflow-hidden bg-[#fbe7c4]">
    <style>{`
      @keyframes drift-slow { from { transform: translateX(-15vw); } to { transform: translateX(115vw); } }
      @keyframes drift-slower { from { transform: translateX(-25vw); } to { transform: translateX(125vw); } }
      @keyframes drift-fastest { from { transform: translateX(-35vw); } to { transform: translateX(135vw); } }
      @keyframes fly-path { 0% { transform: translate(-10vw, 0); } 100% { transform: translate(110vw, -5vh); } }
      .tc-cloud-a { animation: drift-slow 140s linear infinite; }
      .tc-cloud-b { animation: drift-slower 180s linear infinite; }
      .tc-cloud-c { animation: drift-fastest 110s linear infinite; }
      .tc-birds { animation: fly-path 75s linear infinite; }
    `}</style>
    <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="bg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fbe7c4" /><stop offset="100%" stopColor="#c9825a" /></linearGradient>
        <radialGradient id="bg-sun" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fffaeb" stopOpacity="0.8" /><stop offset="100%" stopColor="#fffaeb" stopOpacity="0" /></radialGradient>
        <linearGradient id="bg-mountains" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7a8b8e" /><stop offset="100%" stopColor="#5b6e72" /></linearGradient>
        <linearGradient id="bg-hill-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9bb47e" /><stop offset="100%" stopColor="#7a9460" /></linearGradient>
        <linearGradient id="bg-hill-mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c8c5e" /><stop offset="100%" stopColor="#4a6640" /></linearGradient>
        <linearGradient id="bg-hill-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a5d34" /><stop offset="100%" stopColor="#243d22" /></linearGradient>
        <linearGradient id="bg-field" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d4c685" /><stop offset="100%" stopColor="#a89255" /></linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#bg-sky)" />
      <circle cx="1400" cy="220" r="150" fill="url(#bg-sun)" />
      <path d="M0,520 L120,470 L210,495 L320,440 L420,475 L540,420 L660,460 L780,430 L900,475 L1040,440 L1180,490 L1320,455 L1480,485 L1620,445 L1780,475 L1920,455 L1920,600 L0,600 Z" fill="url(#bg-mountains)" />
      <path d="M0,580 Q240,510 480,545 T960,520 T1440,540 T1920,510 L1920,720 L0,720 Z" fill="url(#bg-hill-far)" opacity="0.85" />
      <path d="M0,660 Q320,580 640,620 T1280,610 T1920,600 L1920,820 L0,820 Z" fill="url(#bg-hill-mid)" />
      <path d="M0,780 Q400,700 800,740 T1500,720 T1920,740 L1920,1080 L0,1080 Z" fill="url(#bg-hill-near)" />
      <path d="M0,860 Q500,820 1000,840 T1920,830 L1920,1080 L0,1080 Z" fill="url(#bg-field)" opacity="0.9" />
      {[[1120, 770], [1150, 775], [1190, 765]].map(([cx, cy], i) => (<ellipse key={`tree-${i}`} cx={cx} cy={cy} rx={11} ry={36} fill="#1c3a1a" opacity="0.95" />))}
      <g transform="translate(1550, 700)" opacity="0.85">
        <rect x="0" y="20" width="48" height="28" fill="#f0e1c8" /><polygon points="-4,20 24,4 52,20" fill="#8b4f3a" /><rect x="20" y="32" width="8" height="16" fill="#3a2818" /><rect x="6" y="28" width="6" height="6" fill="#3a2818" /><rect x="34" y="28" width="6" height="6" fill="#3a2818" />
      </g>
    </svg>
    <svg className="absolute top-[8%] left-0 w-[20vw] max-w-[260px] tc-cloud-a opacity-90 pointer-events-none" viewBox="0 0 200 60"><g fill="white" opacity="0.85"><ellipse cx="50" cy="35" rx="40" ry="18" /><ellipse cx="90" cy="28" rx="32" ry="20" /><ellipse cx="130" cy="35" rx="38" ry="16" /></g></svg>
    <svg className="absolute top-[22%] left-0 w-[12vw] max-w-[180px] tc-birds opacity-70 pointer-events-none" viewBox="0 0 100 40" fill="none" stroke="#3a2818" strokeWidth="1.6"><path d="M5,20 q5,-7 10,0 q5,-7 10,0" /><path d="M30,28 q4,-6 8,0 q4,-6 8,0" /><path d="M55,18 q5,-7 10,0 q5,-7 10,0" /><path d="M80,26 q4,-6 8,0 q4,-6 8,0" /></svg>
  </div>
);

const Nav = ({ page, onNavigate, user, onLogout }) => (
  <nav className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 bg-emerald-600 rounded flex items-center justify-center text-white"><Mountain size={14} strokeWidth={2.5} /></div>
        <span className="font-bold text-slate-800 tracking-tight">Terra<span className="text-emerald-600">Certa</span></span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onNavigate("dashboard")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${page === 'dashboard' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>Dashboard</button>
      </div>
    </div>
    <div className="flex items-center gap-5">
      <Bell size={16} className="text-slate-400 cursor-pointer hover:text-slate-600 transition" />
      <Settings size={16} className="text-slate-400 cursor-pointer hover:text-slate-600 transition" />
      <div className="h-4 w-px bg-slate-200 mx-1"></div>
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold uppercase">{user ? user[0] : 'U'}</div>
        <span className="text-xs font-semibold text-slate-700">{user?.split('@')[0]}</span>
        <button onClick={onLogout} className="text-slate-400 hover:text-rose-500 transition"><LogOut size={16} /></button>
      </div>
    </div>
  </nav>
);

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const handleLogin = (e) => {
    e?.preventDefault?.();
    setError(null);
    const expectedPwd = ALLOWED_USERS[email.toLowerCase().trim()];
    if (!expectedPwd || expectedPwd !== password) { setError("Credenciais inválidas."); return; }
    setSubmitting(true);
    setTimeout(() => onLogin(email), 300);
  };
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      <LandscapeBackground />
      <header className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-600 rounded flex items-center justify-center text-white shadow-sm"><Mountain size={22} strokeWidth={2.5} /></div>
          <span className="text-2xl font-bold text-white tracking-tight">Terra<span className="text-emerald-400">Certa</span></span>
        </div>
      </header>
      <div className="w-full max-w-[420px] bg-white rounded-xl shadow-2xl p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <h1 className="text-3xl font-bold text-[#0f172a] mb-10">Iniciar sessão</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email profissional</label>
            <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none transition text-slate-600 placeholder:text-slate-300" placeholder="nome@terracerta.pt" /></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Palavra-passe</label>
              <button type="button" onClick={() => alert("Contacte o suporte técnico.")} className="text-[11px] text-emerald-700 font-bold hover:underline">Esqueci-me da Password</button>
            </div>
            <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none transition text-slate-600" placeholder="••••••••••" /></div>
          </div>
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
          <button type="submit" disabled={submitting} className="w-full bg-[#0f172a] text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition transform active:scale-[0.98] disabled:opacity-50">{submitting ? <Loader2 className="animate-spin" size={18} /> : <>Entrar na plataforma <ArrowRight size={18} /></>}</button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({ properties, loading, onRefresh, onNew, onSelect, user, onLogout, onNavigate }) => {
  const [search, setSearch] = useState("");
  const filtered = properties.filter(p => 
    p.designacao?.toLowerCase().includes(search.toLowerCase()) || 
    p.concelho?.toLowerCase().includes(search.toLowerCase()) ||
    p.id?.toLowerCase().includes(search.toLowerCase())
  );
  const totalArea = filtered.reduce((acc, curr) => acc + (curr.area || 0), 0);
  const avgScore = filtered.length ? Math.round(filtered.reduce((acc, curr) => acc + (curr.score || 0), 0) / filtered.length) : 0;
  const highViability = filtered.filter(p => p.score > 60).length;

  return (
    <div className="min-h-screen bg-white">
      <Nav page="dashboard" onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <main className="p-8 max-w-[1280px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-2xl font-bold text-slate-900">Dashboard de Terrenos</h1></div>
          <div className="flex gap-3">
            <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-50 transition"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar</button>
            <button onClick={onNew} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 shadow-sm transition"><Plus size={16} /> Novo Terreno</button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Resultados", val: filtered.length, sub: "terrenos filtrados", icon: Layers },
            { label: "Área Filtrada", val: formatArea(totalArea), sub: "total visível", icon: Ruler },
            { label: "Score Médio", val: avgScore, sub: "no portfólio visível", icon: Activity },
            { label: "Viabilidade > 60", val: `${highViability}`, sub: "terrenos aptos", icon: TrendingUp },
          ].map((s, i) => (
            <div key={i} className="px-5 py-4 border border-slate-100 rounded-lg bg-slate-50/50 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1"><s.icon size={12} className="text-emerald-600" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</span></div>
              <div className="flex items-baseline gap-2"><span className="text-xl font-bold text-slate-900">{s.val}</span><span className="text-[9px] text-slate-400 font-medium">{s.sub}</span></div>
            </div>
          ))}
        </div>
        <div className="border border-slate-200 rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="relative w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por designação, concelho, ID..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded text-xs focus:ring-1 focus:ring-emerald-500/20 transition" /></div>
            <div className="flex items-center gap-4"><button className="flex items-center gap-2 text-slate-500 font-semibold text-xs border border-slate-200 px-3 py-2 rounded hover:bg-slate-50"><Filter size={14} /> Filtros</button></div>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th><th className="px-5 py-3 font-medium">Designação</th><th className="px-5 py-3 font-medium">Concelho / Freguesia</th><th className="px-5 py-3 font-medium">Artigo Matricial</th><th className="px-5 py-3 font-medium">Área</th><th className="px-5 py-3 font-medium">Classificação</th><th className="px-5 py-3 font-medium">Score</th><th className="px-5 py-3 font-medium">Estado</th><th className="px-5 py-3 font-medium">Data</th><th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} onClick={() => onSelect(p)} className="hover:bg-slate-50/80 transition cursor-pointer group">
                  <td className="px-5 py-4 text-slate-400 font-mono text-[10px]">{p.id.slice(0, 8)}...</td>
                  <td className="px-5 py-4 font-bold text-slate-900">{p.designacao}</td>
                  <td className="px-5 py-4 text-slate-600 font-medium"><div>{p.concelho}</div><div className="text-[10px] text-slate-400">{p.freguesia}</div></td>
                  <td className="px-5 py-4 text-slate-600">—</td>
                  <td className="px-5 py-4 tabular-nums text-slate-900 font-semibold">{formatArea(p.area)}</td>
                  <td className="px-5 py-4 text-slate-600">Urbano</td>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${scoreColor(p.score).fill}`} style={{ width: `${p.score}%` }}></div></div><span className={`font-bold ${scoreColor(p.score).text}`}>{p.score}</span></div></td>
                  <td className="px-5 py-4"><span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase">Analisado</span></td>
                  <td className="px-5 py-4 text-slate-500">{p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : "2026-05-09"}</td>
                  <td className="px-5 py-4 text-slate-300 group-hover:text-slate-600 transition-colors text-right"><ChevronRight size={14} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 bg-slate-50/50 flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100">
            <span>Última sincronização: agora</span>
            <div className="flex gap-4"><button className="hover:text-slate-700 transition">Exportar CSV</button><button className="hover:text-slate-700 transition flex items-center gap-1">Ver no mapa <ChevronRight size={10} /></button></div>
          </div>
        </div>
      </main>
    </div>
  );
};

const UploadPage = ({ onCancel, onAnalyseDone, user, onLogout, onNavigate }) => {
  const [formData, setFormData] = useState({ designacao: "", concelho: "", freguesia: "", area: "", matricial: "" });
  const [analysing, setAnalysing] = useState(false);
  const [files, setFiles] = useState({});
  const fileInputRef = useRef(null);
  const [activeFileKey, setActiveFileKey] = useState(null);

  const handleFileClick = (key) => { setActiveFileKey(key); fileInputRef.current?.click(); };
  const handleFileChange = (e) => { if (e.target.files?.length && activeFileKey) { setFiles(prev => ({ ...prev, [activeFileKey]: e.target.files[0].name })); setActiveFileKey(null); } };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAnalysing(true);
    setTimeout(() => {
      onAnalyseDone({ id: "new-" + Math.random().toString(36).substr(2, 9), designacao: formData.designacao || "Tapada do Mocho", concelho: formData.concelho, freguesia: formData.freguesia, area: parseFloat(formData.area) || 140, score: 88, status: "Analisado" });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <Nav page="upload" onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <main className="p-8 max-w-[800px] mx-auto">
        <button onClick={onCancel} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 text-xs font-semibold transition"><ChevronLeft size={16} /> Voltar ao dashboard</button>
        <div className="mb-8"><h1 className="text-2xl font-bold text-slate-900 mb-2">Submissão de terreno</h1></div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <div className="p-8 border border-slate-200 rounded-md space-y-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Dados do terreno</h3>
            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Designação *</label><input required value={formData.designacao} onChange={e => setFormData({...formData, designacao: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-emerald-500 transition outline-none" placeholder="Ex: Quinta da Ribeira" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Concelho *</label><select required value={formData.concelho} onChange={e => setFormData({...formData, concelho: e.target.value, freguesia: ""})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500"><option value="">Selecionar concelho...</option>{Object.keys(CONCELHOS_PORTUGAL).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Freguesia *</label><select required value={formData.freguesia} onChange={e => setFormData({...formData, freguesia: e.target.value})} disabled={!formData.concelho} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"><option value="">{formData.concelho ? "Selecionar freguesia..." : "—"}</option>{formData.concelho && CONCELHOS_PORTUGAL[formData.concelho].map(f => <option key={f} value={f}>{f}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><div className="flex items-center gap-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Artigo Matricial *</label><div className="group relative cursor-help"><HelpCircle size={12} className="text-slate-300" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Identificação única do imóvel na matriz predial das finanças.</div></div></div><input required value={formData.matricial} onChange={e => setFormData({...formData, matricial: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ex: 1452 / Secção B" /></div>
              <div className="space-y-2"><div className="flex items-center gap-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Área (m²) *</label><div className="group relative cursor-help"><HelpCircle size={12} className="text-slate-300" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Área total da parcela em metros quadrados, conforme caderneta predial.</div></div></div><input required type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ex: 12450" /></div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Documentação de suporte</h3>
            {[
              { id: "caderneta", label: "Caderneta Predial", sub: "Documento das Finanças (Modelo 1)", formats: "PDF · ATÉ 10MB" },
              { id: "planta", label: "Planta de Localização", sub: "Câmara Municipal · escala 1:2000 ou superior", formats: "PDF / DWG / DXF" },
              { id: "certidao", label: "Certidão Permanente", sub: "Conservatória do Registo Predial", formats: "PDF · CÓDIGO DE ACESSO ACEITE" },
            ].map((d) => (
              <div key={d.id} className="p-5 border border-slate-200 rounded-md flex items-center justify-between bg-white hover:border-emerald-200 transition">
                <div className="flex gap-4 items-center"><div className={`h-10 w-10 rounded flex items-center justify-center ${files[d.id] ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{files[d.id] ? <CheckCircle size={20} /> : <FileText size={18} />}</div><div><div className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-900">{d.label}</span><span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded tracking-tighter">{d.formats}</span></div><p className="text-[11px] text-slate-500">{files[d.id] ? `Selecionado: ${files[d.id]}` : d.sub}</p></div></div>
                <button type="button" onClick={() => handleFileClick(d.id)} className={`flex items-center gap-2 px-3 py-1.5 border rounded text-[10px] font-bold transition ${files[d.id] ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Upload size={12} /> {files[d.id] ? "Alterar" : "Carregar"}</button>
              </div>
            ))}
          </div>
          <button type="submit" disabled={analysing} className="w-full bg-emerald-600 text-white py-4 rounded-md font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-md transition disabled:opacity-50">{analysing ? <Loader2 className="animate-spin" size={20} /> : "Iniciar Análise de Viabilidade"}</button>
        </form>
      </main>
    </div>
  );
};

const AnalysisPage = ({ property, page, setPage, onBack, user, onLogout, onNavigate }) => {
  const c = scoreColor(property.score);
  return (
    <div className="min-h-screen bg-slate-50/50">
      <Nav page="analysis" onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <main className="p-8 max-w-[1280px] mx-auto">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          <button onClick={onBack} className="hover:text-slate-600 transition">Terrenos</button>
          <ChevronRight size={10} />
          <span className="text-slate-600">{property.id?.slice(0, 8)}...</span>
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Análise de Viabilidade</h2>
            <h1 className="text-3xl font-bold text-slate-900">{property.designacao}</h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-300" /> {property.concelho}, {property.freguesia}</div>
              <div className="flex items-center gap-1.5"><Hash size={14} className="text-slate-300" /> —</div>
              <div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-300" /> Emitido 2026-05-09</div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-slate-200/50 p-1 rounded-lg border border-slate-200">
              <button onClick={() => setPage(1)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${page === 1 ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>1 · Análise PDM</button>
              <button onClick={() => setPage(2)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${page === 2 ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>2 · Conversão Urbana</button>
            </div>
            <button className="flex items-center gap-2 px-4 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-white transition"><ExternalLink size={14} /> Abrir no mapa</button>
          </div>
        </div>

        {page === 1 ? (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${c.fill}`}></div>
                <div className="relative mb-6">
                  <svg className="w-48 h-48 transform -rotate-90"><circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" /><circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552.9} strokeDashoffset={552.9 * (1 - property.score / 100)} className={`${c.text} transition-all duration-1000 ease-out`} strokeLinecap="round" /></svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-6xl font-black ${c.text} tracking-tighter`}>{property.score}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Health Score / 100</span>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 ${c.bg} ${c.text} border ${c.border}`}>{c.label}</div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Score calculado com base em 14 indicadores do PDM, condicionantes legais e camadas oficiais do território.</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dados extraídos</h3><div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black tracking-tighter border border-emerald-100 uppercase">OCR <CheckCircle size={10} /></div></div>
                <div className="p-0 divide-y divide-slate-100">
                  {[
                    { label: "Concelho", val: property.concelho },
                    { label: "Freguesia", val: property.freguesia },
                    { label: "Artigo matricial", val: "—" },
                    { label: "Área total", val: formatArea(property.area) },
                    { label: "Confrontações", val: "N: caminho público" },
                    { label: "Inscrição", val: "Definitiva 2018-04-12" },
                    { label: "PDM aplicável", val: "PDM-OEIRAS-1234" },
                  ].map((d, i) => (<div key={i} className="flex justify-between items-center px-6 py-3.5 text-xs"><span className="text-slate-400 font-medium">{d.label}</span><span className="text-slate-900 font-bold">{d.val}</span></div>))}
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8"><div><h3 className="text-lg font-bold text-slate-900 mb-1">Análise PDM <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 ml-2 tracking-widest">Tempo Real</span></h3><p className="text-xs text-slate-500 font-medium italic leading-relaxed">Interpretação automática do regulamento PDM-OEIRAS-1234 e cruzamento com 9 camadas oficiais.</p></div><div className="text-[10px] font-bold text-slate-400">Fonte oficial: DGT</div></div>
                <div className="space-y-6">
                  {[
                    { label: "Classificação do solo", val: "Urbano", meta: "PDM Art. 14º", status: "ok" },
                    { label: "Categoria de espaço", val: "Espaço Agrícola de Produção (Tipo II)", meta: "Planta de Ordenamento", status: "ok" },
                    { label: "Subcategoria", val: "Áreas agrícolas complementares", meta: "PDM Art. 27º nº2", status: "ok" },
                    { label: "Índice de utilização (iu)", val: "0,15", meta: "PDM Art. 30º", status: "warning" },
                    { label: "Cércea máxima", val: "6,5 m (2 pisos)", meta: "PDM Art. 31º", status: "ok" },
                    { label: "REN — Reserva Ecológica", val: "Parcialmente abrangido (≈18%)", meta: "Planta de Condicionantes", status: "warning" },
                    { label: "RAN — Reserva Agrícola", val: "Não abrangido", meta: "DRAP", status: "ok" },
                    { label: "Servidão rodoviária", val: "Faixa non aedificandi 12m (EN229)", meta: "DL 13/94", status: "warning" },
                    { label: "Risco de incêndio rural", val: "Classe Média", meta: "ICNF · Carta 2025", status: "ok" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm group">
                      <div className="flex items-center gap-4"><div className={`shrink-0 h-4 w-4 rounded-full flex items-center justify-center ${r.status === 'ok' ? 'text-emerald-500' : 'text-amber-500'}`}>{r.status === 'ok' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}</div><span className="text-slate-700 font-semibold">{r.label}</span></div>
                      <div className="flex items-center gap-6"><span className="text-slate-900 font-bold text-right">{r.val}</span><span className="text-[10px] text-slate-400 font-bold uppercase w-32 text-right">{r.meta}</span></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-8 shadow-sm">
                <h3 className="text-emerald-900 font-black text-[11px] uppercase tracking-widest mb-6 flex items-center gap-2"><Sparkles size={16} /> Recomendações do TerraCerta</h3>
                <div className="space-y-4">
                  {[
                    "Solicitar delimitação da área REN ao ICNF antes de qualquer pedido de informação prévia.",
                    "A faixa non aedificandi da EN229 reduz a área útil edificável em ~9%. Considerar no estudo prévio.",
                    "iu de 0,15 permite até 21 m² de construção. Avaliar PIP para confirmar.",
                    "O PDM tem 3ª Alteração por Adaptação em vigor desde 12/03/2026 — recomenda-se confirmar versão."
                  ].map((rec, i) => (
                    <div key={i} className="flex gap-4 text-xs text-emerald-800 leading-relaxed font-medium"><span className="font-black text-emerald-600/50 italic">0{i+1}</span><p>{rec}</p></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-2">Viabilidade de conversão para solo Urbano</h3>
                <p className="text-xs text-slate-500 mb-8 italic">Simulação baseada nos critérios do RJIGT (DL 80/2015) e nas dinâmicas territoriais do concelho.</p>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: "PROBABILIDADE CONVERSÃO", v: "66%", sub: "horizonte 5-7 anos", c: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                    { label: "CUSTO ESTIMADO PROCESSO", v: "€ 8.400", sub: "taxas + assessoria", c: "bg-slate-50 border-slate-100" },
                    { label: "PRAZO MÉDIO CM", v: "14-22 meses", sub: "incl. discussão pública", c: "bg-slate-50 border-slate-100" },
                  ].map((k, i) => (
                    <div key={i} className={`p-5 rounded-xl border ${k.c}`}>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">{k.label}</div>
                      <div className="text-2xl font-black text-slate-900 mb-1">{k.v}</div>
                      <div className="text-[10px] text-slate-500 font-bold">{k.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Análise dos requisitos legais (RJIGT)</h3>
                <div className="space-y-6 divide-y divide-slate-50">
                  {[
                    { label: "Contiguidade ao perímetro urbano existente", val: "Distância 280m ao limite", status: "ok" },
                    { label: "Infraestruturas básicas (água, eletricidade, saneamento)", val: "Saneamento a 420m — extensão necessária", status: "warning" },
                    { label: "Acessibilidade rodoviária estruturante", val: "EN229 + caminho municipal", status: "ok" },
                    { label: "Não sobreposição com REN crítica", val: "18% da parcela em REN", status: "warning" },
                    { label: "Compatibilidade com PROT-Centro", val: "Categoria mista compatível", status: "ok" },
                    { label: "Equilíbrio áreas urbanizadas/rústicas no concelho", val: "Concelho próximo do limite legal", status: "warning" },
                    { label: "Justificação demográfica/económica", val: "Crescimento populacional negativo (-1,2% / ano)", status: "warning" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs pt-4 first:pt-0">
                      <div className="flex items-center gap-4"><div className={r.status === 'ok' ? 'text-emerald-500' : 'text-amber-500'}>{r.status === 'ok' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}</div><span className="text-slate-600 font-bold">{r.label}</span></div>
                      <span className="text-slate-400 font-medium text-right">{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6"><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score de conversão</h3><Activity size={14} className="text-slate-300" /></div>
                <div className="text-6xl font-black text-lime-600 tracking-tighter mb-1">66</div>
                <p className="text-[10px] font-bold text-slate-400 mb-8">Probabilidade ponderada</p>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2"><div className="h-full bg-lime-500" style={{ width: '66%' }}></div></div>
              </div>
              <button className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition"><Download size={20} /> Exportar PDF</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [analysisPage, setAnalysisPage] = useState(1);
  useEffect(() => { if (user) fetchProperties(); }, [user]);
  async function fetchProperties() {
    setLoading(true);
    const { data } = await db.from("propriedades").select("*").order("created_at", { ascending: false });
    setProperties(data || []);
    setLoading(false);
  }
  if (!user) return <LoginPage onLogin={setUser} />;
  if (view === "dashboard") return <Dashboard properties={properties} loading={loading} onRefresh={fetchProperties} onNew={() => setView("upload")} onSelect={(p) => { setSelected(p); setView("analysis"); setAnalysisPage(1); }} user={user} onLogout={() => setUser(null)} onNavigate={setView} />;
  if (view === "upload") return <UploadPage onCancel={() => setView("dashboard")} onAnalyseDone={(p) => { setSelected(p); setView("analysis"); setAnalysisPage(1); }} user={user} onLogout={() => setUser(null)} onNavigate={setView} />;
  if (view === "analysis" && selected) return <AnalysisPage property={selected} page={analysisPage} setPage={setAnalysisPage} onBack={() => setView("dashboard")} user={user} onLogout={() => setUser(null)} onNavigate={setView} />;
  return null;
}
