export default async function handler(req, res) {
  // Extrai o tipo de camada e os restantes parâmetros WMS normais do Leaflet
  const { layerTarget, ...wmsParams } = req.query;
  
  // Define o URL base oficial do Estado consoante a camada pedida
  const baseUrl = layerTarget === 'RAN' 
    ? 'https://servicos.dgterritorio.pt/SDISNITWMSSRUP_RAN_PT1/WMService.aspx'
    : 'https://servicos.dgterritorio.pt/SDISNITWMSSRUP_REN_PT1/WMService.aspx';

  const url = new URL(baseUrl);
  
  // Injeta todos os parâmetros do Leaflet (bbox, width, height, etc.) no pedido para o Governo
  Object.keys(wmsParams).forEach(key => {
    url.searchParams.append(key, wmsParams[key]);
  });

  try {
    const fetchRes = await fetch(url.toString());
    if (!fetchRes.ok) throw new Error('Falha de resposta da DGT');
    
    // Transforma a imagem em Buffer para enviar de volta ao Frontend
    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Define os cabeçalhos de sucesso e permissão total (CORS Bypass)
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache de 24h para poupar pedidos
    
    res.status(200).send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Proxy Error', details: error.message });
  }
}
