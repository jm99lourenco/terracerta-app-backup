import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  pt: {
    translation: {
      "nav": {
        "dashboard": "Dashboard",
        "explore": "Explorador SIG",
        "pdm": "Regulamentos"
      },
      "login": {
        "title": "Iniciar sessão",
        "email": "Email profissional",
        "password": "Palavra-passe",
        "forgot": "Esqueci-me da Password",
        "btn": "Entrar na plataforma",
        "tagline": "Análise de Viabilidade Territorial",
        "error": "Credenciais inválidas.",
        "loggingIn": "A entrar..."
      },
      "dashboard": {
        "title": "Dashboard",
        "refresh": "Atualizar",
        "new": "Novo Terreno",
        "search": "Pesquisar por designação, concelho, ID...",
        "filters": "Filtros",
        "id": "ID",
        "desig": "Designação",
        "conc": "Concelho / Freguesia",
        "area": "Área",
        "score": "Score",
        "status": "Estado",
        "date": "Data",
        "status_analyzed": "Analisado"
      },
      "upload": {
        "back": "Voltar ao dashboard",
        "title": "Novo Terreno",
        "doc_title": "1. Documentação Base",
        "doc_caderneta": "Caderneta Predial",
        "doc_planta": "Planta de Localização (Opcional)",
        "doc_certidao": "Certidão Permanente",
        "doc_selected": "Selecionado:",
        "doc_pdf": "Ficheiro PDF",
        "btn_remove": "Remover",
        "btn_upload": "Carregar",
        "data_title": "2. Dados do Terreno",
        "data_desig": "Designação",
        "data_dist": "Distrito",
        "data_conc": "Concelho",
        "data_freg": "Freguesia",
        "data_artigo": "Artigo Matricial",
        "data_area": "Área (m²)",
        "btn_analyse": "Iniciar Análise de Viabilidade",
        "extracting": "A extrair dados via OCR..."
      },
      "analysis": {
        "title": "Análise de Viabilidade",
        "score_label": "Health Score",
        "tab_1": "1 · Análise PDM",
        "tab_2": "2 · Conversão Urbano",
        "btn_map": "Abrir no mapa",
        "btn_export": "Exportar PDF",
        "ocr_badge": "OCR ✓",
        "extracted_title": "Dados Extraídos",
        "conc": "Concelho",
        "freg": "Freguesia",
        "artigo": "Artigo matricial",
        "area": "Área total",
        "conf": "Confrontações",
        "insc": "Inscrição",
        "pdm_app": "PDM aplicável",
        "pdm_title": "Análise PDM",
        "pdm_sub": "Interpretação automática do regulamento e cruzamento com 9 camadas oficiais.",
        "pdm_source": "Fonte oficial DGT",
        "realtime": "Tempo Real",
        "conf_count": "conformes",
        "cond_count": "condicionantes",
        "inv_count": "inviáveis",
        "full_reg": "Ver regulamento integral",
        "rec_title": "Recomendações do TerraCerta",
        "cert": "Certificado de Viabilidade"
      },
      "reg": {
        "title": "Regulamentos PDM",
        "sub": "Acesso direto aos PDFs dos Planos Diretores Municipais oficiais (SNIT).",
        "search": "Pesquisar concelho...",
        "col_id": "ID",
        "col_mun": "Município",
        "col_inst": "Inst...",
        "col_desig": "Designação",
        "col_sit": "Situação",
        "col_diploma": "Diploma...",
        "col_data": "Data",
        "col_link": "Link",
        "btn_pdf": "Consultar PDF"
      },
      "explore": {
        "title": "Centro de Comando",
        "sub": "Visão macro de todos os ativos imobiliários na plataforma.",
        "assets": "Ativos",
        "viable": "Viáveis"
      }
    }
  },
  en: {
    translation: {
      "nav": { "dashboard": "Dashboard", "explore": "GIS Explorer", "pdm": "Regulations" },
      "login": { "title": "Sign In", "email": "Professional Email", "password": "Password", "forgot": "Forgot Password?", "btn": "Enter Platform", "tagline": "Territorial Viability Analysis", "error": "Invalid credentials.", "loggingIn": "Signing in..." },
      "dashboard": { "title": "Dashboard", "refresh": "Refresh", "new": "New Property", "search": "Search name, municipality, ID...", "filters": "Filters", "id": "ID", "desig": "Name", "conc": "Municipality / Parish", "area": "Area", "score": "Score", "status": "Status", "date": "Date", "status_analyzed": "Analyzed" },
      "upload": { "back": "Back to dashboard", "title": "New Property", "doc_title": "1. Core Documentation", "doc_caderneta": "Property Tax Document", "doc_planta": "Location Plan (Optional)", "doc_certidao": "Permanent Certificate", "doc_selected": "Selected:", "doc_pdf": "PDF File", "btn_remove": "Remove", "btn_upload": "Upload", "data_title": "2. Property Data", "data_desig": "Name", "data_dist": "District", "data_conc": "Municipality", "data_freg": "Parish", "data_artigo": "Tax ID", "data_area": "Area (m²)", "btn_analyse": "Start Viability Analysis", "extracting": "Extracting via OCR..." },
      "analysis": { "title": "Viability Analysis", "score_label": "Health Score", "tab_1": "1 · PDM Analysis", "tab_2": "2 · Urban Conversion", "btn_map": "Open in map", "btn_export": "Export PDF", "ocr_badge": "OCR ✓", "extracted_title": "Extracted Data", "conc": "Municipality", "freg": "Parish", "artigo": "Tax ID", "area": "Total Area", "conf": "Borders", "insc": "Registration", "pdm_app": "Applicable PDM", "pdm_title": "PDM Analysis", "pdm_sub": "Automatic regulation parsing with 9 official GIS layers.", "pdm_source": "Official DGT Source", "realtime": "Real-Time", "conf_count": "compliant", "cond_count": "conditional", "inv_count": "infeasible", "full_reg": "View full regulation", "rec_title": "TerraCerta Recommendations", "cert": "Viability Certificate" },
      "reg": { "title": "PDM Regulations", "sub": "Direct access to official Municipal Master Plans (SNIT).", "search": "Search municipality...", "col_id": "ID", "col_mun": "Municipality", "col_inst": "Inst...", "col_desig": "Name", "col_sit": "Status", "col_diploma": "Diploma...", "col_data": "Date", "col_link": "Link", "btn_pdf": "View PDF" },
      "explore": { "title": "Command Center", "sub": "Macro view of all real estate assets.", "assets": "Assets", "viable": "Viable" }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "pt", 
    fallbackLng: "pt",
    interpolation: { escapeValue: false }
  });

export default i18n;
