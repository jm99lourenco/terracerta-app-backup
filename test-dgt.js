const concelho = "Abrantes";
const query = concelho.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const baseUrl = "https://snit-mais.dgterritorio.gov.pt/portalsnit/Pesquisa.aspx";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testScraper() {
    console.log(`\n[1] A iniciar infiltração para o concelho: ${query}...`);
    try {
        const commonHeaders = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
          'Accept-Language': 'pt-PT,pt;q=0.9',
        };

        console.log(`[2] A extrair cadeados de segurança (GET)...`);
        const getRes = await fetch(baseUrl, { headers: commonHeaders });
        const getHtml = await getRes.text();

        const cookies = getRes.headers.get('set-cookie') || '';
        if(cookies) commonHeaders['Cookie'] = cookies;

        const vsMatch = getHtml.match(/id="__VIEWSTATE"\s+value="([^"]+)"/) || getHtml.match(/name="__VIEWSTATE"\s+value="([^"]+)"/);
        const vsgMatch = getHtml.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/) || getHtml.match(/name="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/);
        const evMatch = getHtml.match(/id="__EVENTVALIDATION"\s+value="([^"]+)"/) || getHtml.match(/name="__EVENTVALIDATION"\s+value="([^"]+)"/);

        if (!vsMatch || !evMatch) {
            console.error("❌ Falha: Tokens ASP.NET não encontrados na página.");
            console.log("Snippet do HTML recebido:", getHtml.substring(0, 500));
            return;
        }
        console.log(`[3] Cadeados extraídos! A preparar o disparo (POST)...`);

        const params = new URLSearchParams();
        params.append('__EVENTTARGET', '');
        params.append('__EVENTARGUMENT', '');
        params.append('__VIEWSTATE', vsMatch[1]);
        params.append('__VIEWSTATEGENERATOR', vsgMatch ? vsgMatch[1] : '9BE4EAF7');
        params.append('__EVENTVALIDATION', evMatch[1]);
        params.append('ctl00$ContentPlaceHolder1$ddlConcelho', query.toUpperCase());
        params.append('ctl00$ContentPlaceHolder1$ddlInstrumento', '0');
        params.append('ctl00$ContentPlaceHolder1$ddlEstado', '0');
        params.append('ctl00$ContentPlaceHolder1$btnPesquisar', 'PESQUISAR');

        console.log(`[4] A disparar pedido (POST) e a aguardar a DGT (sem limite de tempo)...`);
        const startTime = Date.now();

        const postRes = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': baseUrl
          },
          body: params.toString()
        });

        const postHtml = await postRes.text();
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`[5] Resposta da DGT recebida em ${timeTaken} segundos.`);

        const downloadRegex = /DownloadPlanos\.aspx\?idPlan=(\d+)/gi;
        let matches = [...postHtml.matchAll(downloadRegex)];

        if (matches.length > 0) {
            const latestId = matches[matches.length - 1][1];
            const directPdfUrl = `https://snit-mais.dgterritorio.gov.pt/portalsnit/DownloadPlanos.aspx?idPlan=${latestId}`;
            console.log(`\n✅ SUCESSO ABSOLUTO! Link do PDF capturado:`);
            console.log(`➡️  ${directPdfUrl}\n`);
        } else {
            console.log(`\n⚠️ A DGT respondeu, mas a tabela veio VAZIA (sem links). Acesso bloqueado ou estrutura alterada.\n`);
        }

    } catch (error) {
        console.error("\n❌ Erro fatal de rede:", error.message);
    }
}

testScraper();
