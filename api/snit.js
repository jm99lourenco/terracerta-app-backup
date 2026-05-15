export default async function handler(req, res) {
  const { concelho } = req.query;
  if (!concelho) return res.status(400).json({ error: "Município em falta" });

  // Normalização para a pesquisa governamental
  let query = concelho.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
  const searchUrl = `https://snit-mais.dgterritorio.gov.pt/portalsnit/Pesquisa.aspx?Concelho=${encodeURIComponent(query)}`;
  
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'pt-PT,pt;q=0.9',
        'Referer': 'https://snit-mais.dgterritorio.gov.pt/portalsnit/'
      }
    });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("DGT_BLOCKED");

    const html = await response.text();
    
    // REGEX DE EXTRAÇÃO: Procura o link de download do plano
    const downloadRegex = /DownloadPlanos\.aspx\?idPlan=(\d+)/gi;
    let matches = [...html.matchAll(downloadRegex)];

    if (matches.length > 0) {
      // Obtemos o último match (geralmente a versão em vigor mais recente na tabela)
      const latestId = matches[matches.length - 1][1];
      const directPdfUrl = `https://snit-mais.dgterritorio.gov.pt/portalsnit/DownloadPlanos.aspx?idPlan=${latestId}`;
      
      return res.status(200).json({ link: directPdfUrl });
    }

    // Fallback caso não encontre o ID mas o site responda
    return res.status(200).json({ link: searchUrl });

  } catch (error) {
    console.error("Erro no Scraper:", error.message);
    // Fallback de segurança para o utilizador nunca ver erro
    return res.status(200).json({ link: "https://snit-mais.dgterritorio.gov.pt/portalsnit/" });
  }
}
