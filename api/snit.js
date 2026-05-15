export default async function handler(req, res) {
  const { concelho } = req.query;
  if (!concelho) return res.status(400).json({ error: "Município em falta" });

  let query = concelho.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
  const baseUrl = "https://snit-mais.dgterritorio.gov.pt/portalsnit/Pesquisa.aspx";
  const fallbackUrl = `${baseUrl}?Concelho=${encodeURIComponent(query)}`;
  
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000); // 9 segundos max

    const commonHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
      'Accept-Language': 'pt-PT,pt;q=0.9',
    };

    // PASSO 1: INFILTRAÇÃO (Obter Tokens ASP.NET)
    const getRes = await fetch(baseUrl, { signal: controller.signal, headers: commonHeaders });
    if (!getRes.ok) throw new Error("Falha no GET inicial");
    
    const getHtml = await getRes.text();
    
    // Extrair os Cadeados de Segurança
    const vsMatch = getHtml.match(/id="__VIEWSTATE"\s+value="([^"]+)"/);
    const vsgMatch = getHtml.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/);
    const evMatch = getHtml.match(/id="__EVENTVALIDATION"\s+value="([^"]+)"/);
    
    if (!vsMatch || !evMatch) throw new Error("Tokens ASP.NET não encontrados");

    // PASSO 2: O DISPARO (Simular o POST com form-urlencoded)
    const params = new URLSearchParams();
    params.append('__EVENTTARGET', '');
    params.append('__EVENTARGUMENT', '');
    params.append('__VIEWSTATE', vsMatch[1]);
    params.append('__VIEWSTATEGENERATOR', vsgMatch ? vsgMatch[1] : '9BE4EAF7');
    params.append('__EVENTVALIDATION', evMatch[1]);
    params.append('ctl00$ContentPlaceHolder1$ddlConcelho', query.toUpperCase()); // DGT usa Maiúsculas no dropdown
    params.append('ctl00$ContentPlaceHolder1$ddlInstrumento', '0');
    params.append('ctl00$ContentPlaceHolder1$ddlEstado', '0');
    params.append('ctl00$ContentPlaceHolder1$btnPesquisar', 'PESQUISAR');

    const postRes = await fetch(baseUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': baseUrl
      },
      body: params.toString()
    });

    clearTimeout(timeoutId);
    if (!postRes.ok) throw new Error("Falha no POST de Pesquisa");

    const postHtml = await postRes.text();
    
    // PASSO 3: EXTRAÇÃO DO PDF
    const downloadRegex = /DownloadPlanos\.aspx\?idPlan=(\d+)/gi;
    let matches = [...postHtml.matchAll(downloadRegex)];

    if (matches.length > 0) {
      // Obtemos o último ID da tabela gerada
      const latestId = matches[matches.length - 1][1];
      const directPdfUrl = `https://snit-mais.dgterritorio.gov.pt/portalsnit/DownloadPlanos.aspx?idPlan=${latestId}`;
      return res.status(200).json({ link: directPdfUrl });
    }

    // Se por algum motivo o Concelho não tiver PDFs na tabela
    return res.status(200).json({ link: fallbackUrl });

  } catch (error) {
    console.warn("Scraping Elite Falhou. A ativar Fallback Seguro:", error.message);
    // O utilizador NUNCA vê erros. Redirecionamos para o portal.
    return res.status(200).json({ link: fallbackUrl });
  }
}
