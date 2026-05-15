export default async function handler(req, res) {
  const { concelho } = req.query;

  if (!concelho) {
    return res.status(400).json({ error: "Parâmetro 'concelho' é obrigatório." });
  }

  // Tratamento da nomenclatura
  let searchQuery = concelho;
  if (searchQuery.includes("Calheta (Madeira)")) searchQuery = "Calheta";
  if (searchQuery.includes("Calheta (Açores")) searchQuery = "Calheta";

  const snitUrl = `https://snit-mais.dgterritorio.gov.pt/portalsnit/Pesquisa.aspx?Concelho=${encodeURIComponent(searchQuery)}`;
  
  // Ignorar problemas comuns de certificados SSL nos sites do Estado PT
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    const controller = new AbortController();
    // Reduzido para 4 segundos. Se a DGT for lenta, não fazemos o utilizador esperar e saltamos para o fallback.
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(snitUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Connection': 'keep-alive'
      }
    });

    clearTimeout(timeoutId);

    // SE A DGT BLOQUEAR A VERCEL (403, 500, etc), DEVOLVE O LINK BASE EM VEZ DE ERRO
    if (!response.ok) {
      return res.status(200).json({ link: snitUrl });
    }

    const html = await response.text();
    const regex = /href="(DownloadPlanos[^"]+idPlan=\d+)"/gi;
    let match;
    let lastMatch = null;
    
    while ((match = regex.exec(html)) !== null) {
      lastMatch = match[1];
    }

    if (lastMatch) {
      return res.status(200).json({ link: `https://snit-mais.dgterritorio.gov.pt/portalsnit/${lastMatch}` });
    } else {
      return res.status(200).json({ link: snitUrl });
    }

  } catch (error) {
    // O EXTERMÍNIO FINAL: Se der timeout ou a rede falhar, DEVOLVEMOS O LINK BASE.
    // O botão vai simplesmente abrir o site da DGT e a plataforma TerraCerta nunca mostrará erro.
    console.warn("SNIT Fetch Error/Blocked:", error.message);
    return res.status(200).json({ link: snitUrl });
  }
}
