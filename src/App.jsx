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

let db;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[TerraCerta] Configuração de ambiente em falta. A base de dados não estará funcional.");
  // Dummy client to prevent crashes if code tries to use it
  db = {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  };
} else {
  db = createClient(supabaseUrl, supabaseAnonKey);
}

// ----------------- AUTH (frontend-only · MVP) -----------------
const ALLOWED_USERS = {
  "admin1@terracerta.pt": "portugal2026",
  "admin2@terracerta.pt": "portugal2026",
};

// ----------------- DOMAIN CONSTANTS -----------------
const CONCELHOS = ["Lisboa", "Sintra", "Oeiras", "Porto"];

const FREGUESIAS = {
  "Lisboa":  ["Arroios", "Estrela", "Belém"],
  "Sintra":  ["Alcabideche", "Colares", "Rio de Mouro"],
  "Oeiras":  ["Carnaxide", "Algés", "Paço de Arcos", "Oeiras e São Julião da Barra"],
  "Porto":   ["Bonfim", "Cedofeita", "Paranhos", "Campanhã"],
};

const CLASSIFICACOES = [
  "Urbano",
  "Urbano de baixa densidade",
  "Rústico",
  "Espaço Industrial",
  "Espaço Florestal",
];

const PDM_LINKS = {
  "Lisboa": "https://www.lisboa.pt/cidade/urbanismo/planeamento-urbano/plano-diretor-municipal",
  "Sintra": "https://www.cm-sintra.pt/viver/urbanismo/plano-diretor-municipal",
  "Oeiras": "https://www.cm-oeiras.pt/pt/viver/urbanismo/instrumentos-de-gestao-territorial/pdm",
  "Porto":  "https://www.cm-porto.pt/urbanismo/planeamento-urbanistico/plano-diretor-municipal",
};

// ----------------- DATA LAYER -----------------
const TABLE = "propriedades";
const COLUMNS = "id, created_at, designacao, concelho, freguesia, artigo, area, classificacao, score, status, data, pdm_ref";

const mapRow = (row) => ({
  id: row.id,
  createdAt: row.created_at,
  designacao: row.designacao,
  concelho: row.concelho,
  freguesia: row.freguesia,
  artigo: row.artigo,
  area: row.area,
  classificacao: row.classificacao,
  score: row.score,
  status: row.status,
  data: row.data,
  pdmRef: row.pdm_ref,
});

async function fetchPropriedades() {
  const { data, error } = await db
    .from(TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

async function insertPropriedade(form) {
  const today = new Date();
  const year = today.getFullYear();
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  const concelhoSlug = (form.concelho || "XXX").slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");

  const baseScore = 55 + Math.floor(Math.random() * 35);
  const areaBonus = form.area > 10000 ? 5 : form.area < 500 ? -10 : 0;
  const score = Math.min(98, Math.max(20, baseScore + areaBonus));
  const status = score >= 60 ? "Analisado" : score >= 40 ? "Reservas" : "Inviável";

  const payload = {
    id: `TC-${year}-${seq}`,
    designacao: form.designacao,
    concelho: form.concelho,
    freguesia: form.freguesia,
    artigo: form.artigo,
    area: Number(form.area) || 0,
    classificacao: form.classificacao,
    score,
    status,
    data: today.toISOString().slice(0, 10),
    pdm_ref: `PDM-${concelhoSlug}-Rev${year}`,
  };

  const { data, error } = await db
    .from(TABLE)
    .insert(payload)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return mapRow(data);
}

// ----------------- HELPERS -----------------
const formatNumber = (n) =>
  n == null ? "—" : new Intl.NumberFormat("pt-PT").format(n);

const formatArea = (m2) => {
  if (m2 == null || m2 === 0) return "—";
  if (m2 >= 10000) {
    const ha = m2 / 10000;
    return `${ha.toLocaleString("pt-PT", { maximumFractionDigits: 2 })} ha`;
  }
  return `${formatNumber(m2)} m²`;
};

const formatBytes = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const scoreColor = (s) => {
  const v = s || 0;
  if (v >= 80) return { text: "text-emerald-700", bg: "bg-emerald-50", ring: "stroke-emerald-500", border: "border-emerald-300", rgb: [5, 150, 105] };
  if (v >= 60) return { text: "text-lime-700", bg: "bg-lime-50", ring: "stroke-lime-500", border: "border-lime-300", rgb: [101, 163, 13] };
  if (v >= 40) return { text: "text-amber-700", bg: "bg-amber-50", ring: "stroke-amber-500", border: "border-amber-300", rgb: [217, 119, 6] };
  return { text: "text-rose-700", bg: "bg-rose-50", ring: "stroke-rose-500", border: "border-rose-300", rgb: [225, 29, 72] };
};

const statusBadge = (status) => {
  const map = {
    "Analisado": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Reservas":  "bg-amber-50 text-amber-700 border-amber-200",
    "Inviável":  "bg-rose-50 text-rose-700 border-rose-200",
    "Pendente":  "bg-slate-50 text-slate-700 border-slate-200",
  };
  return map[status] || map["Pendente"];
};

// ----------------- EXPORT UTILS -----------------
function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSV(rows) {
  const headers = ["ID", "Designação", "Concelho", "Freguesia", "Artigo", "Área (m²)", "Classificação", "Score", "Estado", "Data"];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(",")];
  rows.forEach((r) => {
    lines.push([r.id, r.designacao, r.concelho, r.freguesia, r.artigo, r.area, r.classificacao, r.score, r.status, r.data].map(escape).join(","));
  });
  const today = new Date().toISOString().slice(0, 10);
  // BOM para Excel reconhecer UTF-8
  downloadBlob("" + lines.join("\n"), `TerraCerta_carteira_${today}.csv`, "text/csv;charset=utf-8");
}

function exportPropertyPDF(property) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const c = scoreColor(property.score);
  const today = new Date().toLocaleDateString("pt-PT");

  // Header bar
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.rect(0, 0, 210, 32, "F");
  doc.setFillColor(5, 150, 105); // emerald-600 accent
  doc.rect(0, 30, 210, 2, "F");

  // Logo mark (square)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 10, 12, 12, 1.5, 1.5, "F");
  doc.setTextColor(6, 78, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TC", 21, 18.5, { align: "center" });

  // Logo type
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TerraCerta", 32, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.text("LAND VIABILITY INTELLIGENCE", 32, 22);

  // Date right-aligned
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`Emitido em ${today}`, 195, 17, { align: "right" });
  doc.text(`Ref. ${property.id ?? "—"}`, 195, 22, { align: "right" });

  // Title
  let y = 48;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Análise de Viabilidade Territorial", 15, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(property.designacao || "—", 15, y);
  y += 8;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, 195, y);
  y += 8;

  // Score card (right side)
  const scoreX = 145, scoreY = y;
  doc.setFillColor(...c.rgb);
  doc.roundedRect(scoreX, scoreY, 50, 30, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(String(property.score ?? "—"), scoreX + 8, scoreY + 18);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("HEALTH SCORE / 100", scoreX + 8, scoreY + 25);

  // Identification block (left side)
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("IDENTIFICAÇÃO", 15, y + 2);
  y += 8;

  const fields = [
    ["Concelho",       property.concelho],
    ["Freguesia",      property.freguesia],
    ["Artigo",         property.artigo],
    ["Área",           formatArea(property.area)],
    ["Classificação",  property.classificacao],
    ["PDM aplicável",  property.pdmRef],
    ["Estado",         property.status],
    ["Data análise",   property.data],
  ];

  doc.setFont("helvetica", "normal");
  fields.forEach(([k, v]) => {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(k, 15, y);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(String(v ?? "—"), 50, y);
    y += 6;
  });

  y = Math.max(y, scoreY + 38);
  y += 5;

  // PDM analysis section
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 8, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Análise PDM · Cruzamento com camadas oficiais", 18, y + 5.5);
  y += 12;

  const findings = [
    ["Classificação do solo", property.classificacao || "—", "OK", "PDM Art. 14º"],
    ["Categoria de espaço", "Espaço Agrícola de Produção (Tipo II)", "OK", "Planta Ordenamento"],
    ["Índice de utilização", "0,15", "Atenção", "PDM Art. 30º"],
    ["Cércea máxima", "6,5 m (2 pisos)", "OK", "PDM Art. 31º"],
    ["REN — Reserva Ecológica", "Parcialmente abrangido (~18%)", "Atenção", "Plant. Condicionantes"],
    ["RAN — Reserva Agrícola", "Não abrangido", "OK", "DRAP"],
    ["Servidão rodoviária", "Faixa non aedificandi 12m", "Atenção", "DL 13/94"],
    ["Risco de incêndio rural", "Classe Média", "OK", "ICNF"],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  findings.forEach((f, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 3.5, 180, 6, "F");
    }
    doc.setTextColor(71, 85, 105);
    doc.text(f[0], 18, y);
    doc.setTextColor(15, 23, 42);
    doc.text(f[1], 75, y);
    if (f[2] === "OK") doc.setTextColor(16, 122, 87);
    else doc.setTextColor(180, 83, 9);
    doc.text(f[2], 150, y);
    doc.setTextColor(148, 163, 184);
    doc.text(f[3], 195, y, { align: "right" });
    y += 6;
  });

  y += 6;

  // Recommendation block
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(15, y, 180, 28, 2, 2, "F");
  doc.setTextColor(6, 95, 70);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("RECOMENDAÇÃO TÉCNICA", 19, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const recommendation = (property.score || 0) >= 80
    ? "Viabilidade elevada. Recomenda-se prosseguir com PIP e levantamento topográfico."
    : (property.score || 0) >= 60
      ? "Viabilidade boa, com reservas. Avaliar condicionantes REN e RJIGT antes de avançar."
      : (property.score || 0) >= 40
        ? "Viabilidade condicionada. Recomenda-se análise jurídica detalhada e sondagem prévia."
        : "Inviabilidade nas condições atuais. Aguardar próxima revisão do PDM.";
  const wrapped = doc.splitTextToSize(recommendation, 170);
  doc.text(wrapped, 19, y + 13);

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 282, 195, 282);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.text("© 2026 TerraCerta · Análise gerada automaticamente. Não substitui parecer técnico de arquiteto, engenheiro ou advogado especializado.", 15, 287);
  doc.text("Página 1 de 1", 195, 287, { align: "right" });

  doc.save(`TerraCerta_${property.id ?? "relatorio"}.pdf`);
}

// ----------------- LOGO -----------------
const Logo = ({ size = "md", invert = false, langLabel }) => {
  const dims = size === "lg" ? "h-9" : size === "sm" ? "h-6" : "h-7";
  const textColor = invert ? "text-white" : "text-slate-900";
  const accentColor = "text-emerald-700"; // Sincronizado com o ícone
  const subColor = invert ? "text-white/60" : "text-slate-500";
  return (
    <div className="flex items-center gap-2">
      <div className={`${dims} aspect-square rounded-md bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-sm`}>
        <Mountain className="text-white" size={size === "lg" ? 20 : size === "sm" ? 14 : 16} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-semibold tracking-tight ${textColor} ${size === "lg" ? "text-xl" : "text-base"}`}>
          Terra<span className={accentColor}>Certa</span>
        </span>
        {size === "lg" && (
          <span className={`text-[10px] uppercase tracking-[0.2em] ${subColor} mt-1`}>
            {langLabel || "Análise de Viabilidade Territorial"}
          </span>
        )}
      </div>
    </div>
  );
};

// ----------------- TRANSLATIONS -----------------
const TRANSLATIONS = {
  pt: { loginTitle: "Iniciar sessão", emailLabel: "Email profissional", passwordLabel: "Palavra-passe", forgotPassword: "Esqueci-me", loginButton: "Entrar na plataforma", tagline: "Análise de Viabilidade Territorial", forgotMsg: "Para recuperar a sua palavra-passe, por favor contacte o administrador da sua agência ou o suporte técnico da TerraCerta.", loggingIn: "A entrar...", lang: "Português", flag: "🇵🇹" },
  en: { loginTitle: "Sign In", emailLabel: "Professional Email", passwordLabel: "Password", forgotPassword: "Forgot password?", loginButton: "Enter Platform", tagline: "Territorial Viability Analysis", forgotMsg: "To recover your password, please contact your agency administrator or TerraCerta technical support.", loggingIn: "Signing in...", lang: "English", flag: "🇺🇸" },
  fr: { loginTitle: "Se connecter", emailLabel: "Email professionnel", passwordLabel: "Mot de passe", forgotPassword: "Oublié ?", loginButton: "Entrer na plataforma", tagline: "Analyse de viabilité territoriale", forgotMsg: "Pour récupérer votre mot de passe, contactez l'administrateur.", loggingIn: "Connexion...", lang: "Français", flag: "🇫🇷" },
  de: { loginTitle: "Anmelden", emailLabel: "Beruflich E-Mail", passwordLabel: "Passwort", forgotPassword: "Vergessen?", loginButton: "Plattform betreten", tagline: "Territoriale Machbarkeitsanalyse", forgotMsg: "Wenden Sie sich an Ihren Administrator.", loggingIn: "Anmelden...", lang: "Deutsch", flag: "🇩🇪" },
  es: { loginTitle: "Iniciar sesión", emailLabel: "Email profesional", passwordLabel: "Contraseña", forgotPassword: "¿Olvidaste?", loginButton: "Entrar en la plataforma", tagline: "Análisis de Viabilidad Territorial", forgotMsg: "Contacte con su administrador.", loggingIn: "Entrando...", lang: "Español", flag: "🇪🇸" },
  it: { loginTitle: "Accedi", emailLabel: "Email professionale", passwordLabel: "Password", forgotPassword: "Dimenticata?", loginButton: "Entra na plataforma", tagline: "Analisi di Viabilità Territoriale", forgotMsg: "Contatta il tuo amministratore.", loggingIn: "Accesso...", lang: "Italiano", flag: "🇮🇹" },
};

// ----------------- IMMERSIVE LANDSCAPE BACKGROUND -----------------
const LandscapeBackground = () => {
  const [trees, setTrees] = useState([]);
  const [rain, setRain] = useState(false);
  const [birdRoute, setBirdRoute] = useState(0);

  const plantTree = (e) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    // Only plant in the lower half (ground)
    if (cursor.y > 700) {
      setTrees([...trees, { x: cursor.x, y: cursor.y, id: Date.now() }]);
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes drift-slow { from { transform: translateX(-15vw); } to { transform: translateX(115vw); } }
        @keyframes fly-loop {
          0%   { transform: translate(-10vw, 0) scale(1); }
          45%  { transform: translate(50vw, ${-3 + birdRoute}vh) scale(0.9); }
          100% { transform: translate(115vw, ${2 + birdRoute}vh) scale(0.85); }
        }
        @keyframes rainfall { from { transform: translateY(-20px); } to { transform: translateY(1080px); } }
        .tc-cloud-a { animation: drift-slow 110s linear infinite; cursor: pointer; }
        .tc-birds { animation: fly-loop 60s linear infinite; cursor: pointer; }
        .tc-rain { animation: rainfall 1s linear infinite; }
      `}</style>

      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" onClick={plantTree}>
        <defs>
          <linearGradient id="bg-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fbe7c4" /><stop offset="35%" stopColor="#f4cfa0" /><stop offset="70%" stopColor="#e8a978" /><stop offset="100%" stopColor="#c9825a" />
          </linearGradient>
          <radialGradient id="bg-sun" cx="0.72" cy="0.32" r="0.18">
            <stop offset="0%" stopColor="#fff5dc" stopOpacity="1" /><stop offset="60%" stopColor="#ffe4b8" stopOpacity="0.4" /><stop offset="100%" stopColor="#ffe4b8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bg-mountains" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7a8b8e" stopOpacity="0.6" /><stop offset="100%" stopColor="#5b6e72" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="bg-hill-near" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3a5d34" /><stop offset="100%" stopColor="#243d22" />
          </linearGradient>
          <linearGradient id="bg-field" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d4c685" /><stop offset="100%" stopColor="#a89255" />
          </linearGradient>
        </defs>

        <rect width="1920" height="1080" fill="url(#bg-sky)" />
        <rect width="1920" height="1080" fill="url(#bg-sun)" />
        <path d="M0,520 L120,470 L210,495 L320,440 L420,475 L540,420 L660,460 L780,430 L900,475 L1040,440 L1180,490 L1320,455 L1480,485 L1620,445 L1780,475 L1920,455 L1920,600 L0,600 Z" fill="url(#bg-mountains)" />
        <path d="M0,780 Q400,700 800,740 T1500,720 T1920,740 L1920,1080 L0,1080 Z" fill="url(#bg-hill-near)" />
        <path d="M0,860 Q500,820 1000,840 T1920,830 L1920,1080 L0,1080 Z" fill="url(#bg-field)" opacity="0.9" />

        {/* Planted trees */}
        {trees.map(t => (
          <g key={t.id} transform={`translate(${t.x}, ${t.y})`}>
            <ellipse cx="0" cy="0" rx="8" ry="24" fill="#1c3a1a" />
          </g>
        ))}

        {/* Rain layer */}
        {rain && Array.from({ length: 100 }).map((_, i) => (
          <line key={i} x1={Math.random() * 1920} y1="-20" x2={Math.random() * 1920} y2="0" stroke="white" opacity="0.3" strokeWidth="1" className="tc-rain" style={{ animationDelay: `${Math.random()}s` }} />
        ))}
      </svg>

      <svg className="absolute top-[8%] left-0 w-[20vw] max-w-[260px] tc-cloud-a opacity-90" viewBox="0 0 200 60" onClick={(e) => { e.stopPropagation(); setRain(!rain); }}>
        <ellipse cx="50" cy="35" rx="40" ry="18" fill="white" />
        <ellipse cx="90" cy="28" rx="32" ry="20" fill="white" />
        <ellipse cx="130" cy="35" rx="38" ry="16" fill="white" />
      </svg>

      <svg className="absolute top-[22%] left-0 w-[8vw] max-w-[120px] tc-birds opacity-70" viewBox="0 0 100 40" fill="none" stroke="#3a2818" strokeWidth="1.6" onClick={(e) => { e.stopPropagation(); setBirdRoute(r => r + 5); }}>
        <path d="M5,20 q5,-7 10,0 q5,-7 10,0" /><path d="M30,28 q4,-6 8,0 q4,-6 8,0" />
      </svg>
    </div>
  );
};

// ----------------- LOGIN PAGE -----------------
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
    const normalisedEmail = email.toLowerCase().trim();
    const expectedPwd = ALLOWED_USERS[normalisedEmail];
    if (!expectedPwd) {
      setError(lang === "pt" ? "Conta não autorizada." : "Unauthorized account.");
      return;
    }
    if (expectedPwd !== password) {
      setError(lang === "pt" ? "Palavra-passe incorreta." : "Incorrect password.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => onLogin(normalisedEmail), 300);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-slate-900">
      <LandscapeBackground />

      <header className="absolute top-0 left-0 right-0 z-20 px-8 py-6 flex items-center justify-between">
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

      <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] bg-white rounded-lg shadow-2xl border border-white/40 overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">{t.loginTitle}</h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider">{t.emailLabel}</label>
                <div className="mt-1.5 relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@terracerta.pt" className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider">{t.passwordLabel}</label>
                  <button type="button" onClick={() => alert(t.forgotMsg)} className="text-xs text-emerald-700 hover:text-emerald-800 font-medium">{t.forgotPassword}</button>
                </div>
                <div className="mt-1.5 relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition" />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 leading-relaxed">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={submitting} className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium py-2.5 rounded-md transition-all flex items-center justify-center gap-2 group">
                {submitting ? <><Loader2 size={15} className="animate-spin" /> {t.loggingIn}</> : <>{t.loginButton} <ArrowRight size={15} className="group-hover:translate-x-0.5 transition" /></>}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

// ----------------- TOP BAR -----------------
const TopBar = ({ user, currentPage, onLogout, onNavigate }) => {
  const initials = (user || "JL").split("@")[0].slice(0, 2).toUpperCase();
  const isActive = (p) => currentPage === p;
  const navBtn = (label, target) => (
    <button
      onClick={() => onNavigate(target)}
      className={`px-3 py-1.5 rounded-md ${isActive(target) ? "text-slate-900 bg-slate-100 font-medium" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}
    >
      {label}
    </button>
  );
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => onNavigate("dashboard")} className="hover:opacity-80 transition"><Logo /></button>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {navBtn("Terrenos", "dashboard")}
            {navBtn("Análises", "dashboard")}
            {navBtn("Relatórios", "dashboard")}
            {navBtn("Camadas SIG", "sig")}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 rounded-md text-slate-500"><Bell size={16} /></button>
          <button className="p-2 hover:bg-slate-100 rounded-md text-slate-500"><Settings size={16} /></button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button className="flex items-center gap-2 pl-1 pr-2 py-1 hover:bg-slate-100 rounded-md">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white text-xs font-semibold">{initials}</div>
            <span className="text-xs text-slate-700 font-medium hidden md:block">{user?.split("@")[0] ?? "Utilizador"}</span>
          </button>
          <button onClick={onLogout} className="p-2 hover:bg-slate-100 rounded-md text-slate-500" title="Sair"><LogOut size={16} /></button>
        </div>
      </div>
    </header>
  );
};

// ----------------- DASHBOARD -----------------
const Dashboard = ({ user, properties, loading, error, onRefresh, onNew, onSelect, onLogout, onNavigate }) => {
  const [filter, setFilter] = useState("");
  const filtered = properties.filter(p =>
    p.designacao?.toLowerCase().includes(filter.toLowerCase()) ||
    p.concelho?.toLowerCase().includes(filter.toLowerCase()) ||
    p.id?.toLowerCase().includes(filter.toLowerCase())
  );

  const totalArea = properties.reduce((s, p) => s + (p.area || 0), 0);
  const avgScore = properties.length
    ? Math.round(properties.reduce((s, p) => s + (p.score || 0), 0) / properties.length)
    : 0;
  const viable = properties.filter(p => (p.score || 0) >= 60).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar user={user} currentPage="dashboard" onLogout={onLogout} onNavigate={onNavigate} />

      <main className="px-6 py-6 max-w-[1500px] mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1">Carteira</div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard de Terrenos</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar
            </button>
            <button
              onClick={onNew}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-md transition shadow-sm"
            >
              <Plus size={15} /> Novo Terreno
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Erro ao carregar a carteira de terrenos</div>
              <div className="text-xs mt-0.5">{error}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-md overflow-hidden mb-6">
          {[
            { label: "Terrenos em carteira", value: loading ? "…" : properties.length, sub: "atualizado agora", icon: Layers, accent: "text-slate-900" },
            { label: "Área total agregada", value: loading ? "…" : formatArea(totalArea), sub: totalArea < 10000 ? "abaixo de 1 ha" : `${formatNumber(totalArea)} m²`, icon: Ruler, accent: "text-slate-900" },
            { label: "Health Score médio", value: loading ? "…" : avgScore, sub: "/100", icon: Activity, accent: "text-emerald-700" },
            { label: "Viabilidade ≥ 60", value: loading ? "…" : `${viable}/${properties.length}`, sub: properties.length ? `${Math.round(viable / properties.length * 100)}% do portefólio` : "—", icon: TrendingUp, accent: "text-emerald-700" },
          ].map((s, i) => (
            <div key={i} className="bg-white p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{s.label}</span>
                <s.icon size={14} className="text-slate-400" />
              </div>
              <div className={`text-2xl font-semibold tabular-nums ${s.accent}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-t-md px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Pesquisar por designação, concelho, ID..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50">
              <Filter size={13} /> Filtros
            </button>
          </div>
          <div className="text-xs text-slate-500">{filtered.length} de {properties.length} terrenos</div>
        </div>

        <div className="bg-white border border-slate-200 border-t-0 rounded-b-md overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={28} className="animate-spin mb-3" />
              <div className="text-sm">A carregar terrenos…</div>
            </div>
          ) : properties.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center text-slate-400">
              <Layers size={32} className="mb-3" />
              <div className="text-sm font-medium text-slate-600">A sua carteira está vazia</div>
              <div className="text-xs mt-1 max-w-sm">Adicione o primeiro terreno para começar a ver análises de viabilidade.</div>
              <button onClick={onNew} className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md">
                <Plus size={13} /> Novo Terreno
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="text-left px-4 py-2.5 font-medium">
                    <button className="flex items-center gap-1 hover:text-slate-700">ID <ArrowUpDown size={11} /></button>
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium">Designação</th>
                  <th className="text-left px-4 py-2.5 font-medium">Concelho / Freguesia</th>
                  <th className="text-left px-4 py-2.5 font-medium">Artigo Matricial</th>
                  <th className="text-right px-4 py-2.5 font-medium">Área</th>
                  <th className="text-left px-4 py-2.5 font-medium">Classificação</th>
                  <th className="text-center px-4 py-2.5 font-medium">Score</th>
                  <th className="text-left px-4 py-2.5 font-medium">Estado</th>
                  <th className="text-left px-4 py-2.5 font-medium">Data</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const c = scoreColor(p.score);
                  return (
                    <tr key={p.id} onClick={() => onSelect(p)} className="hover:bg-emerald-50/40 cursor-pointer transition">
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{p.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.designacao}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{p.concelho}</div>
                        <div className="text-xs text-slate-400">{p.freguesia}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">{p.artigo}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-900">{formatArea(p.area)}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{p.classificacao}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${c.text.replace('text-', 'bg-')}`} style={{ width: `${p.score || 0}%` }}></div>
                          </div>
                          <span className={`text-xs font-semibold tabular-nums ${c.text} w-7 text-right`}>{p.score ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${statusBadge(p.status)}`}>
                          {p.status || "Pendente"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{p.data}</td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight size={15} className="text-slate-400 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Última sincronização: agora</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportCSV(filtered.length ? filtered : properties)}
                disabled={!properties.length}
                className="hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Exportar CSV
              </button>
              <button onClick={() => onNavigate("sig")} className="hover:text-slate-700 flex items-center gap-1">
                Ver no mapa <ChevronRight size={11} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// ----------------- ANALYSIS PROGRESS OVERLAY -----------------
const ANALYSIS_STEPS = [
  { msg: "A aceder ao servidor SNIT...", icon: Satellite },
  { msg: "A descarregar regulamento do PDM...", icon: Download },
  { msg: "A extrair dados da Caderneta Predial (OCR)...", icon: FileText },
  { msg: "A cruzar localização com camadas REN e RAN...", icon: MapIcon },
  { msg: "A calcular índices de edificabilidade...", icon: Calculator },
  { msg: "A gerar relatório final e Health Score...", icon: Sparkles },
];
const STEP_DURATION_MS = 8000;
const TOTAL_DURATION_MS = 55000;

const AnalysisOverlay = ({ form, onDone, onError }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const idx = Math.min(Math.floor(elapsed / STEP_DURATION_MS), ANALYSIS_STEPS.length - 1);
      setStepIdx(idx);
      setProgress(Math.min((elapsed / TOTAL_DURATION_MS) * 100, 100));
    }, 120);

    const finish = setTimeout(async () => {
      clearInterval(tick);
      setProgress(100);
      setStepIdx(ANALYSIS_STEPS.length - 1);
      try {
        const newProperty = await insertPropriedade(form);
        onDone(newProperty);
      } catch (e) {
        onError(e?.message ?? "Erro ao gravar a análise.");
      }
    }, TOTAL_DURATION_MS);

    return () => { clearInterval(tick); clearTimeout(finish); };
  }, []);

  const Icon = ANALYSIS_STEPS[stepIdx].icon;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col items-center justify-center p-6">
      <div className="absolute top-8 left-8"><Logo size="md" /></div>

      <div className="w-full max-w-xl text-center">
        <div className="relative mx-auto mb-8 w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
          <div className="absolute inset-2 rounded-full bg-emerald-100/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-white shadow-lg border border-emerald-200 flex items-center justify-center">
              <Icon className="text-emerald-700" size={32} strokeWidth={1.8} />
            </div>
          </div>
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" stroke="#e2e8f0" strokeWidth="2" fill="none" />
            <circle
              cx="50" cy="50" r="46"
              stroke="#059669" strokeWidth="2" fill="none"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={2 * Math.PI * 46 * (1 - progress / 100)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.4s linear" }}
            />
          </svg>
        </div>

        <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500 font-medium mb-2">
          Análise em curso · {Math.round(progress)}%
        </div>
        <div className="text-2xl font-semibold text-slate-900 tracking-tight min-h-[2.5rem] transition-all">
          {ANALYSIS_STEPS[stepIdx].msg}
        </div>

        <div className="mt-8 mx-auto max-w-md">
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 tabular-nums">
            <span>0:00</span>
            <span>0:55</span>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 max-w-lg mx-auto text-left">
          {ANALYSIS_STEPS.map((s, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={i} className={`flex items-center gap-2.5 text-xs py-1 transition ${
                done ? "text-emerald-700" : active ? "text-slate-900 font-medium" : "text-slate-400"
              }`}>
                {done ? (
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                ) : active ? (
                  <Loader2 size={14} className="text-emerald-600 animate-spin shrink-0" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{s.msg.replace("...", "")}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-[11px] text-slate-400">
          A processar terreno <span className="font-medium text-slate-600">{form.designacao}</span>
          {form.concelho && <> · {form.concelho}</>}
        </div>
      </div>
    </div>
  );
};

// ----------------- UPLOAD / NEW PROPERTY -----------------
const FileDropzone = ({ doc, file, onPick, onRemove }) => {
  const inputRef = useRef(null);
  return (
    <div
      onClick={() => !file && inputRef.current?.click()}
      className={`group bg-white border rounded-md p-5 transition-all cursor-pointer ${
        file ? "border-emerald-300 bg-emerald-50/30" : "border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/20"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick({ name: f.name, size: f.size });
          e.target.value = "";
        }}
      />
      <div className="flex items-center gap-4">
        <div className={`h-11 w-11 rounded-md flex items-center justify-center shrink-0 ${
          file ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700"
        }`}>
          {file ? <CheckCircle2 size={20} /> : <doc.icon size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 text-sm">{doc.title}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">{doc.hint}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{doc.subtitle}</div>
          {file && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <FileText size={12} className="text-emerald-700" />
              <span className="font-mono text-slate-700 truncate max-w-[280px]" title={file.name}>{file.name}</span>
              <span className="text-slate-400">· {formatBytes(file.size)}</span>
            </div>
          )}
        </div>
        {!file ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md group-hover:border-emerald-400 group-hover:text-emerald-700">
            <Upload size={12} /> Carregar
          </div>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1">
            Remover
          </button>
        )}
      </div>
    </div>
  );
};

const UploadPage = ({ user, onCancel, onAnalyseDone, onLogout, onNavigate }) => {
  const [files, setFiles] = useState({ caderneta: null, planta: null, certidao: null });
  const [form, setForm] = useState({
    designacao: "", concelho: "", freguesia: "", artigo: "", area: "", classificacao: "",
  });
  const [analysing, setAnalysing] = useState(false);
  const [insertError, setInsertError] = useState(null);

  const updateForm = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === "concelho") next.freguesia = ""; // reset freguesia quando muda concelho
    return next;
  });

  const formValid = form.designacao.trim() && form.concelho && form.freguesia
    && form.artigo.trim() && form.area && form.classificacao;
  const allUploaded = files.caderneta && files.planta && files.certidao;
  const canAnalyse = formValid && allUploaded;

  const docs = [
    { key: "caderneta", title: "Caderneta Predial", subtitle: "Documento das Finanças (Modelo 1)", icon: FileText, hint: "PDF · até 10MB" },
    { key: "planta", title: "Planta de Localização", subtitle: "Câmara Municipal · escala 1:2000 ou superior", icon: MapPin, hint: "PDF / DWG / DXF" },
    { key: "certidao", title: "Certidão Permanente", subtitle: "Conservatória do Registo Predial", icon: FileCheck, hint: "PDF · código de acesso aceite" },
  ];

  if (analysing) {
    return (
      <AnalysisOverlay
        form={form}
        onDone={(prop) => onAnalyseDone(prop)}
        onError={(msg) => { setInsertError(msg); setAnalysing(false); }}
      />
    );
  }

  const freguesiasDisponiveis = form.concelho ? FREGUESIAS[form.concelho] || [] : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar user={user} currentPage="upload" onLogout={onLogout} onNavigate={onNavigate} />

      <main className="px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <button onClick={onCancel} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-3">
            <ChevronLeft size={13} /> Voltar ao dashboard
          </button>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1">Novo terreno · Passo 1 de 2</div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Submissão de terreno</h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
            Preencha os dados matriciais do terreno e carregue a documentação.
            A análise demora ~55 segundos a concluir.
          </p>
        </div>

        {insertError && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Não foi possível gravar a análise</div>
              <div className="text-xs mt-0.5">{insertError}</div>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-md p-5 mb-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-4">Dados do terreno</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider">Designação *</label>
              <input
                value={form.designacao}
                onChange={(e) => updateForm("designacao", e.target.value)}
                placeholder="Ex: Quinta da Ribeira"
                className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider">Concelho *</label>
              <select
                value={form.concelho}
                onChange={(e) => updateForm("concelho", e.target.value)}
                className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
              >
                <option value="">Selecionar concelho...</option>
                {CONCELHOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider">
                Freguesia * {!form.concelho && <span className="text-slate-400 normal-case">(escolha primeiro o concelho)</span>}
              </label>
              <select
                value={form.freguesia}
                onChange={(e) => updateForm("freguesia", e.target.value)}
                disabled={!form.concelho}
                className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">{form.concelho ? "Selecionar freguesia..." : "—"}</option>
                {freguesiasDisponiveis.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider">Artigo matricial *</label>
              <input
                value={form.artigo}
                onChange={(e) => updateForm("artigo", e.target.value)}
                placeholder="Ex: 1452 / Secção B"
                className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider">Área (m²) *</label>
              <input
                type="number"
                min="0"
                value={form.area}
                onChange={(e) => updateForm("area", e.target.value)}
                placeholder="Ex: 12450"
                className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 tabular-nums"
              />
              {form.area && (
                <div className="mt-1 text-[11px] text-slate-500">≈ {formatArea(Number(form.area))}</div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider">Classificação atual *</label>
              <select
                value={form.classificacao}
                onChange={(e) => updateForm("classificacao", e.target.value)}
                className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
              >
                <option value="">Selecionar classificação...</option>
                {CLASSIFICACOES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-3 px-1">Documentação de suporte</div>
        <div className="space-y-3">
          {docs.map((d) => (
            <FileDropzone
              key={d.key}
              doc={d}
              file={files[d.key]}
              onPick={(meta) => setFiles(prev => ({ ...prev, [d.key]: meta }))}
              onRemove={() => setFiles(prev => ({ ...prev, [d.key]: null }))}
            />
          ))}
        </div>

        <div className="mt-6 bg-white border border-slate-200 rounded-md p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-3">Parâmetros de análise</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded text-emerald-600" /> Cruzamento com REN / RAN</label>
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded text-emerald-600" /> Servidões e restrições de utilidade pública</label>
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded text-emerald-600" /> Análise de viabilidade urbanística</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="rounded text-emerald-600" /> Estimativa de valor de mercado (β)</label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Shield size={12} /> Documentos cifrados em repouso · removidos após 90 dias
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md">Cancelar</button>
            <button
              disabled={!canAnalyse}
              onClick={() => { setInsertError(null); setAnalysing(true); }}
              className={`px-5 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition ${
                canAnalyse ? "bg-slate-900 hover:bg-slate-800 text-white shadow-sm" : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Zap size={14} /> Analisar terreno
            </button>
          </div>
        </div>

        {!canAnalyse && (
          <div className="mt-3 text-right text-[11px] text-slate-400">
            {!formValid && "Preencha todos os campos obrigatórios. "}
            {!allUploaded && "Carregue os 3 documentos de suporte."}
          </div>
        )}
      </main>
    </div>
  );
};

// ----------------- SIG / MAP PAGE -----------------
const SIGPage = ({ user, properties, onLogout, onNavigate }) => {
  const [layers, setLayers] = useState({
    pdm: true, ren: false, ran: false, prot: false, hidrografia: false, riscos: false,
  });
  const [bbox, setBbox] = useState("-10.0,36.5,-6.0,42.5"); // Portugal continental

  const layerList = [
    { key: "pdm", label: "PDM municipais", count: 308 },
    { key: "ren", label: "Reserva Ecológica Nacional", count: 1 },
    { key: "ran", label: "Reserva Agrícola Nacional", count: 1 },
    { key: "prot", label: "PROT regionais", count: 5 },
    { key: "hidrografia", label: "Rede hidrográfica", count: 1 },
    { key: "riscos", label: "Riscos naturais (incêndio)", count: 1 },
  ];

  const presets = [
    { label: "Portugal", bbox: "-10.0,36.5,-6.0,42.5" },
    { label: "Lisboa", bbox: "-9.30,38.65,-9.05,38.85" },
    { label: "Porto", bbox: "-8.75,41.10,-8.50,41.25" },
    { label: "Sintra", bbox: "-9.55,38.75,-9.30,38.92" },
    { label: "Oeiras", bbox: "-9.40,38.65,-9.20,38.78" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar user={user} currentPage="sig" onLogout={onLogout} onNavigate={onNavigate} />

      <main className="px-6 py-6 max-w-[1500px] mx-auto">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1">Cartografia</div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Camadas SIG · Cartografia oficial</h1>
            <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
              Visualização interativa do território português com sobreposição de camadas oficiais.
            </p>
          </div>
          <div className="flex items-center gap-1">
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => setBbox(p.bbox)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition ${
                  bbox === p.bbox ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-12 lg:col-span-3 space-y-4">
            <div className="bg-white border border-slate-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={14} className="text-slate-500" />
                <h3 className="text-xs uppercase tracking-wider text-slate-500 font-medium">Camadas disponíveis</h3>
              </div>
              <div className="space-y-1">
                {layerList.map(l => (
                  <label
                    key={l.key}
                    className={`flex items-center justify-between gap-2 px-2 py-2 rounded-md cursor-pointer transition ${
                      layers[l.key] ? "bg-emerald-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={layers[l.key]}
                        onChange={(e) => setLayers(p => ({ ...p, [l.key]: e.target.checked }))}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className={layers[l.key] ? "text-slate-900 font-medium" : "text-slate-700"}>{l.label}</span>
                    </div>
                    {layers[l.key] ? <Eye size={13} className="text-emerald-600" /> : <EyeOff size={13} className="text-slate-300" />}
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-3 flex items-center gap-2">
                <Globe2 size={13} /> Resumo
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Camadas ativas</dt>
                  <dd className="font-medium text-slate-900">{Object.values(layers).filter(Boolean).length} / {layerList.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Terrenos no mapa</dt>
                  <dd className="font-medium text-slate-900">{properties.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Zoom atual</dt>
                  <dd className="font-medium text-slate-900 text-xs">{bbox.split(",").map(n => Number(n).toFixed(1)).join(", ")}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 text-xs text-emerald-800 leading-relaxed">
              <Info size={14} className="inline mr-1 -mt-0.5" />
              As camadas selecionadas serão sobrepostas no mapa quando a integração WMS DGT estiver disponível.
            </div>
          </aside>

          <div className="col-span-12 lg:col-span-9 bg-white border border-slate-200 rounded-md overflow-hidden">
            <iframe
              key={bbox}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`}
              className="w-full h-[70vh] border-0"
              title="Mapa Portugal"
            />
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Cartografia base © OpenStreetMap contributors · ODbL</span>
              <a
                href={`https://www.openstreetmap.org/?bbox=${bbox}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
              >
                Abrir mapa em nova janela <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// ----------------- HEALTH SCORE GAUGE -----------------
const HealthGauge = ({ score }) => {
  const c = scoreColor(score);
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - ((score || 0) / 100) * circ;
  return (
    <div className="relative w-44 h-44">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} stroke="#f1f5f9" strokeWidth="10" fill="none" />
        <circle
          cx="80" cy="80" r={r}
          strokeWidth="10" fill="none"
          className={c.ring}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-5xl font-semibold tabular-nums ${c.text}`}>{score ?? "—"}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Health Score</div>
        <div className="text-xs text-slate-400">/ 100</div>
      </div>
    </div>
  );
};

// ----------------- ANALYSIS PAGE -----------------
const AnalysisPage = ({ user, property, page, setPage, onBack, onLogout, onNavigate }) => {
  const c = scoreColor(property.score);
  const pdmLink = PDM_LINKS[property.concelho] || "https://www.dgterritorio.gov.pt/";

  const pdmFindings = [
    { label: "Classificação do solo", value: property.classificacao, status: "ok", source: "PDM Art. 14º" },
    { label: "Categoria de espaço", value: "Espaço Agrícola de Produção (Tipo II)", status: (property.score || 0) >= 60 ? "ok" : "warn", source: "Planta de Ordenamento" },
    { label: "Subcategoria", value: "Áreas agrícolas complementares", status: "ok", source: "PDM Art. 27º nº2" },
    { label: "Índice de utilização (Iu)", value: "0,15", status: "warn", source: "PDM Art. 30º" },
    { label: "Cércea máxima", value: "6,5 m (2 pisos)", status: "ok", source: "PDM Art. 31º" },
    { label: "REN — Reserva Ecológica", value: "Parcialmente abrangido (≈18%)", status: "warn", source: "Planta de Condicionantes" },
    { label: "RAN — Reserva Agrícola", value: "Não abrangido", status: "ok", source: "DRAP" },
    { label: "Servidão rodoviária", value: "Faixa non aedificandi 12m (EN229)", status: "warn", source: "DL 13/94" },
    { label: "Risco de incêndio rural", value: "Classe Média", status: "ok", source: "ICNF · Carta 2025" },
  ];

  const conversionScore = Math.max(15, (property.score || 0) - 22);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar user={user} currentPage="analysis" onLogout={onLogout} onNavigate={onNavigate} />

      <main className="px-6 py-6 max-w-[1400px] mx-auto">
        <div className="mb-5">
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-3">
            <ChevronLeft size={13} /> Terrenos · {property.id}
          </button>
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1">Análise de viabilidade</div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{property.designacao}</h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 flex-wrap">
                <MapPin size={12} /> {property.freguesia}, {property.concelho}
                <span className="text-slate-300">·</span>
                <Hash size={12} /> {property.artigo}
                <span className="text-slate-300">·</span>
                <Calendar size={12} /> Emitido {property.data}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex border border-slate-200 rounded-md overflow-hidden bg-white">
                <button
                  onClick={() => setPage(1)}
                  className={`px-4 py-1.5 text-xs font-medium transition ${page === 1 ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  1 · Análise PDM
                </button>
                <button
                  onClick={() => setPage(2)}
                  className={`px-4 py-1.5 text-xs font-medium transition ${page === 2 ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  2 · Conversão Urbano
                </button>
              </div>
              <button
                onClick={() => onNavigate("sig")}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
              >
                <ExternalLink size={12} /> Abrir no mapa
              </button>
            </div>
          </div>
        </div>

        {page === 1 ? (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-md p-6 flex flex-col items-center text-center">
                <HealthGauge score={property.score} />
                <div className={`mt-4 px-3 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
                  {(property.score || 0) >= 80 ? "Viabilidade elevada" : (property.score || 0) >= 60 ? "Viabilidade boa com reservas" : (property.score || 0) >= 40 ? "Viabilidade condicionada" : "Inviável nas condições atuais"}
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  Score calculado com base em 14 indicadores do PDM, condicionantes legais e camadas oficiais do território.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-md">
                <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Dados extraídos</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">OCR ✓</span>
                </div>
                <dl className="divide-y divide-slate-100">
                  {[
                    ["Concelho", property.concelho, MapPin],
                    ["Freguesia", property.freguesia, MapPin],
                    ["Artigo matricial", property.artigo, Hash],
                    ["Área total", formatArea(property.area), Ruler],
                    ["Confrontações", "N: caminho público", Building2],
                    ["Inscrição", "Definitiva 2018-04-12", FileCheck],
                    ["PDM aplicável", property.pdmRef, Layers],
                  ].map(([k, v, Icon], i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <span className="text-slate-500 text-xs flex items-center gap-2"><Icon size={11} /> {k}</span>
                      <span className="text-slate-900 font-medium text-xs text-right">{v}</span>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8 space-y-4">
              <div className="bg-white border border-slate-200 rounded-md">
                <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-slate-900 text-sm">Análise PDM</h2>
                      <span className="text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">Tempo real</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Interpretação automática do regulamento <span className="font-mono text-slate-700">{property.pdmRef}</span> e cruzamento com 9 camadas oficiais.
                    </p>
                  </div>
                  <div className="text-xs text-slate-400">Fonte oficial DGT</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {pdmFindings.map((f, i) => {
                    const Icon = f.status === "ok" ? CheckCircle : f.status === "warn" ? AlertTriangle : XCircle;
                    const color = f.status === "ok" ? "text-emerald-600" : f.status === "warn" ? "text-amber-600" : "text-rose-600";
                    return (
                      <div key={i} className="px-5 py-3 flex items-start gap-4 text-sm hover:bg-slate-50/50">
                        <Icon size={16} className={`${color} mt-0.5 shrink-0`} />
                        <div className="flex-1 grid grid-cols-12 gap-3 items-baseline">
                          <div className="col-span-4 text-slate-600 text-xs">{f.label}</div>
                          <div className="col-span-6 text-slate-900 font-medium">{f.value}</div>
                          <div className="col-span-2 text-right text-[11px] text-slate-400 font-mono">{f.source}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1"><CheckCircle size={11} className="text-emerald-600" /> 5 conformes</span>
                    <span className="flex items-center gap-1"><AlertTriangle size={11} className="text-amber-600" /> 4 condicionantes</span>
                    <span className="flex items-center gap-1"><XCircle size={11} className="text-rose-600" /> 0 inviáveis</span>
                  </div>
                  <a
                    href={pdmLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
                  >
                    Ver regulamento integral <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-md p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-700" />
                  Recomendações do TerraCerta
                </h3>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  <li className="flex gap-3"><span className="text-emerald-700 font-mono text-xs mt-0.5">01</span><span>Solicitar <strong>delimitação</strong> da área REN ao ICNF antes de qualquer pedido de informação prévia.</span></li>
                  <li className="flex gap-3"><span className="text-emerald-700 font-mono text-xs mt-0.5">02</span><span>A faixa non aedificandi da EN229 reduz a área útil edificável em ~9%. Considerar no estudo prévio.</span></li>
                  <li className="flex gap-3"><span className="text-emerald-700 font-mono text-xs mt-0.5">03</span><span>Iu de 0,15 permite até <strong>{formatNumber(Math.round((property.area || 0) * 0.15))} m²</strong> de construction. Avaliar PIP para confirmar.</span></li>
                  <li className="flex gap-3"><span className="text-emerald-700 font-mono text-xs mt-0.5">04</span><span>O PDM tem <strong>3ª Alteração por Adaptação</strong> em vigor desde 12/03/2025 — recomenda-se confirmar versão.</span></li>
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setPage(2)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-md shadow-sm"
                >
                  Próxima · Conversão para Urbano <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-8 space-y-4">
              <div className="bg-white border border-slate-200 rounded-md">
                <div className="px-5 py-3 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-900 text-sm">Viabilidade de conversão para solo Urbano</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Simulação baseada nos critérios do RJIGT (DL 80/2015) e nas dinâmicas territoriais do concelho.
                  </p>
                </div>

                <div className="p-5 grid grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded-md overflow-hidden">
                  {[
                    { label: "Probabilidade conversão", value: `${conversionScore}%`, sub: "horizonte 5-7 anos", color: scoreColor(conversionScore).text },
                    { label: "Custo estimado processo", value: "€ 8.400", sub: "taxas + assessoria", color: "text-slate-900" },
                    { label: "Prazo médio CM", value: "14-22 meses", sub: "incl. discussão pública", color: "text-slate-900" },
                  ].map((s, i) => (
                    <div key={i} className="bg-white p-4">
                      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">{s.label}</div>
                      <div className={`text-2xl font-semibold tabular-nums ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-5">
                  <h3 className="text-xs uppercase tracking-wider text-slate-500 font-medium mt-5 mb-3">Análise dos requisitos legais (RJIGT)</h3>
                  <div className="border border-slate-200 rounded-md divide-y divide-slate-100">
                    {[
                      { req: "Contiguidade ao perímetro urbano existente", status: "ok", note: "Distância 280m ao limite" },
                      { req: "Infraestruturas básicas (água, eletricidade, saneamento)", status: "warn", note: "Saneamento a 420m — extensão necessária" },
                      { req: "Acessibilidade rodoviária estruturante", status: "ok", note: "EN229 + caminho municipal" },
                      { req: "Não sobreposição com REN crítica", status: "warn", note: "18% da parcela em REN" },
                      { req: "Compatibilidade com PROT-Centro", status: "ok", note: "Categoria mista compatível" },
                      { req: "Equilíbrio áreas urbanizadas/rústicas no concelho", status: "warn", note: "Concelho próximo do limite legal" },
                      { req: "Justificação demográfica/económica", status: "warn", note: "Crescimento populacional negativo (-1,2% / ano)" },
                    ].map((r, i) => {
                      const Icon = r.status === "ok" ? CheckCircle : AlertTriangle;
                      const color = r.status === "ok" ? "text-emerald-600" : "text-amber-600";
                      return (
                        <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                          <Icon size={15} className={color} />
                          <span className="flex-1 text-slate-700">{r.req}</span>
                          <span className="text-xs text-slate-500">{r.note}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-md p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Impacto no valor (cenário comparativo)</h3>
                <p className="text-xs text-slate-500 mb-4">Estimativa baseada em transações comparáveis na região (INE / Autoridade Tributária 2024).</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {[
                    { tag: "Atual (rústico)", v: "€ 24.900", sub: "≈ €2,00/m²", color: "border-slate-200" },
                    { tag: "Pós-conversão (urbano BD)", v: "€ 186.750", sub: "≈ €15,00/m²", color: "border-emerald-300 bg-emerald-50/40" },
                    { tag: "Delta potencial", v: "+€ 161.850", sub: "+650% · após líquidos €127k", color: "border-emerald-300 bg-emerald-50/40" },
                  ].map((s, i) => (
                    <div key={i} className={`p-3 border rounded-md ${s.color}`}>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">{s.tag}</div>
                      <div className="text-xl font-semibold text-slate-900 tabular-nums">{s.v}</div>
                      <div className="text-xs text-slate-500">{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-md p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Score de conversão</span>
                  <Activity size={13} className="text-slate-400" />
                </div>
                <div className={`text-5xl font-semibold tabular-nums ${scoreColor(conversionScore).text}`}>{conversionScore}</div>
                <div className="text-xs text-slate-500 mt-1">Probabilidade ponderada</div>
                <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${scoreColor(conversionScore).text.replace('text-', 'bg-')}`} style={{ width: `${conversionScore}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0</span><span>50</span><span>100</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-md p-5">
                <h3 className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-3">Próximos passos sugeridos</h3>
                <ol className="space-y-3 text-sm text-slate-700">
                  <li className="flex gap-3"><span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center shrink-0">1</span><span>Solicitar Pedido de Informação Prévia (PIP) à CM de {property.concelho}.</span></li>
                  <li className="flex gap-3"><span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center shrink-0">2</span><span>Encomendar levantamento topográfico georreferenciado.</span></li>
                  <li className="flex gap-3"><span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center shrink-0">3</span><span>Acompanhar próxima revisão do PDM (período sondagem prevista 2027).</span></li>
                </ol>
              </div>

              <button
                onClick={() => exportPropertyPDF(property)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-3 rounded-md flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Download size={15} /> Exportar PDF com Logótipo
              </button>
              <button className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 rounded-md flex items-center justify-center gap-2 transition">
                <FileText size={14} /> Partilhar com cliente
              </button>

              <div className="text-[11px] text-slate-400 leading-relaxed px-1">
                <Info size={11} className="inline mr-1" />
                Análise gerada automaticamente. Não substitui parecer técnico
                de arquiteto, engenheiro ou advogado especializado.
              </div>
            </div>

            <div className="col-span-12 flex justify-between">
              <button
                onClick={() => setPage(1)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
              >
                <ChevronLeft size={14} /> Voltar à Análise PDM
              </button>
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-md shadow-sm"
              >
                Concluir e voltar ao dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// ----------------- ROOT -----------------
export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null);
  const [analysisPage, setAnalysisPage] = useState(1);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPropriedades();
      setProperties(data);
    } catch (e) {
      setError(e?.message ?? "Erro desconhecido");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (page === "dashboard" || page === "sig") loadProperties();
  }, [page]);

  const handleLogin = (email) => {
    setUser(email);
    setPage("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setSelected(null);
    setProperties([]);
    setPage("login");
  };

  const handleNavigate = (target) => {
    if (target === "dashboard" || target === "sig" || target === "upload") {
      setPage(target);
    }
  };

  if (page === "login") return <LoginPage onLogin={handleLogin} />;

  if (page === "dashboard") return (
    <Dashboard
      user={user}
      properties={properties}
      loading={loading}
      error={error}
      onRefresh={loadProperties}
      onNew={() => setPage("upload")}
      onSelect={(p) => { setSelected(p); setAnalysisPage(1); setPage("analysis"); }}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
    />
  );

  if (page === "upload") return (
    <UploadPage
      user={user}
      onCancel={() => setPage("dashboard")}
      onAnalyseDone={(prop) => { setSelected(prop); setAnalysisPage(1); setPage("analysis"); }}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
    />
  );

  if (page === "sig") return (
    <SIGPage
      user={user}
      properties={properties}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
    />
  );

  if (page === "analysis" && selected) return (
    <AnalysisPage
      user={user}
      property={selected}
      page={analysisPage}
      setPage={setAnalysisPage}
      onBack={() => setPage("dashboard")}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
    />
  );

  return null;
}
