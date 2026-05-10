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
  Satellite, Map as MapIcon, Calculator, Globe2, Eye, EyeOff
} from "lucide-react";

// ----------------- DATABASE CLIENT -----------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
let db = createClient(supabaseUrl, supabaseAnonKey);

// ----------------- AUTH -----------------
const ALLOWED_USERS = {
  "admin1@terracerta.pt": "portugal2026",
  "admin2@terracerta.pt": "portugal2026",
};

// ----------------- TRANSLATIONS -----------------
const TRANSLATIONS = {
  pt: { 
    loginTitle: "Iniciar sessão", emailLabel: "Email profissional", passwordLabel: "Palavra-passe", forgotPassword: "Esqueci-me da Password", loginButton: "Entrar na plataforma", tagline: "Análise de Viabilidade Territorial", forgotMsg: "Contacte o suporte técnico.", loggingIn: "A entrar...", lang: "Português", flag: "🇵🇹",
    properties: "Terrenos", dashboard: "Dashboard", reports: "Relatórios", sig: "Camadas SIG", newProperty: "Novo Terreno", logout: "Sair", search: "Pesquisar...", stats_total: "Terrenos em carteira", stats_area: "Área total agregada", stats_score: "Health Score médio",
    back: "Voltar", downloadPDF: "Relatório PDF", identify: "Identificação", concelho: "Concelho", area: "Área", score: "Score", status: "Estado", recommendation: "Recomendação"
  },
  en: { 
    loginTitle: "Sign In", emailLabel: "Email", passwordLabel: "Password", forgotPassword: "Forgot Password?", loginButton: "Enter Platform", tagline: "Territorial Viability Analysis", forgotMsg: "Contact technical support.", loggingIn: "Signing in...", lang: "English", flag: "🇬🇧",
    properties: "Properties", dashboard: "Dashboard", reports: "Reports", sig: "GIS Layers", newProperty: "New Property", logout: "Logout", search: "Search...", stats_total: "Properties", stats_area: "Total Area", stats_score: "Avg Score",
    back: "Back", downloadPDF: "PDF Report", identify: "Identification", concelho: "County", area: "Area", score: "Score", status: "Status", recommendation: "Recommendation"
  },
  fr: { 
    loginTitle: "Se connecter", emailLabel: "Email", passwordLabel: "Mot de passe", forgotPassword: "Mot de passe oublié ?", loginButton: "Entrer", tagline: "Analyse de viabilidade territoriale", forgotMsg: "Contactez le support.", loggingIn: "Connexion...", lang: "Français", flag: "🇫🇷",
    properties: "Terrains", dashboard: "Tableau de bord", reports: "Rapports", sig: "Couches SIG", newProperty: "Nouveau Terrain", logout: "Déconnexion", search: "Rechercher...", stats_total: "Terrains", stats_area: "Surface totale", stats_score: "Score moyen",
    back: "Retour", downloadPDF: "Rapport PDF", identify: "Identification", concelho: "Commune", area: "Surface", score: "Score", status: "État", recommendation: "Recommandation"
  },
  de: { 
    loginTitle: "Anmelden", emailLabel: "E-Mail", passwordLabel: "Passwort", forgotPassword: "Passwort vergessen?", loginButton: "Plattform betreten", tagline: "Territoriale Machbarkeitsanalyse", forgotMsg: "Support kontaktieren.", loggingIn: "Anmelden...", lang: "Deutsch", flag: "🇩🇪",
    properties: "Grundstücke", dashboard: "Dashboard", reports: "Berichte", sig: "GIS-Ebenen", newProperty: "Neues Grundstück", logout: "Abmelden", search: "Suche...", stats_total: "Grundstücke", stats_area: "Gesamtfläche", stats_score: "Durchschnitt",
    back: "Zurück", downloadPDF: "PDF-Bericht", identify: "Identifizierung", concelho: "Gemeinde", area: "Fläche", score: "Score", status: "Status", recommendation: "Empfehlung"
  },
  es: { 
    loginTitle: "Iniciar sesión", emailLabel: "Email", passwordLabel: "Contraseña", forgotPassword: "¿Olvidaste la contraseña?", loginButton: "Entrar", tagline: "Análisis de Viabilidade Territorial", forgotMsg: "Contacte con suporte.", loggingIn: "Entrando...", lang: "Español", flag: "🇪🇸",
    properties: "Terrenos", dashboard: "Dashboard", reports: "Informes", sig: "Capas SIG", newProperty: "Nuevo Terreno", logout: "Salir", search: "Buscar...", stats_total: "Terrenos", stats_area: "Área total", stats_score: "Puntuación media",
    back: "Volver", downloadPDF: "Informe PDF", identify: "Identificación", concelho: "Municipio", area: "Área", score: "Puntuación", status: "Estado", recommendation: "Recomendación"
  },
  it: { 
    loginTitle: "Accedi", emailLabel: "Email", passwordLabel: "Password", forgotPassword: "Password dimenticata?", loginButton: "Entra", tagline: "Analisi di Viabilità Territoriale", forgotMsg: "Contatta il suporte.", loggingIn: "Accesso...", lang: "Italiano", flag: "🇮🇹",
    properties: "Terreni", dashboard: "Dashboard", reports: "Rapporti", sig: "Livelli GIS", newProperty: "Nuovo Terreno", logout: "Esci", search: "Cerca...", stats_total: "Terreni", stats_area: "Superficie", stats_score: "Punteggio",
    back: "Indietro", downloadPDF: "Rapporto PDF", identify: "Identificazione", concelho: "Comune", area: "Superficie", score: "Punteggio", status: "Stato", recommendation: "Raccomandazione"
  },
};

// ----------------- UTILS -----------------
const formatNumber = (n) => n == null ? "—" : new Intl.NumberFormat("pt-PT").format(n);
const formatArea = (m2) => {
  if (m2 == null || m2 === 0) return "—";
  if (m2 >= 10000) return `${(m2 / 10000).toLocaleString("pt-PT", { maximumFractionDigits: 2 })} ha`;
  return `${formatNumber(m2)} m²`;
};
const mapRow = (row) => ({
  id: row.id, designacao: row.designacao, concelho: row.concelho, freguesia: row.freguesia, artigo: row.artigo, area: row.area, classificacao: row.classificacao, score: row.score, status: row.status, data: row.data
});
const scoreColor = (s) => {
  if (s >= 80) return { text: "text-emerald-700", bg: "bg-emerald-50" };
  if (s >= 60) return { text: "text-lime-700", bg: "bg-lime-50" };
  if (s >= 40) return { text: "text-amber-700", bg: "bg-amber-50" };
  return { text: "text-rose-700", bg: "bg-rose-50" };
};

// ----------------- COMPONENTS -----------------
const Logo = ({ size = "md", invert = false }) => (
  <div className="flex items-center gap-3">
    <div className={`${size === "lg" ? "h-10" : "h-7"} aspect-square rounded-md bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-sm`}>
      <Mountain className="text-white" size={size === "lg" ? 22 : 16} strokeWidth={2.5} />
    </div>
    <div className="flex flex-col leading-none text-left">
      <span className={`font-bold tracking-tight ${invert ? "text-white" : "text-slate-900"} ${size === "lg" ? "text-2xl" : "text-base"}`}>
        Terra<span className="text-emerald-700">Certa</span>
      </span>
    </div>
  </div>
);

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
      .tc-birds { animation: fly-path 70s linear infinite; }
    `}</style>
    <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="bg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2b894" />
          <stop offset="100%" stopColor="#c9825a" />
        </linearGradient>
        <radialGradient id="bg-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffaeb" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fffaeb" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bg-mountains" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7a8b8e" /><stop offset="100%" stopColor="#5b6e72" /></linearGradient>
        <linearGradient id="bg-hill-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9bb47e" /><stop offset="100%" stopColor="#7a9460" /></linearGradient>
        <linearGradient id="bg-hill-mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c8c5e" /><stop offset="100%" stopColor="#4a6640" /></linearGradient>
        <linearGradient id="bg-hill-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a5d34" /><stop offset="100%" stopColor="#243d22" /></linearGradient>
        <linearGradient id="bg-field" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d4c685" /><stop offset="100%" stopColor="#a89255" /></linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#bg-sky)" />
      <circle cx="1650" cy="220" r="150" fill="url(#bg-sun)" />
      <path d="M0,520 L120,470 L210,495 L320,440 L420,475 L540,420 L660,460 L780,430 L900,475 L1040,440 L1180,490 L1320,455 L1480,485 L1620,445 L1780,475 L1920,455 L1920,600 L0,600 Z" fill="url(#bg-mountains)" />
      <path d="M0,580 Q240,510 480,545 T960,520 T1440,540 T1920,510 L1920,720 L0,720 Z" fill="url(#bg-hill-far)" opacity="0.85" />
      <path d="M0,660 Q320,580 640,620 T1280,610 T1920,600 L1920,820 L0,820 Z" fill="url(#bg-hill-mid)" />
      <path d="M0,780 Q400,700 800,740 T1500,720 T1920,740 L1920,1080 L0,1080 Z" fill="url(#bg-hill-near)" />
      <path d="M0,860 Q500,820 1000,840 T1920,830 L1920,1080 L0,1080 Z" fill="url(#bg-field)" opacity="0.9" />
      {[[180, 770], [210, 778], [1460, 750], [820, 805]].map(([cx, cy], i) => (<ellipse key={`tree-${i}`} cx={cx} cy={cy} rx={11} ry={36} fill="#1c3a1a" opacity="0.95" />))}
      <g transform="translate(1550, 700)" opacity="0.85">
        <rect x="0" y="20" width="48" height="28" fill="#f0e1c8" /><polygon points="-4,20 24,4 52,20" fill="#8b4f3a" /><rect x="20" y="32" width="8" height="16" fill="#3a2818" /><rect x="6" y="28" width="6" height="6" fill="#3a2818" /><rect x="34" y="28" width="6" height="6" fill="#3a2818" />
      </g>
    </svg>
    <svg className="absolute top-[8%] left-0 w-[20vw] max-w-[260px] tc-cloud-a opacity-90 pointer-events-none" viewBox="0 0 200 60"><g fill="white" opacity="0.85"><ellipse cx="50" cy="35" rx="40" ry="18" /><ellipse cx="90" cy="28" rx="32" ry="20" /><ellipse cx="130" cy="35" rx="38" ry="16" /></g></svg>
    <svg className="absolute top-[22%] left-0 w-[8vw] max-w-[120px] tc-birds opacity-70 pointer-events-none" viewBox="0 0 100 40" fill="none" stroke="#3a2818" strokeWidth="1.6"><path d="M5,20 q5,-7 10,0 q5,-7 10,0" /><path d="M30,28 q4,-6 8,0 q4,-6 8,0" /></svg>
  </div>
);

// ----------------- PAGES -----------------
const LoginPage = ({ onLogin, lang, setLang }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const t = TRANSLATIONS[lang];
  const handleLogin = (e) => {
    e?.preventDefault?.();
    setError(null);
    const expectedPwd = ALLOWED_USERS[email.toLowerCase().trim()];
    if (!expectedPwd || expectedPwd !== password) { setError(lang === "pt" ? "Credenciais inválidas." : "Invalid credentials."); return; }
    setSubmitting(true);
    setTimeout(() => onLogin(email), 300);
  };
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      <LandscapeBackground />
      <header className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-20">
        <Logo size="lg" invert />
        <div className="relative">
          <button onClick={() => setShowLang(!showLang)} className="flex items-center gap-2 px-3 py-2 bg-black/20 backdrop-blur-md rounded-md border border-white/10 text-white hover:bg-black/30 transition">
            <span className="text-lg">{t.flag}</span> <span className="text-xs font-bold uppercase">{lang}</span>
          </button>
          {showLang && (
            <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-30">
              {Object.entries(TRANSLATIONS).map(([key, value]) => (
                <button key={key} onClick={() => { setLang(key); setShowLang(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition text-left">
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

const DetailView = ({ property, onBack, lang }) => {
  const t = TRANSLATIONS[lang];
  const c = scoreColor(property.score);
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(6, 78, 59); doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255); doc.text("TerraCerta Report", 15, 20);
    doc.setTextColor(0, 0, 0); doc.text(`${t.identify}: ${property.designacao}`, 15, 45);
    doc.text(`${t.concelho}: ${property.concelho}`, 15, 55);
    doc.text(`${t.area}: ${formatArea(property.area)}`, 15, 65);
    doc.text(`${t.score}: ${property.score}`, 15, 75);
    doc.save(`${property.id}.pdf`);
  };
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-bold transition">
        <ChevronLeft size={20} /> {t.back}
      </button>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="h-2 bg-emerald-600" />
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">{property.designacao}</h2><p className="text-slate-500 font-medium">{property.concelho}, {property.freguesia}</p></div>
            <button onClick={downloadPDF} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-100 transition"><Download size={18} /> {t.downloadPDF}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.score}</div>
              <div className={`text-5xl font-black ${c.text}`}>{property.score}</div>
            </div>
            <div className="col-span-3 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-[10px] font-black text-slate-400 uppercase">{t.identify}</label><p className="font-bold text-slate-900">{property.artigo}</p></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase">{t.area}</label><p className="font-bold text-slate-900">{formatArea(property.area)}</p></div>
              </div>
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
                <h4 className="text-emerald-900 font-black text-xs uppercase tracking-widest mb-2">{t.recommendation}</h4>
                <p className="text-emerald-800 text-sm leading-relaxed font-medium">Viabilidade elevada. Prosseguir com licenciamento.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState("pt");
  const [view, setView] = useState("dashboard");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const t = TRANSLATIONS[lang];
  useEffect(() => { if (user) fetchProperties(); }, [user]);
  async function fetchProperties() {
    setLoading(true);
    const { data } = await db.from("propriedades").select("*").order("created_at", { ascending: false });
    setProperties((data || []).map(mapRow));
    setLoading(false);
  }
  if (!user) return <LoginPage onLogin={setUser} lang={lang} setLang={setLang} />;
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="flex items-center gap-1">
            {[["properties", "dashboard"], ["sig", "sig"]].map(([key, target]) => (
              <button key={key} onClick={() => { setView(target); setSelected(null); }} className={`px-4 py-2 rounded-md text-sm font-medium ${view === target ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"}`}>
                {t[key]}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={() => setUser(null)} className="text-sm font-bold text-slate-500 hover:text-rose-600 flex items-center gap-2"><LogOut size={16} /> {t.logout}</button>
      </header>
      <main className="p-8 max-w-[1400px] mx-auto w-full flex-1">
        {selected ? (
          <DetailView property={selected} lang={lang} onBack={() => setSelected(null)} />
        ) : (
          <>
            {view === "dashboard" && (
              <>
                <div className="flex justify-between items-end mb-8">
                  <div><h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t.dashboard}</h1><p className="text-slate-500 mt-1">{t.stats_total}: {properties.length}</p></div>
                  <button className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg transition"><Plus size={20} /> {t.newProperty}</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.stats_total}</div><div className="text-3xl font-black text-slate-900 mt-2">{loading ? "..." : properties.length}</div></div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.stats_area}</div><div className="text-3xl font-black text-slate-900 mt-2">{loading ? "..." : formatArea(properties.reduce((s,p)=>s+p.area, 0))}</div></div>
                  <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50"><div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{t.stats_score}</div><div className="text-3xl font-black text-emerald-700 mt-2">{loading ? "..." : Math.round(properties.reduce((s,p)=>s+p.score, 0)/properties.length || 0)}</div></div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <tr><th className="px-6 py-4">Designação</th><th className="px-6 py-4">Concelho</th><th className="px-6 py-4">Área</th><th className="px-6 py-4 text-center">Score</th><th className="px-6 py-4">Estado</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {properties.map(p => (
                        <tr key={p.id} onClick={() => setSelected(p)} className="hover:bg-slate-50 transition cursor-pointer group">
                          <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-emerald-700">{p.designacao}</td>
                          <td className="px-6 py-4 text-slate-600">{p.concelho}</td>
                          <td className="px-6 py-4 tabular-nums text-slate-600">{formatArea(p.area)}</td>
                          <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded font-black text-xs ${scoreColor(p.score).bg} ${scoreColor(p.score).text}`}>{p.score}</span></td>
                          <td className="px-6 py-4"><span className="text-[10px] font-bold uppercase px-2 py-1 bg-slate-100 rounded-full">{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {view === "sig" && (
              <div className="bg-white rounded-xl border border-slate-200 h-[700px] flex items-center justify-center text-slate-400 font-medium italic"><Globe2 size={48} className="mb-4 opacity-20" /> SIG View (Mockup)</div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
