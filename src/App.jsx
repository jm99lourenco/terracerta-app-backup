import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import {
  Upload, FileText, MapPin, Ruler, Trash2, MessageCircle, Send, BookOpen,
  Calendar, Hash, Search, Plus, ChevronRight, ChevronLeft, X,
  Download, CheckCircle2, AlertCircle, XCircle, TrendingUp,
  LogOut, Settings, Filter, ArrowUpDown, FileCheck,
  Building2, Mountain, Lock, Mail, Layers,
  Shield, Activity, Zap, ArrowRight, Sparkles, AlertTriangle,
  CheckCircle, Info, ExternalLink, Bell, Loader2, RefreshCw,
  Satellite, Map as MapIcon, Calculator, Globe2, Eye, EyeOff, HelpCircle,
  Home, ChevronDown, Archive, User, LifeBuoy, FolderOpen, PieChart, BarChart3, ScanLine
} from "lucide-react";
import { MapContainer, TileLayer, Polygon, FeatureGroup, Marker, Popup, LayersControl as LC, WMSTileLayer } from "react-leaflet";
import { toJpeg } from "html-to-image";
import i18next from "i18next";
import { RegulamentosPage } from "./RegulamentosPage";
import { PORTUGAL_GEO } from "./data/portugalGeo";
const Tooltip = ({ text }) => (
  <div className="group relative cursor-help inline-block ml-1" data-html2canvas-ignore>
    <HelpCircle size={12} className="text-slate-300 hover:text-slate-500 transition" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 text-center shadow-lg font-normal">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

const RadarChart = ({ score }) => {
  const size = 120;
  const center = size / 2;
  const radius = 45;
  const axes = [score + 5, score - 10, score + 15, score].map(v => Math.min(100, Math.max(0, v)));
  const getPoints = (arr) => arr.map((s, i) => {
    const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
    const r = (s / 100) * radius;
    return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
  }).join(' ');

  return (
    <svg width={size} height={size} className="mx-auto overflow-visible">
       <polygon points={getPoints([100,100,100,100])} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
       <line x1={center} y1={center-radius} x2={center} y2={center+radius} stroke="#e2e8f0" strokeWidth="1" />
       <line x1={center-radius} y1={center} x2={center+radius} y2={center} stroke="#e2e8f0" strokeWidth="1" />
       <polygon points={getPoints(axes)} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="2"/>
       <text x={center} y={center-radius-5} fontSize="6" textAnchor="middle" fill="#64748b" fontWeight="bold">Edificabilidade</text>
       <text x={center+radius+5} y={center+2} fontSize="6" textAnchor="start" fill="#64748b" fontWeight="bold">Infraest</text>
       <text x={center} y={center+radius+10} fontSize="6" textAnchor="middle" fill="#64748b" fontWeight="bold">Ambiental</text>
       <text x={center-radius-5} y={center+2} fontSize="6" textAnchor="end" fill="#64748b" fontWeight="bold">Localização</text>
    </svg>
  );
};


// ----------------- CONFIG & DB -----------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const db = createClient(supabaseUrl, supabaseAnonKey);

const ALLOWED_USERS = {
  "admin1@terracerta.pt": "portugal2026",
  "admin2@terracerta.pt": "portugal2026",
};



// ----------------- UTILS -----------------
const formatNumber = (n) => n == null ? "—" : new Intl.NumberFormat("pt-PT").format(n);
const formatArea = (m2) => {
  if (m2 == null || m2 === 0) return "—";
  if (m2 >= 10000) return `${(m2 / 10000).toLocaleString("pt-PT", { maximumFractionDigits: 2 })} ha`;
  return `${formatNumber(m2)} m²`;
};

const TRANSLATIONS = {
  pt: { loginTitle: "Iniciar sessão", emailLabel: "Email profissional", passwordLabel: "Palavra-passe", forgotPassword: "Esqueci-me da Password", loginButton: "Entrar na plataforma", tagline: "Análise de Viabilidade Territorial", forgotMsg: "Para recuperar a sua palavra-passe, contacte o suporte técnico.", loggingIn: "A entrar...", lang: "Português", flag: "🇵🇹" },
  en: { loginTitle: "Sign In", emailLabel: "Professional Email", passwordLabel: "Password", forgotPassword: "Forgot password?", loginButton: "Enter Platform", tagline: "Territorial Viability Analysis", forgotMsg: "To recover your password, contact support.", loggingIn: "Signing in...", lang: "English", flag: "🇺🇸" },
  fr: { loginTitle: "Se connecter", emailLabel: "Email professionnel", passwordLabel: "Mot de passe", forgotPassword: "Mot de passe oublié ?", loginButton: "Entrer", tagline: "Analyse de viabilité territoriale", forgotMsg: "Pour récupérer votre mot de passe, contactez le support.", loggingIn: "Connexion...", lang: "Français", flag: "🇫🇷" },
};

const Logo = ({ size = "md", invert = false, langLabel }) => {
  const dims = size === "lg" ? "h-9" : size === "sm" ? "h-6" : "h-7";
  const textColor = invert ? "text-white" : "text-slate-900";
  const subColor = invert ? "text-white/60" : "text-slate-500";
  return (
    <div className="flex items-center gap-2">
      <div className={`${dims} aspect-square rounded-md bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-sm`}>
        <Mountain className="text-white" size={size === "lg" ? 20 : size === "sm" ? 14 : 16} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-bold tracking-tight ${textColor} ${size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg"}`}>Terra<span className="text-emerald-400">Certa</span></span>
        {langLabel && <span className={`text-[9px] font-semibold uppercase tracking-widest mt-0.5 ${subColor}`}>{langLabel}</span>}
      </div>
    </div>
  );
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
      <g transform="translate(1550, 700)" opacity="0.85">
        <rect x="0" y="20" width="48" height="28" fill="#f0e1c8" /><polygon points="-4,20 24,4 52,20" fill="#8b4f3a" /><rect x="20" y="32" width="8" height="16" fill="#3a2818" /><rect x="6" y="28" width="6" height="6" fill="#3a2818" /><rect x="34" y="28" width="6" height="6" fill="#3a2818" />
      </g>
    </svg>
    <svg className="absolute top-[8%] left-0 w-[20vw] max-w-[260px] tc-cloud-a opacity-90 pointer-events-none" viewBox="0 0 200 60"><g fill="white" opacity="0.85"><ellipse cx="50" cy="35" rx="40" ry="18" /><ellipse cx="90" cy="28" rx="32" ry="20" /><ellipse cx="130" cy="35" rx="38" ry="16" /></g></svg>
    <svg className="absolute top-[22%] left-0 w-[12vw] max-w-[180px] tc-birds opacity-70 pointer-events-none" viewBox="0 0 100 40" fill="none" stroke="#3a2818" strokeWidth="1.6"><path d="M5,20 q5,-7 10,0 q5,-7 10,0" /><path d="M30,28 q4,-6 8,0 q4,-6 8,0" /></svg>
  </div>
);

const Sidebar = ({ page, onNavigate, user, onLogout }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState({
    operacao: true,
    pdm: true,
    cofre: false,
    conta: false
  });

  const toggle = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const NavItem = ({ id, label, icon: Icon, onClick, active }) => (
    <button
      onClick={onClick || (() => onNavigate(id))}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all rounded-lg mb-1 ${
        active 
          ? "bg-emerald-50 text-emerald-700 shadow-sm" 
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon size={18} />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );

  const SubMenu = ({ label, icon: Icon, section, children }) => (
    <div className="mb-2">
      <button
        onClick={() => toggle(section)}
        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors mb-1"
      >
        <Icon size={14} />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown size={14} className={`transition-transform ${expanded[section] ? "" : "-rotate-90"}`} />
      </button>
      {expanded[section] && <div className="pl-2 space-y-1">{children}</div>}
    </div>
  );

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 cursor-pointer mb-8" onClick={() => onNavigate("dashboard")}>
          <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Mountain size={20} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-slate-800 tracking-tight text-xl">TerraCerta</span>
        </div>

        <nav className="space-y-6">
          <div>
            <NavItem 
              id="dashboard" 
              label="Dashboard" 
              icon={Home} 
              active={page === "dashboard"} 
            />
          </div>

          <SubMenu label="Operação" icon={Zap} section="operacao">
            <NavItem 
              id="upload" 
              label="Análise de Terreno" 
              icon={Plus} 
              active={page === "upload"} 
            />
            <NavItem 
              id="explore" 
              label="Explorador SIG" 
              icon={Globe2} 
              active={page === "explore"} 
            />
            <NavItem 
              id="archive" 
              label="Arquivo" 
              icon={Archive} 
              active={page === "archive"} 
              onClick={() => onNavigate("dashboard")}
            />
          </SubMenu>

          <SubMenu label="Monitor PDM" icon={Shield} section="pdm">
            <NavItem 
              id="pdm" 
              label="Regulamentos" 
              icon={BookOpen} 
              active={page === "pdm"} 
            />
            <NavItem 
              id="pdm_revision" 
              label="PDM em Revisão" 
              icon={AlertTriangle} 
              active={page === "pdm_revision"} 
            />
          </SubMenu>

          <SubMenu label="Cofre" icon={Lock} section="cofre">
            <NavItem 
              id="vault" 
              label="Gestão Documentos" 
              icon={FileText} 
              active={page === "vault"} 
            />
          </SubMenu>

          <SubMenu label="Conta" icon={User} section="conta">
            <NavItem 
              id="settings" 
              label="Configurações" 
              icon={Settings} 
              active={page === "settings"} 
            />
            <NavItem 
              id="logout" 
              label="Sair" 
              icon={LogOut} 
              onClick={onLogout}
            />
          </SubMenu>
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold uppercase border border-emerald-200">
            {user ? user[0] : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.split("@")[0]}</p>
            <p className="text-[10px] text-slate-400 truncate">Sócio Principal</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lang, setLang] = useState("pt");
  const [showLang, setShowLang] = useState(false);

  const t = TRANSLATIONS[lang];

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
        <Logo size="lg" invert langLabel={t.tagline} />
        
        {/* Language Selector */}
        <div className="relative">
          <button onClick={() => setShowLang(!showLang)} className="flex items-center gap-2 px-3 py-2 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-md border border-white/10 text-white transition">
            <span className="text-lg">{t.flag}</span>
            <span className="text-xs font-semibold uppercase tracking-wider">{lang}</span>
          </button>
          {showLang && (
            <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-30">
              {Object.entries(TRANSLATIONS).map(([key, value]) => (
                <button key={key} onClick={() => { setLang(key); i18next.changeLanguage(key); setShowLang(false); }} className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 transition ${lang === key ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600'}`}>
                  <span>{value.flag}</span> {value.lang}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className="w-full max-w-[420px] bg-white rounded-xl shadow-2xl p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <h1 className="text-3xl font-bold text-[#0f172a] mb-10">{t.loginTitle}</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.emailLabel}</label>
            <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none transition text-slate-600 placeholder:text-slate-300" placeholder="nome@terracerta.pt" /></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.passwordLabel}</label>
              <button type="button" onClick={() => alert(t.forgotMsg)} className="text-[11px] text-emerald-700 font-bold hover:underline">{t.forgotPassword}</button>
            </div>
            <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none transition text-slate-600" placeholder="••••••••••" /></div>
          </div>
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
          <button type="submit" disabled={submitting} className="w-full bg-[#0f172a] text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition transform active:scale-[0.98] disabled:opacity-50">{submitting ? <Loader2 className="animate-spin" size={18} /> : <>{t.loginButton} <ArrowRight size={18} /></>}</button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({ properties, loading, onRefresh, onNew, onSelect, onDelete, user, onLogout, onNavigate }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const filtered = properties.filter(p => 
    p.designacao?.toLowerCase().includes(search.toLowerCase()) || 
    p.concelho?.toLowerCase().includes(search.toLowerCase()) ||
    p.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-8 max-w-[1280px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-2xl font-bold text-slate-900">Dashboard</h1></div>
          <div className="flex gap-3">
            <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-50 transition"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar</button>
            <button onClick={onNew} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 shadow-sm transition"><Plus size={16} /> Novo Terreno</button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="relative w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por designação, concelho, ID..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded text-xs focus:ring-1 focus:ring-emerald-500/20 transition" /></div>
            <div className="flex items-center gap-4"><button className="flex items-center gap-2 text-slate-500 font-semibold text-xs border border-slate-200 px-3 py-2 rounded hover:bg-slate-50"><Filter size={14} /> Filtros</button></div>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th><th className="px-5 py-3 font-medium">Designação</th><th className="px-5 py-3 font-medium">Concelho / Freguesia</th><th className="px-5 py-3 font-medium">Área</th><th className="px-5 py-3 font-medium">Score</th><th className="px-5 py-3 font-medium">Estado</th><th className="px-5 py-3 font-medium">Data</th><th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} onClick={() => onSelect(p)} className="hover:bg-slate-50/80 transition cursor-pointer group">
                  <td className="px-5 py-4 text-slate-400 font-mono text-[10px]">{p.id.slice(0, 8)}...</td>
                  <td className="px-5 py-4 font-bold text-slate-900">{p.designacao}</td>
                  <td className="px-5 py-4 text-slate-600 font-medium"><div>{p.concelho}</div><div className="text-[10px] text-slate-400">{p.freguesia}</div></td>
                  <td className="px-5 py-4 tabular-nums text-slate-900 font-semibold">{formatArea(p.area)}</td>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${scoreColor(p.score).fill}`} style={{ width: `${p.score}%` }}></div></div><span className={`font-bold ${scoreColor(p.score).text}`}>{p.score}</span></div></td>
                  <td className="px-5 py-4"><span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase">Analisado</span></td>
                  <td className="px-5 py-4 text-slate-500">{p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : "2026-05-09"}</td>
                  <td className="px-5 py-4 text-slate-300 transition-colors text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={(e) => { e.stopPropagation(); if(confirm("Apagar registo?")) onDelete(p.id); }} className="hover:text-rose-500 p-1.5 rounded hover:bg-rose-50 transition"><Trash2 size={14} /></button>
                      <ChevronRight size={14} className="group-hover:text-slate-600" />
                    </div>
                  </td>
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
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ designacao: "", distrito: "", concelho: "", freguesia: "", area: "", matricial: "" });
  const [analysing, setAnalysing] = useState(false);
  const [simulatingOcr, setSimulatingOcr] = useState(false);
  const [files, setFiles] = useState({});
  const fileInputRef = useRef(null);
  const [activeFileKey, setActiveFileKey] = useState(null);

  const handleFileClick = (key) => { setActiveFileKey(key); fileInputRef.current?.click(); };
  const handleRemoveFile = (key, e) => {
    e.stopPropagation();
    setFiles(prev => { const n = {...prev}; delete n[key]; return n; });
  };

  const handleFileChange = (e) => { 
    if (e.target.files?.length && activeFileKey) { 
      setFiles(prev => ({ ...prev, [activeFileKey]: e.target.files[0].name })); 
      if (activeFileKey === "caderneta") {
        setSimulatingOcr(true);
        setTimeout(() => {
            setFormData(prev => ({
                ...prev,
                designacao: "Terreno Extraído",
                distrito: "Lisboa",
                concelho: "Lisboa",
                freguesia: "Belém",
                area: "1250",
                matricial: "9876",
                lat: 38.6979,
                lng: -9.2064
            }));
            setSimulatingOcr(false);
        }, 1500);
      }
      setActiveFileKey(null); 
    } 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAnalysing(true);
    const valArea = parseFloat(formData.area) || 140;
    
    // Algoritmo V4 Health Score
    // Base: Urbano (40) / Rústico (10)
    const baseScore = formData.designacao.toLowerCase().includes("urbano") ? 40 : 10;
    
    // Edificabilidade: Iu fictício baseado na área
    const iuScore = valArea < 1000 ? 20 : 10; 
    
    // Condicionantes (Simulação de REN/RAN dependendo da freguesia)
    const hasREN = formData.freguesia.length % 2 === 0;
    const hasRAN = formData.freguesia.length % 3 === 0;
    const penalization = (hasREN ? -30 : 0) + (hasRAN ? -15 : 0);
    
    // Infraestruturas
    const infraScore = valArea < 5000 ? 10 : 0;
    
    let finalScore = Math.min(100, Math.max(0, baseScore + iuScore + penalization + infraScore + 40)); // +40 pad para simular


    const novoTerreno = {
      designacao: formData.designacao || "Terreno sem nome",
      concelho: formData.concelho,
      freguesia: formData.freguesia,
      area: valArea,
      score: finalScore,
      status: "Analisado",
      lat: formData.lat || 38.7071,
      lng: formData.lng || -9.1355
    };

    try {
      const { data, error } = await db.from('propriedades').insert([novoTerreno]).select().single();
      if (error) throw error;
      onAnalyseDone(data || novoTerreno);
    } catch (err) {
      console.error("Erro ao guardar no Supabase:", err);
      novoTerreno.id = "new-" + Math.random().toString(36).substr(2, 9);
      onAnalyseDone(novoTerreno);
    }
  };

  const concelhosNoDistrito = formData.distrito ? PORTUGAL_GEO[formData.distrito] : [];

  return (
    <div className="min-h-screen">
      <main className="p-8 max-w-[800px] mx-auto">
        <button onClick={onCancel} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 text-xs font-semibold transition"><ChevronLeft size={16} /> Voltar ao dashboard</button>
        <div className="mb-8"><h1 className="text-2xl font-bold text-slate-900 mb-2">Novo Terreno</h1></div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          
          <div className="space-y-3 relative">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">1. Documentação Base</h3>
            {simulatingOcr && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl border border-emerald-200">
                <Loader2 className="animate-spin text-emerald-600 mb-2" size={24} />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">A extrair dados via OCR...</span>
              </div>
            )}
            {[
              { id: "caderneta", label: "Caderneta Predial" },
              { id: "planta", label: "Planta de Localização (Opcional)" },
              { id: "certidao", label: "Certidão Permanente" },
            ].map((d) => (
              <div key={d.id} className="p-5 border border-slate-200 rounded-md flex items-center justify-between bg-white hover:border-emerald-200 transition">
                <div className="flex gap-4 items-center">
                  <div className={`h-10 w-10 rounded flex items-center justify-center ${files[d.id] ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{files[d.id] ? <CheckCircle size={20} /> : <FileText size={18} />}</div>
                  <div><span className="text-sm font-semibold text-slate-900">{d.label}</span><p className="text-[11px] text-slate-500">{files[d.id] ? `Selecionado: ${files[d.id]}` : "Ficheiro PDF"}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  {files[d.id] ? (
                    <button type="button" onClick={(e) => handleRemoveFile(d.id, e)} className="flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold text-rose-500 hover:bg-rose-50 transition"><X size={14} /> Remover</button>
                  ) : (
                    <button type="button" onClick={() => handleFileClick(d.id)} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition"><Upload size={12} /> Carregar</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 border border-slate-200 rounded-md space-y-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">2. Dados do Terreno</h3>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Designação *<Tooltip text="Nome descritivo para identificar a propriedade."/></label>
              <input required value={formData.designacao} onChange={e => setFormData({...formData, designacao: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ex: Quinta da Ribeira" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Distrito *<Tooltip text="Distrito administrativo onde se localiza o terreno."/></label>
                <select required value={formData.distrito} onChange={e => setFormData({...formData, distrito: e.target.value, concelho: "", freguesia: ""})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500"><option value="">Distrito...</option>{Object.keys(PORTUGAL_GEO).map(d => <option key={d} value={d}>{d}</option>)}</select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Concelho *<Tooltip text="Município correspondente ao distrito selecionado."/></label>
                <select required value={formData.concelho} onChange={e => setFormData({...formData, concelho: e.target.value, freguesia: ""})} disabled={!formData.distrito} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"><option value="">Concelho...</option>{concelhosNoDistrito.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Freguesia *<Tooltip text="Freguesia específica da localização do imóvel."/></label>
                <input required value={formData.freguesia} onChange={e => setFormData({...formData, freguesia: e.target.value})} disabled={!formData.concelho} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400" placeholder="Freguesia..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Artigo Matricial *<Tooltip text="Referência da Caderneta Predial (Finanças)."/></label>
                <input required value={formData.matricial} onChange={e => setFormData({...formData, matricial: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ex: 1452" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Área (m²) *<Tooltip text="Área total do terreno em metros quadrados."/></label>
                <input required type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ex: 12450" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={analysing || simulatingOcr} className="w-full bg-emerald-600 text-white py-4 rounded-md font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-md transition disabled:opacity-50">{analysing ? <Loader2 className="animate-spin" size={20} /> : "Iniciar Análise de Viabilidade"}</button>
        </form>
      </main>
    </div>
  );
};

const AnalysisPage = ({ property, page, setPage, onBack, user, onLogout, onNavigate }) => {
  const { t } = useTranslation();
  const c = scoreColor(property.score);
  const analysisRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const mapCenter = [property.lat || 38.7071, property.lng || -9.1355];

  const exportPDF = async () => {
    if (!analysisRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toJpeg(analysisRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        fontEmbedCSS: '',
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Viabilidade_${property.id || 'terreno'}.pdf`);
    } catch (err) {
      console.error("Erro ao exportar:", err);
      alert("Não foi possível exportar o PDF neste momento.");
    } finally {
      setExporting(false);
    }
  };

  const pdmItems = [
    { label: "Classificação do solo", val: "Rústico", source: "PDM Art. 14º", status: "ok" },
    { label: "Categoria de espaço", val: "Espaço Agrícola de Produção (Tipo II)", source: "Planta de Ordenamento", status: "ok" },
    { label: "Subcategoria", val: "Áreas agrícolas complementares", source: "PDM Art. 27º nº2", status: "ok" },
    { label: "Índice de utilização (Iu)", val: "0,15", source: "PDM Art. 30º", status: "warning" },
    { label: "Cércea máxima", val: "6,5 m (2 pisos)", source: "PDM Art. 31º", status: "ok" },
    { label: "REN — Reserva Ecológica", val: "Parcialmente abrangido (≈18%)", source: "Planta de Condicionantes", status: "warning" },
    { label: "RAN — Reserva Agrícola", val: "Não abrangido", source: "DRAP", status: "ok" },
    { label: "Servidão rodoviária", val: "Faixa non aedificandi 12m (EN229)", source: "DL 13/94", status: "warning" },
    { label: "Risco de incêndio rural", val: "Classe Média", source: "ICNF · Carta 2025", status: "ok" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <main className="p-8 max-w-[1280px] mx-auto">
        
        {/* Top Header Match Screenshot */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
           <span className="text-slate-500">ANÁLISE DE VIABILIDADE</span>
        </div>
        
        <div className="flex items-start justify-between mb-8" data-html2canvas-ignore>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">{property.designacao}</h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-300" /> {property.freguesia}, {property.concelho}</div>
              <div className="text-slate-300">#</div>
              <div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-300" /> Emitido 2026-05-10</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 shadow-inner">
              <button onClick={() => setPage(1)} className={`px-4 py-1.5 rounded text-xs font-bold transition ${page === 1 ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>1 · Análise PDM</button>
              <button onClick={() => setPage(2)} className={`px-4 py-1.5 rounded text-xs font-bold transition ${page === 2 ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>2 · Conversão Urbano</button>
            </div>
            <button onClick={() => setPage('map')} className={`flex items-center gap-2 px-4 py-1.5 border border-slate-200 text-slate-700 rounded-md text-xs font-bold transition ${page === 'map' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white hover:bg-slate-50'}`}>
              <ExternalLink size={14} /> Abrir no mapa
            </button>
            <button onClick={exportPDF} disabled={exporting} className="flex items-center gap-2 px-4 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold transition hover:bg-emerald-100">
              <Download size={14} /> Exportar
            </button>
          </div>
        </div>

        {/* View Map Full width */}
                <div ref={analysisRef} className="bg-transparent" style={{ width: '1280px', maxWidth: '100%' }}>
          {/* PDF HEADER */}
          <div className="hidden pdf-header bg-white pb-6 mb-6 border-b border-slate-200">
             <div className="flex justify-between items-start">
                <div className="flex-1">
                   <Logo size="lg" />
                   <div className="mt-8">
                     <h2 className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">Análise de Viabilidade</h2>
                     <h1 className="text-3xl font-bold text-slate-900 leading-tight">{property.designacao}</h1>
                     <p className="text-sm text-slate-500 mt-2"><MapPin size={12} className="inline mr-1" /> {property.freguesia}, {property.concelho} · Emitido a 2026-05-10</p>
                   </div>
                </div>
                <div className="w-64 pt-6"><RadarChart score={property.score} /></div>
             </div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `@media print { .pdf-header { display: block !important; } } [data-html2canvas-ignore] { display: none !important; }`}} />

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* LEFT COLUMN */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
              
              {/* Score Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="relative mb-6">
                  <svg className="w-48 h-48 transform -rotate-90"><circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" /><circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552.9} strokeDashoffset={552.9 * (1 - property.score / 100)} className={`${c.text} transition-all duration-1000 ease-out`} strokeLinecap="round" /></svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-6xl font-black ${c.text} tracking-tighter`}>{property.score}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Health Score<br/>/ 100</span>
                  </div>
                </div>
                <div className={`px-6 py-2 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border} mb-6`}>{c.label}</div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[250px]">Score calculado com base em 14 indicadores do PDM, condicionantes legais e camadas oficiais do território.</p>
              </div>
              
              {/* OCR Card */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dados Extraídos</h3>
                  <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold border border-emerald-100">OCR ✓</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    { label: "Concelho", val: property.concelho },
                    { label: "Freguesia", val: property.freguesia },
                    { label: "Artigo matricial", val: property.matricial || "—" },
                    { label: "Área total", val: formatArea(property.area) },
                    { label: "Confrontações", val: "N: caminho público" },
                    { label: "Inscrição", val: "Definitiva 2018-04-12" },
                    { label: "PDM aplicável", val: "—" },
                  ].map((d, i) => (
                    <div key={i} className="flex justify-between items-center px-6 py-3.5 text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-300"></div>{d.label}</span>
                      <span className="text-slate-900 font-bold text-right">{d.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              
              {/* PDM Analysis Card */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100">
                   <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-3">
                       <h3 className="text-lg font-bold text-slate-900">{page === 1 ? 'Análise PDM' : 'Conversão Urbano'}</h3>
                       <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold border border-emerald-100 uppercase tracking-widest">Tempo Real</div>
                     </div>
                     <span className="text-xs text-slate-400">Fonte oficial DGT</span>
                   </div>
                   <p className="text-xs text-slate-500">Interpretação automática do regulamento e cruzamento com 9 camadas oficiais.</p>
                </div>
                
                <div className="divide-y divide-slate-100 px-8">
                  {pdmItems.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-4 group">
                      <div className="flex items-center gap-4 w-1/3">
                        <div className={r.status === 'ok' ? 'text-emerald-500' : 'text-amber-500'}>{r.status === 'ok' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}</div>
                        <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">{r.label} <Tooltip text="Definição regulamentar consultada via PDM local."/></span>
                      </div>
                      <div className="w-1/3 text-left">
                        <span className="text-xs font-bold text-slate-900">{r.val}</span>
                      </div>
                      <div className="w-1/3 text-right">
                        <span className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase">{r.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex justify-between items-center text-xs">
                  <div className="flex gap-4 font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle size={14}/> 5 conformes</span>
                    <span className="flex items-center gap-1.5 text-amber-600"><AlertTriangle size={14}/> 4 condicionantes</span>
                    <span className="flex items-center gap-1.5 text-rose-500"><XCircle size={14}/> 0 inviáveis</span>
                  </div>
                  <a href="#" className="text-emerald-600 font-bold hover:underline flex items-center gap-1">Ver regulamento integral <ExternalLink size={12}/></a>
                </div>
              </div>
              
              {/* Recommendations Card */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-8">
                <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2"><Sparkles size={16} className="text-emerald-600"/> Recomendações do TerraCerta</h3>
                <div className="space-y-4">
                  {[
                    "Solicitar delimitação da área REN ao ICNF antes de qualquer pedido de informação prévia.",
                    "A faixa non aedificandi da EN229 reduz a área útil edificável em ~9%. Considerar no estudo prévio.",
                    "Iu de 0,15 permite até 750 m² de construção. Avaliar PIP para confirmar.",
                    "O PDM tem 3ª Alteração por Adaptação em vigor desde 12/03/2025 — recomenda-se confirmar versão."
                  ].map((rec, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="text-emerald-600 font-mono text-xs font-bold pt-0.5">0{i+1}</div>
                      <p className="text-sm text-slate-700 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
        
        {/* Map Restored Below Analysis */}
        <div className="mt-8" id="map-view">
           <h3 className="text-lg font-bold text-slate-900 mb-4">Visualizador SIG (DGT Oficial)</h3>
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[600px] relative animate-in fade-in">
             <MapContainer center={mapCenter} zoom={16} zoomControl={true} style={{ width: '100%', height: '100%' }}>
               <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" crossOrigin="anonymous" />
               <LC position="topright">
                 <LC.Overlay checked name="DGT Oficial: REN / RAN (WMS)">
                   <WMSTileLayer
                 url="https://servicos.dgterritorio.pt/wms/snit"
                 layers="RAN,REN"
                 format="image/png"
                 transparent={true}
                 opacity={0.6}
               />
                 </LC.Overlay>
               </LC>
          <LC position="topright">
             <LC.Overlay name="DGT Oficial: REN / RAN (WMS)">
               <WMSTileLayer
                 url="https://servicos.dgterritorio.pt/wms/snit"
                 layers="RAN,REN"
                 format="image/png"
                 transparent={true}
                 opacity={0.6}
               />
             </LC.Overlay>
          </LC>
               <Marker position={mapCenter}><Popup>Terreno selecionado</Popup></Marker>
               <LC position="topright">
                 <LC.Overlay checked name="Perímetro Urbano">
                   <Polygon positions={[[mapCenter[0]-0.005, mapCenter[1]-0.005], [mapCenter[0]+0.005, mapCenter[1]-0.005], [mapCenter[0]+0.005, mapCenter[1]+0.005]]} pathOptions={{ color: '#3b82f6', fillColor: '#60a5fa', fillOpacity: 0.2, weight: 1, dashArray: '4' }} />
                 </LC.Overlay>
                 <LC.Overlay checked name="RAN / REN (Reserva)">
                   <Polygon positions={[[mapCenter[0], mapCenter[1]], [mapCenter[0]+0.004, mapCenter[1]+0.005], [mapCenter[0]-0.002, mapCenter[1]+0.005]]} pathOptions={{ color: '#ef4444', fillColor: '#f87171', fillOpacity: 0.3, weight: 2 }} />
                 </LC.Overlay>
               </LC>
               <Polygon positions={[[mapCenter[0]-0.001, mapCenter[1]-0.001], [mapCenter[0]+0.002, mapCenter[1]-0.001], [mapCenter[0]+0.001, mapCenter[1]-0.003]]} pathOptions={{ color: '#059669', fillColor: '#10b981', fillOpacity: 0.6, weight: 3 }} />
             </MapContainer>
           </div>
        </div>
      </main>
    </div>
  );
};


const ExplorePage = ({ properties, onNavigate, user, onLogout }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white flex flex-col h-screen">
      <div className="flex-1 relative">
        <MapContainer center={[39.3999, -8.2245]} zoom={7} zoomControl={false} style={{ width: '100%', height: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" />
          <LC position="topright">
            <LC.Overlay checked name="Meus Terrenos">
              <FeatureGroup>
                {properties.map(p => {
                  const lat = 39.3999 + (Math.random() - 0.5) * 3;
                  const lng = -8.2245 + (Math.random() - 0.5) * 2;
                  return (
                    <Marker key={p.id} position={[lat, lng]}>
                      <Popup>
                        <div className="text-xs">
                          <h3 className="font-bold text-emerald-700">{p.designacao}</h3>
                          <p>{p.concelho}</p>
                          <p className="font-bold mt-1">Score: {p.score}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </FeatureGroup>
            </LC.Overlay>
            <LC.Overlay checked name="Perímetros Urbanos">
               <Polygon positions={[[38.7, -9.2], [38.9, -9.2], [38.8, -9.0]]} pathOptions={{ color: '#3b82f6', fillColor: '#60a5fa', fillOpacity: 0.3, weight: 1, dashArray: '4' }} />
            </LC.Overlay>
            <LC.Overlay checked name="RAN / REN (Global)">
               <Polygon positions={[[38.8, -9.0], [38.9, -8.5], [38.7, -8.5]]} pathOptions={{ color: '#ef4444', fillColor: '#f87171', fillOpacity: 0.2, weight: 1 }} />
            </LC.Overlay>
          </LC>
        </MapContainer>
        <div className="absolute top-6 left-6 z-[400] bg-white p-4 rounded-xl shadow-lg w-80 border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Globe2 size={16} className="text-emerald-600"/> Centro de Comando</h2>
          <p className="text-xs text-slate-500 mt-1">Visão macro de todos os ativos imobiliários na plataforma.</p>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="text-center"><div className="text-lg font-black text-slate-800">{properties.length}</div><div className="text-[9px] uppercase font-bold text-slate-400">Ativos</div></div>
            <div className="text-center"><div className="text-lg font-black text-emerald-600">{properties.filter(p=>p.score>=60).length}</div><div className="text-[9px] uppercase font-bold text-slate-400">Viáveis</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};



const VaultPage = () => {
  const folders = [
    { name: "Lisboa", items: 12, size: "154MB" },
    { name: "Porto", items: 8, size: "82MB" },
    { name: "Cascais", items: 5, size: "45MB" },
    { name: "Sintra", items: 3, size: "28MB" },
    { name: "Faro", items: 2, size: "12MB" }
  ];
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-10"><h1 className="text-3xl font-black text-slate-900 mb-2">Cofre de Documentos</h1><p className="text-slate-500 font-medium">Repositório centralizado de documentação técnica.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-emerald-300 hover:bg-white transition cursor-pointer group text-slate-400 hover:text-emerald-600">
           <Plus size={32} className="group-hover:scale-110 transition-transform" />
           <span className="text-xs font-black uppercase tracking-widest">Nova Pasta</span>
        </div>
        {folders.map((f, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer group">
             <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><FolderOpen size={24} /></div>
                <button className="text-slate-300 hover:text-slate-500"><Settings size={16} /></button>
             </div>
             <h3 className="font-bold text-slate-900 mb-1">{f.name}</h3>
             <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest"><span>{f.items} Ficheiros</span><span>{f.size}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SupportWidget = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"><Shield size={16} /></div>
              <div>
                <h3 className="font-bold text-sm leading-none">Consultor TerraCerta</h3>
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Online</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition"><X size={16} /></button>
          </div>
          <div className="p-4 h-48 bg-slate-50 flex flex-col gap-3 overflow-y-auto text-xs">
            <div className="bg-white border border-slate-200 p-3 rounded-lg rounded-tl-none self-start max-w-[85%] shadow-sm">
              <p className="text-slate-700">Olá! Tem alguma dúvida técnica complexa sobre restrições de algum terreno? Posso ajudar com consultoria especializada.</p>
            </div>
          </div>
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input type="text" placeholder="Escreva a sua mensagem..." className="w-full bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs outline-none focus:border-emerald-500" />
            <button className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 shrink-0"><Send size={12}/></button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform">
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  async function handleDelete(id) {
    await db.from("propriedades").delete().eq("id", id);
    fetchProperties();
  }

  let content = null;
  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  if (view === "dashboard") {
    content = <Dashboard properties={properties} loading={loading} onRefresh={fetchProperties} onNew={() => setView("upload")} onSelect={(p) => { setSelected(p); setView("analysis"); setAnalysisPage(1); }} onDelete={handleDelete} user={user} onLogout={() => setUser(null)} onNavigate={setView} />;
  } else if (view === "explore") {
    content = <ExplorePage properties={properties} user={user} onLogout={() => setUser(null)} onNavigate={setView} />;
  } else if (view === "pdm") {
    content = <RegulamentosPage PORTUGAL_GEO={PORTUGAL_GEO} onNavigate={setView} />;
  } else if (view === "upload") {
    content = <UploadPage onCancel={() => setView("dashboard")} onAnalyseDone={(p) => { 
      setSelected(p); 
      setView("analysis"); 
      setAnalysisPage(1); 
      fetchProperties();
    }} user={user} onLogout={() => setUser(null)} onNavigate={setView} />;
  } else if (view === "vault") {
    content = <VaultPage />;
  } else if (view === "analysis" && selected) {
    content = <AnalysisPage property={selected} page={analysisPage} setPage={setAnalysisPage} onBack={() => setView("dashboard")} user={user} onLogout={() => setUser(null)} onNavigate={setView} />;
  } else {
    content = (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Loader2 className="animate-spin mb-4" />
        <p className="text-sm font-medium uppercase tracking-widest">Módulo em Desenvolvimento</p>
        <button onClick={() => setView("dashboard")} className="mt-4 text-emerald-600 font-bold hover:underline">Voltar ao Início</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar page={view} onNavigate={setView} user={user} onLogout={() => setUser(null)} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className="flex-1 overflow-y-auto relative">
        {content}
        <SupportWidget />
      </main>
    </div>
  );
}
