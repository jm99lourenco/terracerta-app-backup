export default async function handler(req, res) {
  const { concelho } = req.query;

  if (!concelho) {
    return res.status(400).json({ error: "Parâmetro 'concelho' é obrigatório." });
  }

  // Tratamento da nomenclatura do concelho (ex: retirar sufixos para a query)
  let searchQuery = concelho;
  if (searchQuery.includes("Calheta (Madeira)")) searchQuery = "Calheta";
  if (searchQuery.includes("Calheta (Açores")) searchQuery = "Calheta";

  const snitUrl = `https://snit-mais.dgterritorio.gov.pt/portalsnit/Pesquisa.aspx?Concelho=${encodeURIComponent(searchQuery)}`;

  try {
    const response = await fetch(snitUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    });

    if (!response.ok) {
      return res.status(503).json({ error: "Servidor da DGT temporariamente indisponível. Tente novamente." });
    }

    const html = await response.text();

    // Procurar por links de download de planos PDM na tabela do SNIT.
    // Exemplo de link SNIT: href="DownloadPlanos.aspx?idPlan=1234"
    const regex = /href="(DownloadPlanos[^"]+idPlan=\d+)"/gi;
    let match;
    let lastMatch = null;
    
    // Iteramos até ao fim para agarrar o último registo da tabela (última versão)
    while ((match = regex.exec(html)) !== null) {
      lastMatch = match[1];
    }

    if (lastMatch) {
      // Retorna o link absoluto para a última versão encontrada
      return res.status(200).json({ link: `https://snit-mais.dgterritorio.gov.pt/portalsnit/${lastMatch}` });
    } else {
      // Se a página carregar mas não existirem links de download direto, faz fallback para a pesquisa
      return res.status(200).json({ 
        link: snitUrl,
        warning: "Nenhum PDF direto encontrado para este concelho." 
      });
    }

  } catch (error) {
    console.error("SNIT Fetch Error:", error);
    return res.status(503).json({ error: "Servidor da DGT temporariamente indisponível. Tente novamente." });
  }
}
