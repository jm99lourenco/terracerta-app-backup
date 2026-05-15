/**
 * Terra-Certa Document Validator (VIT) v3.0
 * Total Normalization logic for extreme robustness.
 */

const normalize = (text) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/[\s\n\r]/g, "") // Remove espaços e quebras de linha
    .replace(/[^a-z0-9]/g, ""); // Remove caracteres especiais
};

export const validateDocumentStructure = (extractedText, type) => {
  // Segurança: Se o texto for muito curto, provavelmente a extração falhou
  if (!extractedText || extractedText.length < 100) {
    console.warn(`[VIT v3.0] Rejeitado: Texto demasiado curto (${extractedText?.length || 0} chars)`);
    return false;
  }

  const normText = normalize(extractedText);
  console.log(`[VIT v3.0] Debug Normalizado (${type}):`, normText.substring(0, 100));

  if (type === 'caderneta') {
    return normText.includes("cadernetapredialurbana") || normText.includes("servicodefinancas");
  }

  if (type === 'certidao') {
    return (
      normText.includes("certidaopermanente") || 
      normText.includes("informacaopredialsimplificada") || 
      normText.includes("codigodeacesso")
    );
  }

  return true;
};

export const getInvalidDocumentError = (textLength = 0) => 
  `Documento Inválido: A estrutura do ficheiro não corresponde ao template oficial. (Texto detetado: ${textLength} chars)`;
