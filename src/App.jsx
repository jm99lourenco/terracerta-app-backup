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

// ----------------- DATASET: DISTRITOS, CONCELHOS E FREGUESIAS -----------------
const PORTUGAL_GEO = {
  "Aveiro": {
    "Águeda": ["Águeda e Borralha", "Barrô e Aguada de Baixo", "Fermentelos", "Macinhata do Vouga", "Recardães e Espinhel"],
    "Aveiro": ["Aradas", "Cacia", "Esgueira", "Glória e Vera Cruz", "Oliveirinha", "Santa Joana", "São Bernardo", "São Jacinto"],
    "Ílhavo": ["Gafanha da Encarnação", "Gafanha da Nazaré", "Gafanha do Carmo", "Ílhavo (São Salvador)"]
  },
  "Braga": {
    "Braga": ["Braga (Maximinos, Sé e Cividade)", "Braga (São José de São Lázaro e São João do Souto)", "Gualtar", "Real, Dume e Semelhe", "Nogueira, Fraião e Lamaçães"]
  },
  "Faro": {
    "Faro": ["Conceição e Estoi", "Faro (Sé e São Pedro)", "Montenegro", "Santa Bárbara de Nexe"],
    "Loulé": ["Almancil", "Alte", "Ameixial", "Quarteira", "Loulé (São Clemente)", "Loulé (São Sebastião)"]
  },
  "Lisboa": {
    "Lisboa": ["Ajuda", "Alcântara", "Alvalade", "Areeiro", "Arroios", "Avenidas Novas", "Beato", "Belém", "Benfica", "Campo de Ourique", "Campolide", "Carnide", "Estrela", "Lumiar", "Marvila", "Misericórdia", "Olivais", "Parque das Nações", "Penha de França", "Santa Clara", "Santa Maria Maior", "Santo António", "São Domingos de Benfica", "São Vicente"],
    "Oeiras": ["Algés, Linda-a-Velha e Cruz Quebrada-Dafundo", "Barcarena", "Carnaxide e Queijas", "Oeiras e São Julião da Barra, Paço de Arcos e Caxias", "Porto Salvo"],
    "Cascais": ["Alcabideche", "Carcavelos e Parede", "Cascais e Estoril", "São Domingos de Rana"]
  },
  "Porto": {
    "Porto": ["Bonfim", "Campanhã", "Cedofeita, Santo Ildefonso, Sé, Miragaia, São Nicolau e Vitória", "Lordelo do Ouro e Massarelos", "Paranhos", "Ramalde"],
    "Gaia": ["Arcozelo", "Avintes", "Canidelo", "Gulpilhares e Valadares", "Madalena", "Mafamude e Vilar do Paraíso"]
  },
  "Santarém": {
    "Santarém": ["Abitureiras", "Abrã", "Alcanede", "Alcanhões", "Almoster", "Amiais de Baixo", "Arrouquelas", "Gançaria", "Santarém (Marvila), Santa Iria da Ribeira de Santarém, São Salvador e São Nicolau"]
  },
  "Setúbal": {
    "Setúbal": ["Azeitão (São Lourenço e São Simão)", "Gâmbia-Pontes-Alto da Guerra", "Sado", "Setúbal (São Julião, Nossa Senhora da Anunciada e Santa Maria da Graça)", "Setúbal (São Sebastião)"]
  }
};

const ALL_DISTRICTS = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu", "Madeira", "Açores"];

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
      @keyframes fly-path { 0% { transform: translate(-10vw, 0); } 100% { transform: translate(110vw, -5vh); } }
      .tc-cloud-a { animation: drift-slow 140s linear infinite; }
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
    </svg>
    <svg className="absolute top-[8%] left-0 w-[20vw] max-w-[260px] tc-cloud-a opacity-90 pointer-events-none" viewBox="0 0 200 60"><g fill="white" opacity="0.85"><ellipse cx="50" cy="35" rx="40" ry="18" /><ellipse cx="90" cy="28" rx="32" ry="20" /><ellipse cx="130" cy="35" rx="38" ry="16" /></g></svg>
    <svg className="absolute top-[22%] left-0 w-[12vw] max-w-[180px] tc-birds opacity-70 pointer-events-none" viewBox="0 0 100 40" fill="none" stroke="#3a2818" strokeWidth="1.6"><path d="M5,20 q5,-7 10,0 q5,-7 10,0" /><path d="M30,28 q4,-6 8,0 q4,-6 8,0" /></svg>
  </div>
);

const Nav = ({ page, onNavigate, user, onLogout }) => (
  <nav className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 bg-emerald-600 rounded flex items-center justify-center text-white"><Mountain size={14} strokeWidth={2.5} /></div>
        <span className="font-bold text-slate-800 tracking-tight text-lg">TerraCerta</span>
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
          <span className="text-2xl font-bold text-white tracking-tight">TerraCerta</span>
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
  const avgScore = filtered.length ? Math.round(filtered.reduce((acc, curr) => acc + (curr.score || 0), 0) / filtered.length) : 0;

  return (
    <div className="min-h-screen bg-white">
      <Nav page="dashboard" onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <main className="p-8 max-w-[1280px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-2xl font-bold text-slate-900">Dashboard</h1></div>
          <div className="flex gap-3">
            <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 border-2 border-slate-900 text-slate-900 rounded-md text-xs font-bold hover:bg-slate-50 transition"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar</button>
            <button onClick={onNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 shadow-md transition transform active:scale-95"><Plus size={16} /> Novo Terreno</button>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 max-w-[200px] p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Análises Efetuadas</div>
            <div className="text-2xl font-black text-slate-900 tabular-nums">{filtered.length}</div>
          </div>
          <div className="flex-1 max-w-[200px] p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Viabilidade Média</div>
            <div className="text-2xl font-black text-emerald-600 tabular-nums">{avgScore}%</div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-md overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="relative w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded text-xs focus:ring-1 focus:ring-emerald-500/20 transition outline-none" /></div>
            <button className="flex items-center gap-2 text-slate-500 font-semibold text-xs border border-slate-200 px-3 py-2 rounded hover:bg-slate-50"><Filter size={14} /> Filtros</button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">ID</th><th className="px-5 py-4">Designação</th><th className="px-5 py-4">Localização</th><th className="px-5 py-4">Área</th><th className="px-5 py-4">Score</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} onClick={() => onSelect(p)} className="hover:bg-slate-50/80 transition cursor-pointer group">
                  <td className="px-5 py-5 text-slate-400 font-mono text-[10px]">{p.id.slice(0, 8)}</td>
                  <td className="px-5 py-5 font-bold text-slate-900">{p.designacao}</td>
                  <td className="px-5 py-5 text-slate-600 font-medium"><div>{p.concelho}</div><div className="text-[10px] text-slate-400">{p.freguesia}</div></td>
                  <td className="px-5 py-5 tabular-nums text-slate-900 font-semibold">{formatArea(p.area)}</td>
                  <td className="px-5 py-5"><div className="flex items-center gap-3"><div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${scoreColor(p.score).fill}`} style={{ width: `${p.score}%` }}></div></div><span className={`font-bold ${scoreColor(p.score).text}`}>{p.score}</span></div></td>
                  <td className="px-5 py-5"><span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase">Analisado</span></td>
                  <td className="px-5 py-5 text-slate-300 group-hover:text-slate-600 transition-colors text-right px-8"><ChevronRight size={16} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

const UploadPage = ({ onCancel, onAnalyseDone, user, onLogout, onNavigate }) => {
  const [formData, setFormData] = useState({ designacao: "", distrito: "", concelho: "", freguesia: "", area: "", matricial: "" });
  const [analysing, setAnalysing] = useState(false);
  const [files, setFiles] = useState({});
  const fileInputRef = useRef(null);
  const [activeFileKey, setActiveFileKey] = useState(null);

  const handleFileClick = (key) => { setActiveFileKey(key); fileInputRef.current?.click(); };
  const handleFileChange = (e) => { 
    if (e.target.files?.length && activeFileKey) { 
      setFiles(prev => ({ ...prev, [activeFileKey]: e.target.files[0].name })); 
      setActiveFileKey(null); 
    } 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAnalysing(true);
    setTimeout(() => {
      onAnalyseDone({ id: "new-" + Math.random().toString(36).substr(2, 9), designacao: formData.designacao || "Nova Propriedade", concelho: formData.concelho, freguesia: formData.freguesia, area: parseFloat(formData.area) || 0, score: 85, status: "Analisado" });
    }, 2000);
  };

  const concelhosNoDistrito = formData.distrito ? (Object.keys(PORTUGAL_GEO[formData.distrito] || {})) : [];
  const freguesiasNoConcelho = (formData.distrito && formData.concelho) ? PORTUGAL_GEO[formData.distrito][formData.concelho] : [];
  const hasPredefinedFreguesias = freguesiasNoConcelho && freguesiasNoConcelho.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <Nav page="upload" onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <main className="p-8 max-w-[800px] mx-auto">
        <button onClick={onCancel} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 text-xs font-bold transition"><ChevronLeft size={16} /> Voltar ao dashboard</button>
        <div className="mb-8"><h1 className="text-2xl font-bold text-slate-900 mb-2">Novo Terreno</h1></div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <div className="p-8 border border-slate-200 rounded-md space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Informação Básica</h3>
            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Designação *</label><input required value={formData.designacao} onChange={e => setFormData({...formData, designacao: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-emerald-500 transition outline-none" placeholder="Ex: Terreno Vale do Sol" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Distrito *</label><select required value={formData.distrito} onChange={e => setFormData({...formData, distrito: e.target.value, concelho: "", freguesia: ""})} className="w-full px-4 py-3 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500"><option value="">Selecionar...</option>{ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Concelho *</label><select required value={formData.concelho} onChange={e => setFormData({...formData, concelho: e.target.value, freguesia: ""})} disabled={!formData.distrito} className="w-full px-4 py-3 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"><option value="">Selecionar...</option>{concelhosNoDistrito.length > 0 ? concelhosNoDistrito.map(c => <option key={c} value={c}>{c}</option>) : (formData.distrito && <option value="Outro">Outro...</option>)}</select></div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Freguesia *</label>
                {hasPredefinedFreguesias ? (
                  <select required value={formData.freguesia} onChange={e => setFormData({...formData, freguesia: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500"><option value="">Selecionar...</option>{freguesiasNoConcelho.map(f => <option key={f} value={f}>{f}</option>)}</select>
                ) : (
                  <input required value={formData.freguesia} onChange={e => setFormData({...formData, freguesia: e.target.value})} disabled={!formData.concelho} className="w-full px-4 py-3 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400" placeholder="Nome da freguesia..." />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Artigo Matricial</label><input value={formData.matricial} onChange={e => setFormData({...formData, matricial: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ex: 502" /></div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Área Total (m²) *</label><input required type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ex: 5000" /></div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Upload de Documentos</h3>
            {[
              { id: "caderneta", label: "Caderneta Predial" },
              { id: "planta", label: "Planta de Localização" },
              { id: "certidao", label: "Certidão Permanente" },
            ].map((d) => (
              <div key={d.id} onClick={() => handleFileClick(d.id)} className={`p-4 border-2 border-dashed rounded-lg flex items-center justify-between cursor-pointer transition ${files[d.id] ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${files[d.id] ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{files[d.id] ? <CheckCircle size={22} strokeWidth={3} /> : <Upload size={20} />}</div>
                  <div><div className="text-sm font-bold text-slate-900">{d.label}</div><p className="text-[11px] text-slate-500">{files[d.id] ? `Ficheiro: ${files[d.id]}` : "Clique para selecionar o PDF"}</p></div>
                </div>
                {!files[d.id] && <Plus size={16} className="text-slate-300" />}
              </div>
            ))}
          </div>
          <button type="submit" disabled={analysing} className="w-full bg-emerald-600 text-white py-4 rounded-lg font-black uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 active:scale-[0.98]">{analysing ? <Loader2 className="animate-spin" size={24} /> : <>Submeter e Analisar <ArrowRight size={20} /></>}</button>
        </form>
      </main>
    </div>
  );
};

const AnalysisPage = ({ property, page, setPage, onBack, user, onLogout, onNavigate }) => {
  const c = scoreColor(property.score);
  const openInMap = () => {
    const loc = property.distrito ? `${property.concelho}, ${property.distrito}` : property.concelho;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc + ", Portugal")}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Nav page="analysis" onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <main className="p-8 max-w-[1280px] mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 text-xs font-bold transition"><ChevronLeft size={16} /> Voltar ao Dashboard</button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{property.designacao}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-bold">
              <div className="flex items-center gap-1.5"><MapPin size={16} className="text-emerald-500" /> {property.concelho}, {property.freguesia}</div>
              <div className="flex items-center gap-1.5"><Calendar size={16} className="text-slate-300" /> Emitido 2026-05-10</div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-slate-200/50 p-1 rounded-lg border border-slate-200">
              <button onClick={() => setPage(1)} className={`px-4 py-2 rounded-md text-xs font-black transition ${page === 1 ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>1 · PDM</button>
              <button onClick={() => setPage(2)} className={`px-4 py-2 rounded-md text-xs font-black transition ${page === 2 ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>2 · CONVERSÃO</button>
            </div>
            <button onClick={openInMap} className="flex items-center gap-2 px-5 py-2 border-2 border-slate-900 text-slate-900 rounded-lg text-xs font-black hover:bg-white transition"><ExternalLink size={16} /> Ver no Mapa</button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${c.fill}`}></div>
              <div className="relative mb-6">
                <svg className="w-48 h-48 transform -rotate-90"><circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" /><circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552.9} strokeDashoffset={552.9 * (1 - property.score / 100)} className={`${c.text} transition-all duration-1000 ease-out`} strokeLinecap="round" /></svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-6xl font-black ${c.text} tracking-tighter`}>{property.score}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Health Score</span>
                </div>
              </div>
              <div className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-6 ${c.bg} ${c.text} border-2 ${c.border}`}>{c.label}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informação do OCR</h3></div>
              <div className="divide-y divide-slate-100">
                {[{ label: "Área total", val: formatArea(property.area) }, { label: "Artigo", val: "—" }, { label: "Concelho", val: property.concelho }, { label: "Freguesia", val: property.freguesia }].map((d, i) => (<div key={i} className="flex justify-between items-center px-6 py-4 text-xs"><span className="text-slate-400 font-bold uppercase">{d.label}</span><span className="text-slate-900 font-black">{d.val}</span></div>))}
              </div>
            </div>
          </div>
          
          <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">{page === 1 ? <>Análise do PDM Regional <Layers size={20} className="text-emerald-500" /></> : <>Simulação de Conversão Urbana <Activity size={20} className="text-emerald-500" /></>}</h3>
            <div className="space-y-8">
              {(page === 1 ? [
                { label: "Classificação do Solo", val: "Urbano", status: "ok" },
                { label: "Categoria de Espaço", val: "Agrícola de Produção", status: "ok" },
                { label: "Índice de Utilização (iu)", val: "0,15", status: "warning" },
                { label: "Cércea Máxima", val: "6,5 m (2 pisos)", status: "ok" },
                { label: "REN — Reserva Ecológica", val: "Parcialmente abrangido", status: "warning" },
                { label: "RAN — Reserva Agrícola", val: "Não abrangido", status: "ok" },
              ] : [
                { label: "Contiguidade Urbana", val: "280m ao limite", status: "ok" },
                { label: "Infraestruturas", val: "Saneamento a 420m", status: "warning" },
                { label: "Acessibilidade", val: "Estrada Municipal", status: "ok" },
                { label: "Score de Probabilidade", val: "66%", status: "ok" },
              ]).map((r, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className={r.status === 'ok' ? 'text-emerald-500' : 'text-amber-500'}>{r.status === 'ok' ? <CheckCircle size={26} strokeWidth={3} /> : <AlertTriangle size={26} strokeWidth={3} />}</div>
                    <span className="text-base font-bold text-slate-700">{r.label}</span>
                  </div>
                  <span className={`text-base font-black ${r.status === 'ok' ? 'text-slate-900' : 'text-amber-600'}`}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
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
