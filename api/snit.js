export default async function handler(req, res) {
  const { concelho } = req.query;
  if (!concelho) return res.status(400).json({ error: "Município em falta" });

  // Formatação de string à prova de bala
  let query = concelho.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
  const safeUrl = `https://snit-mais.dgterritorio.gov.pt/portalsnit/Pesquisa.aspx?Concelho=${encodeURIComponent(query)}`;
  
  // Resposta instantânea (0 milissegundos de espera pelo Estado).
  // O Vercel nunca vai dar Timeout, e o React abre a página oficial perfeitamente.
  return res.status(200).json({ link: safeUrl });
}
