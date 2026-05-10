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
  Satellite, Map as MapIcon, Calculator, Globe2, Eye, EyeOff, HelpCircle, User
} from "lucide-react";

// ----------------- CONFIG & DB -----------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const db = createClient(supabaseUrl, supabaseAnonKey);

const ALLOWED_USERS = {
  "admin1@terracerta.pt": "portugal2026",
  "admin2@terracerta.pt": "portugal2026",
};

// ----------------- MOCK DATA -----------------
const PORTUGAL_GEO = {
  "Lisboa": ["Alvalade", "Areeiro", "Arroios", "Belém", "Benfica", "Campo de Ourique", "Campolide", "Carnide", "Estrela", "Lumiar", "Marvila", "Misericórdia", "Olivais", "Parque das Nações", "Penha de França", "Santa Maria Maior", "Santo António", "São Domingos de Benfica", "São Vicente"],
  "Oeiras": ["Algés, Linda-a-Velha e Cruz Quebrada-Dafundo", "Barcarena", "Carnaxide e Queijas", "Oeiras e São Julião da Barra, Paço de Arcos e Caxias", "Porto Salvo"],
  "Cascais": ["Alcabideche", "Carcavelos e Parede", "Cascais e Estoril", "São Domingos de Rana"],
  "Sintra": ["Algueirão-Mem Martins", "Casal de Cambra", "Colares", "Rio de Mouro", "Sintra", "Queluz e Belas"],
  "Porto": ["Bonfim", "Campanhã", "Cedofeita, Santo Ildefonso, Sé, Miragaia, São Nicolau e Vitória", "Lordelo do Ouro e Massarelos", "Paranhos", "Ramalde", "Vila Nova da Telha"]
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
      @keyframes drift { from { transform: translateX(-20vw); } to { transform: translateX(120vw); } }
      @keyframes fly { from { transform: translate(-10vw, 0); } to { transform: translate(110vw, -10vh); } }
      .tc-cloud { animation: drift var(--d, 120s) linear infinite both; animation-delay: var(--del, 0s); }
      .tc-bird { animation: fly var(--d, 60s) linear infinite both; animation-delay: var(--del, 0s); }
    `}</style>
    <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="bg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fbe7c4" /><stop offset="100%" stopColor="#c9825a" /></linearGradient>
        <radialGradient id="bg-sun" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fffaeb" stopOpacity="0.8" /><stop offset="100%" stopColor="#fffaeb" stopOpacity="0" /></radialGradient>
        <linearGradient id="bg-mountains" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7a8b8e" /><stop offset="100%" stopColor="#5b6e72" /></linearGradient>
        <linearGradient id="bg-hill-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a5d34" /><stop offset="100%" stopColor="#243d22" /></linearGradient>
        <linearGradient id="bg-field" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d4c685" /><stop offset="100%" stopColor="#a89255" /></linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#bg-sky)" />
      <circle cx="1400" cy="220" r="150" fill="url(#bg-sun)" />
      <path d="M0,520 L120,470 L210,495 L320,440 L420,475 L540,420 L660,460 L780,430 L900,475 L1040,440 L1180,490 L1320,455 L1480,485 L1620,445 L1780,475 L1920,455 L1920,600 L0,600 Z" fill="url(#bg-mountains)" />
      <path d="M0,780 Q400,700 800,740 T1500,720 T1920,740 L1920,1080 L0,1080 Z" fill="url(#bg-hill-near)" />
      <path d="M0,860 Q500,820 1000,840 T1920,830 L1920,1080 L0,1080 Z" fill="url(#bg-field)" opacity="0.9" />
      <svg className="absolute top-[5%] left-0 w-[15vw] tc-cloud opacity-60" style={{ '--d': '150s', '--del': '-20s' } } viewBox="0 0 200 60"><g fill="white" opacity="0.8"><ellipse cx="50" cy="35" rx="40" ry="18" /><ellipse cx="90" cy="28" rx="32" ry="20" /></g></svg>
      <svg className="absolute top-[15%] left-0 w-[6vw] tc-bird opacity-70" style={{ '--d': '80s', '--del': '-10s' } } viewBox="0 0 100 40" fill="none" stroke="#3a2818" strokeWidth="1.6"><path d="M5,20 q5,-7 10,0 q5,-7 10,0" /><path d="M30,28 q4,-6 8,0 q4,-6 8,0" /></svg>
    </svg>
  </div>
);

const Tooltip = ({ text }) => (
  <div className="group relative cursor-help inline-flex items-center ml-1.5">
    <HelpCircle size={12} className="text-slate-300" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-relaxed">
      {text}
    </div>
  </div>
);

const Nav = ({ page, onNavigate, user, onLogout }) => (
  <nav className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 bg-emerald-600 rounded flex items-center justify-center text-white"><Mountain size={14} strokeWidth={2.5} /></div>
        <span className="font-bold text-slate-800 tracking-tight">Terra<span className="text-emerald-600">Certa</span></span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onNavigate("dashboard")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${page === 'dashboard' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>Dashboard</button>
        <button onClick={() => onNavigate("sig")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${page === 'sig' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>Camadas SIG</button>
        <button onClick={() => onNavigate("upload")} className="px-3 py-1.5 rounded-md text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition flex items-center gap-1.5"><Plus size={14} /> Novo Terreno</button>
      </div>
    </div>
    <div className="flex items-center gap-5">
      <Bell size={16} className="text-slate-400 cursor-pointer hover:text-slate-600 transition" />
      <Settings size={16} className="text-slate-400 cursor-pointer hover:text-slate-600 transition" />
      <div className="h-4 w-px bg-slate-200 mx-1"></div>
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-200 transition"><User size={16} /></div>
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
    p.concelho?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Nav page="dashboard" onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <main className="p-8 max-w-[1280px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Carteira</p><h1 className="text-2xl font-bold text-slate-900">Dashboard de Terrenos</h1></div>
            <button onClick={onNew} className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 shadow-sm transition"><Plus size={16} /> Novo Terreno</button>
          </div>
          <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-50 transition"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar</button>
        </div>

        <div className="border border-slate-200 rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="relative w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por designação, concelho..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded text-xs focus:ring-1 focus:ring-emerald-500/20 transition" /></div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-slate-500 font-semibold text-xs border border-slate-200 px-3 py-2 rounded hover:bg-slate-50"><Filter size={14} /> Filtros</button>
              <span className="text-[10px] text-slate-400 font-medium">{filtered.length} terrenos</span>
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">Designação</th>
                <th className="px-5 py-3 font-medium">Concelho / Freguesia</th>
                <th className="px-5 py-3 font-medium">Artigo Matricial</th>
                <th className="px-5 py-3 font-medium">Área</th>
                <th className="px-5 py-3 font-medium">Classificação</th>
                <th className="px-5 py-3 font-medium text-center">Score</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} onClick={() => onSelect(p)} className="hover:bg-slate-50/80 transition cursor-pointer group">
                  <td className="px-5 py-4 font-bold text-slate-900">{p.designacao}</td>
                  <td className="px-5 py-4 text-slate-600 font-medium"><div>{p.concelho}</div><div className="text-[10px] text-slate-400">{p.freguesia}</div></td>
                  <td className="px-5 py-4 text-slate-600">—</td>
                  <td className="px-5 py-4 tabular-nums text-slate-900 font-semibold">{formatArea(p.area)}</td>
                  <td className="px-5 py-4 text-slate-600">Urbano</td>
                  <td className="px-5 py-4 text-center"><span className={`px-2 py-1 rounded font-bold text-[10px] ${scoreColor(p.score).bg} ${scoreColor(p.score).text}`}>{p.score}</span></td>
                  <td className="px-5 py-4"><span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase">Analisado</span></td>
                  <td className="px-5 py-4 text-slate-500">{p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : "2026-05-09"}</td>
                  <td className="px-5 py-4 text-slate-300 group-hover:text-slate-600 transition-colors text-right"><ChevronRight size={14} /></td>
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
  const [formData, setFormData] = useState({ designacao: "", concelho: "", freguesia: "", area: "", matricial: "", classificacao: "Urbano" });
  const [analysing, setAnalysing] = useState(false);
  const [files, setFiles] = useState({});

  const handleFile = (key) => {
    setFiles(prev => ({ ...prev, [key]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAnalysing(true);
    setTimeout(() => {
      onAnalyseDone({ id: "new-" + Math.random().toString(36).substr(2, 9), ...formData, score: 88, status: "Analisado" });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <Nav page="upload" onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <main className="p-8 max-w-[800px] mx-auto">
        <button onClick={onCancel} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 text-xs font-semibold transition"><ChevronLeft size={16} /> Voltar ao dashboard</button>
        <div className="mb-8"><h1 className="text-2xl font-bold text-slate-900 mb-2">Submissão de terreno</h1></div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-8 border border-slate-200 rounded-md space-y-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Dados do terreno</h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">Designação * <Tooltip text="Nome descritivo para identificar o terreno na plataforma." /></label>
              <input required value={formData.designacao} onChange={e => setFormData({...formData, designacao: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-emerald-500 transition outline-none" placeholder="Ex: Quinta da Ribeira" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">Artigo Matricial * <Tooltip text="Identificação única do imóvel na matriz predial (ex: 1234 / Secção B)." /></label>
                <input required value={formData.matricial} onChange={e => setFormData({...formData, matricial: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ex: 1452 / Secção B" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">Área (m²) * <Tooltip text="Área total da parcela conforme descrita na caderneta predial." /></label>
                <input required type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ex: 12450" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">Concelho * <Tooltip text="Concelho onde o terreno está localizado." /></label>
                <select required value={formData.concelho} onChange={e => setFormData({...formData, concelho: e.target.value, freguesia: ""})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value="">Selecionar concelho...</option>
                  {Object.keys(PORTUGAL_GEO).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">Freguesia * <Tooltip text="Freguesia específica dentro do concelho selecionado." /></label>
                <select required value={formData.freguesia} onChange={e => setFormData({...formData, freguesia: e.target.value})} disabled={!formData.concelho} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50">
                  <option value="">{formData.concelho ? "Selecionar freguesia..." : "—"}</option>
                  {formData.concelho && PORTUGAL_GEO[formData.concelho].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">Classificação Atual * <Tooltip text="Classificação atual do solo segundo o PDM (Urbano ou Rústico)." /></label>
              <select value={formData.classificacao} onChange={e => setFormData({...formData, classificacao: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500"><option value="Urbano">Urbano</option><option value="Rústico">Rústico</option></select>
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
                <div className="flex gap-4 items-center">
                  <div className={`h-10 w-10 rounded flex items-center justify-center ${files[d.id] ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{files[d.id] ? <CheckCircle size={20} /> : <FileText size={18} />}</div>
                  <div><div className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-900">{d.label}</span><span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded tracking-tighter">{d.formats}</span></div><p className="text-[11px] text-slate-500">{d.sub}</p></div>
                </div>
                <button type="button" onClick={() => handleFile(d.id)} className={`flex items-center gap-2 px-3 py-1.5 border rounded text-[10px] font-bold transition ${files[d.id] ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {files[d.id] ? <><CheckCircle size={12} /> Carregado (Alterar)</> : <><Upload size={12} /> Carregar</>}
                </button>
              </div>
            ))}
          </div>
          <button type="submit" disabled={analysing} className="w-full bg-emerald-600 text-white py-4 rounded-md font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-md transition disabled:opacity-50 tracking-wide uppercase text-xs">{analysing ? <Loader2 className="animate-spin" size={20} /> : "Iniciar Análise de Viabilidade"}</button>
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
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4"><button onClick={onBack} className="hover:text-slate-600 transition">Dashboard</button><ChevronRight size={10} /><span className="text-slate-600">{property.id?.slice(0, 8)}...</span></div>
        <div className="flex items-center justify-between mb-8">
          <div><h2 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Análise de Viabilidade</h2><h1 className="text-3xl font-bold text-slate-900">{property.designacao}</h1><div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium"><div className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-300" /> {property.concelho}, {property.freguesia}</div><div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-300" /> Emitido 2026-05-09</div></div></div>
          <div className="flex gap-2"><div className="flex bg-slate-200/50 p-1 rounded-lg border border-slate-200"><button onClick={() => setPage(1)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${page === 1 ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>1 · Análise PDM</button><button onClick={() => setPage(2)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${page === 2 ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>2 · Conversão Urbana</button></div><button className="flex items-center gap-2 px-4 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-white transition"><ExternalLink size={14} /> Abrir no mapa</button></div>
        </div>

        {page === 1 ? (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden"><div className={`absolute top-0 left-0 w-full h-1 ${c.fill}`}></div><div className="relative mb-6"><svg className="w-48 h-48 transform -rotate-90"><circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" /><circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552.9} strokeDashoffset={552.9 * (1 - property.score / 100)} className={`${c.text} transition-all duration-1000 ease-out`} strokeLinecap="round" /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className={`text-6xl font-black ${c.text} tracking-tighter`}>{property.score}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Health Score / 100</span></div></div><div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 ${c.bg} ${c.text} border ${c.border}`}>{c.label}</div><p className="text-xs text-slate-500 leading-relaxed font-medium">Score calculado com base em 14 indicadores do PDM, condicionantes legais e camadas oficiais do território.</p></div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"><div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dados extraídos</h3><div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black tracking-tighter border border-emerald-100 uppercase">OCR <CheckCircle size={10} /></div></div>
                <div className="p-0 divide-y divide-slate-100">
                  {[ { label: "Concelho", val: property.concelho }, { label: "Freguesia", val: property.freguesia }, { label: "Área total", val: formatArea(property.area) }, { label: "PDM aplicável", val: "PDM-OEIRAS-1234" } ].map((d, i) => (<div key={i} className="flex justify-between items-center px-6 py-3.5 text-xs"><span className="text-slate-400 font-medium">{d.label}</span><span className="text-slate-900 font-bold">{d.val}</span></div>))}
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8"><div><h3 className="text-lg font-bold text-slate-900 mb-1">Análise PDM <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 ml-2 tracking-widest">Tempo Real</span></h3><p className="text-xs text-slate-500 font-medium italic leading-relaxed">Interpretação automática do regulamento e cruzamento com camadas oficiais.</p></div><div className="text-[10px] font-bold text-slate-400">Fonte: DGT</div></div>
                <div className="space-y-6">{[ { label: "Classificação do solo", val: "Urbano", meta: "Art. 14º", status: "ok" }, { label: "Categoria de espaço", val: "Espaço Agrícola", meta: "Planta Ord.", status: "ok" }, { label: "Índice utilização", val: "0,15", meta: "Art. 30º", status: "warning" }, { label: "Cércea máxima", val: "6,5 m", meta: "Art. 31º", status: "ok" }, { label: "REN", val: "Parcial (18%)", meta: "Condic.", status: "warning" }, { label: "Risco Incêndio", val: "Classe Média", meta: "ICNF", status: "ok" } ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm group"><div className="flex items-center gap-4"><div className={r.status === 'ok' ? 'text-emerald-500' : 'text-amber-500'}>{r.status === 'ok' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}</div><span className="text-slate-700 font-semibold">{r.label}</span></div><div className="flex items-center gap-6"><span className="text-slate-900 font-bold text-right">{r.val}</span><span className="text-[10px] text-slate-400 font-bold uppercase w-24 text-right">{r.meta}</span></div></div>
                ))}</div>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-8 shadow-sm"><h3 className="text-emerald-900 font-black text-[11px] uppercase tracking-widest mb-6 flex items-center gap-2"><Sparkles size={16} /> Recomendações</h3><div className="space-y-4">{[ "Solicitar delimitação da área REN ao ICNF.", "iu de 0,15 permite construção reduzida. Avaliar PIP." ].map((rec, i) => (<div key={i} className="flex gap-4 text-xs text-emerald-800 leading-relaxed font-medium"><span className="font-black text-emerald-600/50 italic">0{i+1}</span><p>{rec}</p></div>))}</div></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm"><h3 className="font-bold text-slate-900 mb-2">Conversão Urbana</h3><div className="grid grid-cols-3 gap-6 mt-8">{[ { label: "PROBABILIDADE", v: "66%", sub: "5-7 anos", c: "text-emerald-600 bg-emerald-50" }, { label: "CUSTO EST.", v: "€ 8.400", sub: "taxas", c: "bg-slate-50" }, { label: "PRAZO MÉDIO", v: "14-22 meses", sub: "incl. discussão", c: "bg-slate-50" } ].map((k, i) => (<div key={i} className={`p-5 rounded-xl border border-slate-100 ${k.c}`}><div className="text-[9px] font-black text-slate-400 uppercase mb-4">{k.label}</div><div className="text-2xl font-black text-slate-900 mb-1">{k.v}</div><div className="text-[10px] text-slate-500 font-bold">{k.sub}</div></div>))}</div></div>
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm"><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Score Conversão</h3><div className="text-6xl font-black text-lime-600 tracking-tighter">66</div><p className="text-[10px] font-bold text-slate-400 mt-2">Probabilidade ponderada</p></div>
              <button className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition uppercase text-xs tracking-wider"><Download size={20} /> Exportar PDF</button>
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
  const props = { properties, loading, onRefresh: fetchProperties, onNew: () => setView("upload"), onSelect: (p) => { setSelected(p); setView("analysis"); setAnalysisPage(1); }, user, onLogout: () => setUser(null), onNavigate: setView };
  if (view === "dashboard") return <Dashboard {...props} />;
  if (view === "upload") return <UploadPage {...props} onCancel={() => setView("dashboard")} onAnalyseDone={(p) => { setSelected(p); setView("analysis"); setAnalysisPage(1); }} />;
  if (view === "analysis" && selected) return <AnalysisPage property={selected} page={analysisPage} setPage={setAnalysisPage} onBack={() => setView("dashboard")} user={user} onLogout={() => setUser(null)} onNavigate={setView} />;
  return <div className="min-h-screen bg-white"><Nav page={view} onNavigate={setView} user={user} onLogout={() => setUser(null)} /><main className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-slate-400 italic">Em desenvolvimento</main></div>;
}
