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
import { MapContainer, TileLayer, Polygon, FeatureGroup } from "react-leaflet";
import { toJpeg } from "html-to-image";

// ----------------- CONFIG & DB -----------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const db = createClient(supabaseUrl, supabaseAnonKey);

const ALLOWED_USERS = {
  "admin1@terracerta.pt": "portugal2026",
  "admin2@terracerta.pt": "portugal2026",
};

// ----------------- DATASET OFICIAL: TODOS OS 308 CONCELHOS -----------------
const PORTUGAL_GEO = {
  "Aveiro": ["Águeda", "Albergaria-a-Velha", "Anadia", "Arouca", "Aveiro", "Castelo de Paiva", "Espinho", "Estarreja", "Ílhavo", "Mealhada", "Murtosa", "Oliveira de Azeméis", "Oliveira do Bairro", "Ovar", "Santa Maria da Feira", "São João da Madeira", "Sever do Vouga", "Vagos", "Vale de Cambra"],
  "Beja": ["Aljustrel", "Almodôvar", "Alvito", "Barrancos", "Beja", "Castro Verde", "Cuba", "Ferreira do Alentejo", "Mértola", "Moura", "Odemira", "Ourique", "Serpa", "Vidigueira"],
  "Braga": ["Amares", "Barcelos", "Braga", "Cabeceiras de Basto", "Celorico de Basto", "Esposende", "Fafe", "Guimarães", "Póvoa de Lanhoso", "Terras de Bouro", "Vieira do Minho", "Vila Nova de Famalicão", "Vila Verde", "Vizela"],
  "Bragança": ["Alfândega da Fé", "Bragança", "Carrazeda de Ansiães", "Freixo de Espada à Cinta", "Macedo de Cavaleiros", "Miranda do Douro", "Mirandela", "Mogadouro", "Torre de Moncorvo", "Vila Flor", "Vimioso", "Vinhais"],
  "Castelo Branco": ["Belmonte", "Castelo Branco", "Covilhã", "Fundão", "Idanha-a-Nova", "Oleiros", "Penamacor", "Proença-a-Nova", "Sertã", "Vila de Rei", "Vila Velha de Ródão"],
  "Coimbra": ["Arganil", "Cantanhede", "Coimbra", "Condeixa-a-Nova", "Figueira da Foz", "Góis", "Lousã", "Mira", "Miranda do Corvo", "Montemor-o-Velho", "Oliveira do Hospital", "Pampilhosa da Serra", "Penacova", "Penela", "Soure", "Tábua", "Vila Nova de Poiares"],
  "Évora": ["Alandroal", "Arraiolos", "Borba", "Estremoz", "Évora", "Montemor-o-Novo", "Mora", "Mourão", "Portel", "Redondo", "Reguengos de Monsaraz", "Vendas Novas", "Viana do Alentejo", "Vila Viçosa"],
  "Faro": ["Albufeira", "Alcoutim", "Aljezur", "Castro Marim", "Faro", "Lagoa", "Lagos", "Loulé", "Olhão", "Portimão", "São Brás de Alportel", "Silves", "Tavira", "Vila do Bispo", "Vila Real de Santo António"],
  "Guarda": ["Aguiar da Beira", "Almeida", "Celorico da Beira", "Figueira de Castelo Rodrigo", "Fornos de Algodres", "Gouveia", "Guarda", "Manteigas", "Mêda", "Pinhel", "Seia", "Trancoso", "Vila Nova de Foz Côa"],
  "Leiria": ["Alcobaça", "Alvaiázere", "Ansião", "Batalha", "Bombarral", "Caldas da Rainha", "Castanheira de Pera", "Figueiró dos Vinhos", "Leiria", "Marinha Grande", "Nazare", "Óbidos", "Pedrógão Grande", "Peniche", "Pombal", "Porto de Mós"],
  "Lisboa": ["Alenquer", "Amadora", "Arruda dos Vinhos", "Azambuja", "Cadaval", "Cascais", "Lisboa", "Loures", "Lourinhã", "Mafra", "Odivelas", "Oeiras", "Sintra", "Sobral de Monte Agraço", "Torres Vedras", "Vila Franca de Xira"],
  "Portalegre": ["Alter do Chão", "Arronches", "Avis", "Campo Maior", "Castelo de Vide", "Crato", "Elvas", "Fronteira", "Gavião", "Marvão", "Monforte", "Nisa", "Ponte de Sor", "Portalegre", "Sousel"],
  "Porto": ["Amarante", "Baião", "Felgueiras", "Gondomar", "Lousada", "Maia", "Marco de Canaveses", "Matosinhos", "Paços de Ferreira", "Paredes", "Penafiel", "Porto", "Póvoa de Varzim", "Santo Tirso", "Trofa", "Valongo", "Vila do Conde", "Vila Nova de Gaia"],
  "Santarém": ["Abrantes", "Alcanena", "Almeirim", "Alpiarça", "Benavente", "Cartaxo", "Chamusca", "Constância", "Coruche", "Entroncamento", "Ferreira do Zêzere", "Golegã", "Mação", "Ourém", "Rio Maior", "Salvaterra de Magos", "Santarém", "Sardoal", "Tomar", "Torres Novas", "Vila Nova da Barquinha"],
  "Setúbal": ["Alcácer do Sal", "Alcochete", "Almada", "Barreiro", "Grândola", "Moita", "Montijo", "Palmela", "Santiago do Cacém", "Seixal", "Sesimbra", "Setúbal", "Sines"],
  "Viana do Castelo": ["Arcos de Valdevez", "Caminha", "Melgaço", "Monção", "Paredes de Coura", "Ponte da Barca", "Ponte de Lima", "Valença", "Viana do Castelo", "Vila Nova de Cerveira"],
  "Vila Real": ["Alijó", "Boticas", "Chaves", "Mesão Frio", "Mondim de Basto", "Montalegre", "Murça", "Peso da Régua", "Ribeira de Pena", "Sabrosa", "Santa Marta de Penaguião", "Valpaços", "Vila Pouca de Aguiar", "Vila Real"],
  "Viseu": ["Armamar", "Carregal do Sal", "Castro Daire", "Cinfães", "Lamego", "Mangualde", "Moimenta da Beira", "Mortágua", "Nelas", "Oliveira de Frades", "Penalva do Castelo", "Penedono", "Resende", "Santa Comba Dão", "São João da Pesqueira", "São Pedro do Sul", "Sátão", "Sernancelhe", "Tabuaço", "Tarouca", "Tondela", "Vila Nova de Paiva", "Viseu", "Vouzela"],
  "Madeira": ["Calheta", "Câmara de Lobos", "Funchal", "Machico", "Ponta do Sol", "Porto Moniz", "Porto Santo", "Ribeira Brava", "Santa Cruz", "Santana", "São Vicente"],
  "Açores": ["Angra do Heroísmo", "Calheta", "Corvo", "Horta", "Lagoa", "Lajes das Flores", "Lajes do Pico", "Madalena", "Nordeste", "Ponta Delgada", "Povoação", "Praia da Vitória", "Ribeira Grande", "Santa Cruz da Graciosa", "Santa Cruz das Flores", "São Roque do Pico", "Velas", "Vila do Porto", "Vila Franca do Campo"]
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
                <button key={key} onClick={() => { setLang(key); setShowLang(false); }} className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 transition ${lang === key ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600'}`}>
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

const Dashboard = ({ properties, loading, onRefresh, onNew, onSelect, user, onLogout, onNavigate }) => {
  const [search, setSearch] = useState("");
  const filtered = properties.filter(p => 
    p.designacao?.toLowerCase().includes(search.toLowerCase()) || 
    p.concelho?.toLowerCase().includes(search.toLowerCase()) ||
    p.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Nav page="dashboard" onNavigate={onNavigate} user={user} onLogout={onLogout} />
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAnalysing(true);
    
    // Cálculo de Score mais determinístico
    let valArea = parseFloat(formData.area) || 140;
    let baseScore = 65;
    if (valArea < 500) baseScore += 15;
    else if (valArea > 5000) baseScore -= 10;
    let finalScore = Math.min(100, Math.max(0, baseScore + (formData.designacao.length % 15)));

    const novoTerreno = {
      designacao: formData.designacao || "Terreno sem nome",
      concelho: formData.concelho,
      freguesia: formData.freguesia,
      area: valArea,
      score: finalScore,
      status: "Analisado"
    };

    try {
      const { data, error } = await db.from('propriedades').insert([novoTerreno]).select().single();
      if (error) throw error;
      onAnalyseDone(data || novoTerreno);
    } catch (err) {
      console.error("Erro ao guardar no Supabase:", err);
      // Fallback para simulação em caso de erro de DB
      novoTerreno.id = "new-" + Math.random().toString(36).substr(2, 9);
      onAnalyseDone(novoTerreno);
    }
  };

  const concelhosNoDistrito = formData.distrito ? PORTUGAL_GEO[formData.distrito] : [];

  return (
    <div className="min-h-screen bg-white">
      <Nav page="upload" onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <main className="p-8 max-w-[800px] mx-auto">
        <button onClick={onCancel} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 text-xs font-semibold transition"><ChevronLeft size={16} /> Voltar ao dashboard</button>
        <div className="mb-8"><h1 className="text-2xl font-bold text-slate-900 mb-2">Novo Terreno</h1></div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <div className="p-8 border border-slate-200 rounded-md space-y-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Dados do terreno</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Designação *</label>
                <div className="group relative cursor-help"><HelpCircle size={12} className="text-slate-300" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Nome descritivo para identificar a propriedade.</div></div>
              </div>
              <input required value={formData.designacao} onChange={e => setFormData({...formData, designacao: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-emerald-500 transition outline-none" placeholder="Ex: Quinta da Ribeira" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Distrito *</label>
                  <div className="group relative cursor-help"><HelpCircle size={12} className="text-slate-300" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Distrito administrativo onde se localiza o terreno.</div></div>
                </div>
                <select required value={formData.distrito} onChange={e => setFormData({...formData, distrito: e.target.value, concelho: "", freguesia: ""})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500"><option value="">Distrito...</option>{Object.keys(PORTUGAL_GEO).map(d => <option key={d} value={d}>{d}</option>)}</select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Concelho *</label>
                  <div className="group relative cursor-help"><HelpCircle size={12} className="text-slate-300" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Município correspondente ao distrito selecionado.</div></div>
                </div>
                <select required value={formData.concelho} onChange={e => setFormData({...formData, concelho: e.target.value, freguesia: ""})} disabled={!formData.distrito} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"><option value="">Concelho...</option>{concelhosNoDistrito.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Freguesia *</label>
                  <div className="group relative cursor-help"><HelpCircle size={12} className="text-slate-300" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Freguesia específica da localização do imóvel.</div></div>
                </div>
                <input required value={formData.freguesia} onChange={e => setFormData({...formData, freguesia: e.target.value})} disabled={!formData.concelho} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400" placeholder="Freguesia..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Artigo Matricial *</label>
                  <div className="group relative cursor-help"><HelpCircle size={12} className="text-slate-300" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Referência da Caderneta Predial (Finanças).</div></div>
                </div>
                <input required value={formData.matricial} onChange={e => setFormData({...formData, matricial: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ex: 1452" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Área (m²) *</label>
                  <div className="group relative cursor-help"><HelpCircle size={12} className="text-slate-300" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Área total do terreno em metros quadrados.</div></div>
                </div>
                <input required type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ex: 12450" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Documentação</h3>
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
                <button type="button" onClick={() => handleFileClick(d.id)} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition"><Upload size={12} /> Carregar</button>
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
  const analysisRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const exportPDF = async () => {
    if (!analysisRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toJpeg(analysisRef.current, {
        quality: 0.95,
        backgroundColor: '#f8fafc',
        fontEmbedCSS: '',
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TerraCerta_Analise_${property.id || 'terreno'}.pdf`);
    } catch (err) {
      console.error("Erro ao exportar PDF:", err);
      alert("Não foi possível exportar o PDF neste momento. Detalhes na consola.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Nav page="analysis" onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <main className="p-8 max-w-[1280px] mx-auto">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          <button onClick={onBack} className="hover:text-slate-600 transition">Dashboard</button>
          <ChevronRight size={10} />
          <span className="text-slate-600">{property.id?.slice(0, 8)}...</span>
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Análise de Viabilidade</h2>
            <h1 className="text-3xl font-bold text-slate-900">{property.designacao}</h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-300" /> {property.concelho}, {property.freguesia}</div>
              <div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-300" /> Emitido 2026-05-09</div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-white p-1 rounded-lg border border-slate-200">
              <button onClick={() => setPage(1)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${page === 1 ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>1 · PDM</button>
              <button onClick={() => setPage(2)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${page === 2 ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>2 · Conversão</button>
            </div>
            <button onClick={exportPDF} disabled={exporting} className="flex items-center gap-2 px-4 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-white transition">
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
              Exportar PDF com Logótipo
            </button>
          </div>
        </div>

        {/* CÓPIA DO CABEÇALHO PARA O PDF (Invisível no ecrã) */}
        <div className="hidden pdf-header mb-8 bg-slate-900 text-white p-6 rounded-lg">
           <div className="flex justify-between items-start">
              <div>
                 <Logo invert={true} />
                 <h1 className="text-2xl font-bold mt-4">{property.designacao}</h1>
                 <p className="text-sm text-slate-300 mt-1">{property.freguesia}, {property.concelho} · Artigo: {property.matricial || '—'}</p>
              </div>
              <div className="text-right">
                 <p className="text-xs text-slate-400">ID do Relatório</p>
                 <p className="font-mono text-sm">{property.id}</p>
                 <p className="text-xs text-slate-400 mt-2">Data de Emissão</p>
                 <p className="text-sm">2026-05-09</p>
              </div>
           </div>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @media print { .pdf-header { display: block !important; } }
          [data-html2canvas-ignore] { display: none !important; }
        `}} />

        <div className="grid grid-cols-12 gap-6" ref={analysisRef}>
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-8">{page === 1 ? "Análise do Plano Diretor Municipal (PDM)" : "Simulação de Conversão Urbana"}</h3>
              <div className="space-y-8">
                {(page === 1 ? [
                  { label: "Classificação do solo", val: "Urbano", status: "ok", tooltip: "Classificação principal definida na Planta de Ordenamento." },
                  { label: "Categoria de espaço", val: "Espaços Residenciais", status: "ok", tooltip: "Subcategoria que define o uso predominante do solo." },
                  { label: "Índice de edificabilidade máx. (Ie)", val: "0.50", status: "ok", tooltip: "Multiplicador máximo para a área de construção." },
                  { label: "Índice de impermeabilização (Ii)", val: "0.60", status: "warning", tooltip: "Percentagem máxima da parcela que pode ser impermeabilizada." },
                  { label: "Densidade populacional", val: "40 hab/ha", status: "ok", tooltip: "Número máximo de habitantes por hectare." },
                  { label: "Cércea máxima", val: "3 pisos (9m)", status: "ok", tooltip: "Altura máxima permitida para as fachadas das construções." },
                  { label: "Afastamento ao eixo da via", val: "Mínimo 5m", status: "warning", tooltip: "Distância obrigatória entre a construção e a estrada." },
                  { label: "Condicionantes", val: "Nenhuma identificada", status: "ok", tooltip: "Restrições como RAN, REN, ZPE, Zonas Inundáveis, etc." },
                ] : [
                  { label: "Contiguidade ao Solo Urbano", val: "Contíguo (0m)", status: "ok", tooltip: "Distância ao limite do solo urbano mais próximo." },
                  { label: "Acesso Rodoviário Público", val: "Sim (Pavimentado)", status: "ok", tooltip: "Existência de estrada pública em condições de circulação." },
                  { label: "Infraestruturas Básicas", val: "Redes a menos de 50m", status: "ok", tooltip: "Proximidade a redes de água, saneamento e eletricidade." },
                  { label: "Compatibilidade de Usos", val: "Habitação (Compatível)", status: "ok", tooltip: "Verificação se o uso pretendido é aceite na envolvente." },
                  { label: "Risco de Cheias / Incêndio", val: "Risco Baixo", status: "ok", tooltip: "Avaliação de riscos naturais através da cartografia oficial." },
                  { label: "Parecer Prévio / Restrições", val: "Não aplicável", status: "ok", tooltip: "Necessidade de consultas a entidades externas (APA, CCDR, etc)." },
                ]).map((r, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={r.status === 'ok' ? 'text-emerald-500' : 'text-amber-500'}>{r.status === 'ok' ? <CheckCircle size={20} strokeWidth={3} /> : <AlertTriangle size={20} strokeWidth={3} />}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-700">{r.label}</span>
                        <div className="relative inline-flex items-center group/tooltip" data-html2canvas-ignore>
                            <HelpCircle size={12} className="text-slate-300 cursor-help hover:text-slate-500" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all pointer-events-none z-50 text-center shadow-lg">
                                {r.tooltip}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                            </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-900">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[400px] relative">
              <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                <MapContainer center={[38.7071, -9.1355]} zoom={13} zoomControl={false} style={{ width: '100%', height: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" crossOrigin="anonymous" attribution="&copy; OpenStreetMap &copy; CARTO" />
                  <Polygon positions={[[38.705, -9.135], [38.708, -9.130], [38.709, -9.138]]} pathOptions={{ color: '#059669', fillColor: '#10b981', fillOpacity: 0.4, weight: 2 }} />
                </MapContainer>
                <div className="absolute inset-0 bg-slate-900/5 pointer-events-none z-[400]" data-html2canvas-ignore></div>
                <div className="absolute top-4 right-4 bg-white p-2 rounded-md shadow-md text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 border border-slate-100 z-[400]"><MapPin size={12} className="text-emerald-600" /> Vista SIG Integrada</div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${c.fill}`}></div>
              <div className="relative mb-6">
                <svg className="w-48 h-48 transform -rotate-90"><circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" /><circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552.9} strokeDashoffset={552.9 * (1 - property.score / 100)} className={`${c.text} transition-all duration-1000 ease-out`} strokeLinecap="round" /></svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-6xl font-black ${c.text} tracking-tighter`}>{property.score}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Health Score</span>
                </div>
              </div>
              <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 ${c.bg} ${c.text} border-2 ${c.border}`}>{c.label}</div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metadados OCR</h3></div>
              <div className="divide-y divide-slate-100">
                {[{ label: "Área", val: formatArea(property.area) }, { label: "Artigo", val: "—" }, { label: "Concelho", val: property.concelho }].map((d, i) => (<div key={i} className="flex justify-between items-center px-6 py-4 text-xs"><span className="text-slate-400 font-bold">{d.label}</span><span className="text-slate-900 font-bold">{d.val}</span></div>))}
              </div>
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
  if (view === "upload") return <UploadPage onCancel={() => setView("dashboard")} onAnalyseDone={(p) => { 
    setSelected(p); 
    setView("analysis"); 
    setAnalysisPage(1); 
    fetchProperties(); // Refresh the list so it appears in Dashboard
  }} user={user} onLogout={() => setUser(null)} onNavigate={setView} />;
  if (view === "analysis" && selected) return <AnalysisPage property={selected} page={analysisPage} setPage={setAnalysisPage} onBack={() => setView("dashboard")} user={user} onLogout={() => setUser(null)} onNavigate={setView} />;
  return null;
}
