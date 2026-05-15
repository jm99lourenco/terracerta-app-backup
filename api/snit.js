export default async function handler(req, res) {
  const { concelho } = req.query;

  if (!concelho) {
    return res.status(400).json({ error: "Parâmetro 'concelho' é obrigatório." });
  }

  // A DGT desativou o antigo sistema "snit-mais.dgterritorio.gov.pt" (Erro 404).
  // O novo portal oficial de pesquisa territorial é o SNIT-SGT.
  // O fallback é agora redirecionar o utilizador para a plataforma moderna e funcional.
  const newDgtUrl = "https://snit-mais.dgterritorio.gov.pt/portalsnit/";

  // Retornamos status 200 (Sucesso) para a interface React abrir o novo link,
  // livrando-nos dos bloqueios de CORS e 404s do sistema legado.
  return res.status(200).json({ link: newDgtUrl });
}
