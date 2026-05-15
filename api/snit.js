export default async function handler(req, res) {
  // A DGT desativou a pesquisa direta, mas a raiz do portal continua viva.
  // Retornamos status 200 instantâneo para não bloquear a Vercel 
  // e garantimos que o React abre o portal oficial no separador.
  const safeUrl = "https://snit-mais.dgterritorio.gov.pt/portalsnit/";
  
  return res.status(200).json({ link: safeUrl });
}
