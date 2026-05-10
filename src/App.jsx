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
    loginTitle: "Accedi", emailLabel: "Email", passwordLabel: "Password", forgotPassword: "Password dimenticata?", loginButton: "Entra", tagline: "Analisi di Viabilità Territoriale", forgotMsg: "Contatta il supporto.", loggingIn: "Accesso...", lang: "Italiano", flag: "🇮🇹",
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
const Logo = ({ size = "md", invert = false, langLabel }) => (
  <div className="flex items-center gap-2">
    <div className={`${size === "lg" ? "h-9" : "h-7"} aspect-square rounded-md bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-sm`}>
      <Mountain className="text-white" size={size === "lg" ? 20 : 16} strokeWidth={2.5} />
    </div>
    <div className="flex flex-col leading-none text-left">
      <span className={`font-semibold tracking-tight ${invert ? "text-white" : "text-slate-900"} ${size === "lg" ? "text-xl" : "text-base"}`}>
        Terra<span className="text-emerald-700">Certa</span>
      </span>
      {size === "lg" && <span className={`text-[10px] uppercase tracking-[0.2em] ${invert ? "text-white/60" : "text-slate-500"} mt-1`}>{langLabel}</span>}
    </div>
  </div>
);

const LandscapeBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e9c49a]">
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8b08c" />
            <stop offset="100%" stopColor="#f3d1ae" />
          </linearGradient>
          <linearGradient id="mountains" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c8485" />
            <stop offset="100%" stopColor="#5d6668" />
          </linearGradient>
        </defs>
        
        {/* Sky */}
        <rect width="1920" height="1080" fill="url(#sky)" />
        
        {/* Sun Glow */}
        <circle cx="1400" cy="300" r="150" fill="#fdf0d5" opacity="0.3" filter="blur(40px)" />
        
        {/* Distant Mountains */}
        <path d="M0,520 L320,440 L660,480 L900,420 L1320,460 L1920,420 L1920,600 L0,600 Z" fill="url(#mountains)" />
        
        {/* Green Hills (Rolling layers) */}
        <path d="M0,580 Q240,510 480,560 T960,530 T1500,550 T1920,520 L1920,800 L0,800 Z" fill="#9bb47e" />
        <path d="M0,640 Q400,580 800,650 T1600,620 T1920,640 L1920,900 L0,900 Z" fill="#6c8c5e" />
        <path d="M0,740 Q500,680 1000,760 T1920,720 L1920,1080 L0,1080 Z" fill="#3a5d34" />
        
        {/* Dark Green Foreground Hill */}
        <path d="M0,840 Q400,800 800,880 T1600,820 T1920,850 L1920,1080 L0,1080 Z" fill="#1b3d1b" />
        
        {/* Wheat Field Base */}
        <path d="M0,940 Q500,920 1000,960 T1920,930 L1920,1080 L0,1080 Z" fill="#c4ae78" />
        
        {/* Decorative Trees (Static) */}
        <g fill="#0f260f" opacity="0.8">
          <ellipse cx="720" cy="850" rx="10" ry="30" />
          <ellipse cx="750" cy="860" rx="12" ry="35" />
          <ellipse cx="790" cy="855" rx="11" ry="32" />
        </g>
        
        {/* Static Birds */}
        <g stroke="#3a2818" strokeWidth="1.5" fill="none" opacity="0.6">
          <path d="M480,240 q5,-7 10,0 q5,-7 10,0" />
          <path d="M520,245 q4,-6 8,0 q4,-6 8,0" />
          <path d="M450,250 q4,-6 8,0 q4,-6 8,0" />
        </g>
        
        {/* Static Clouds */}
        <g fill="white" opacity="0.25">
          <ellipse cx="200" cy="150" rx="60" ry="15" />
          <ellipse cx="1400" cy="120" rx="80" ry="20" />
        </g>
      </svg>
    </div>
  );
};

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
    if (!expectedPwd || expectedPwd !== password) {
      setError(lang === "pt" ? "Credenciais inválidas." : "Invalid credentials.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => onLogin(email), 300);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      <LandscapeBackground />
      
      {/* Header com Logo e Seleção de Língua */}
      <header className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-20">
        <Logo size="lg" invert langLabel={t.tagline} />
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

      {/* Cartão de Login Estilo Imagem 2 */}
      <div className="w-full max-w-[420px] bg-white rounded-xl shadow-2xl p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <h1 className="text-3xl font-bold text-[#0f172a] mb-10">{t.loginTitle}</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.emailLabel}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition text-slate-600 placeholder:text-slate-300"
                placeholder="nome@terracerta.pt"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.passwordLabel}</label>
              <button type="button" onClick={() => alert(t.forgotMsg)} className="text-[11px] text-emerald-700 font-bold hover:underline">
                {t.forgotPassword}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none transition text-slate-600"
                placeholder="••••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full bg-[#0f172a] text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition transform active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                {t.loginButton} <ArrowRight size={18} />
              </>
            )}
          </button>
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

// ----------------- ROOT APP -----------------
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
          <Logo langLabel={t.tagline} />
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
