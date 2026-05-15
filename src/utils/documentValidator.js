/**
 * Terra-Certa Document Validator (VIT) v1.2
 * Robust regex-based validation with flexible scoring.
 */

export const validateDocumentStructure = (extractedText, type) => {
  if (!extractedText) return false;

  // Log de Diagnóstico para Debug
  console.log(`[VIT Debug] Tipo: ${type} | Início do Texto:`, extractedText.substring(0, 500));

  // Limpeza de Texto: Minúsculas e apenas alfanuméricos
  // Nota: Normalizamos para remover acentos para maior robustez
  const cleanText = extractedText
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const checkTerms = (terms) => {
    let matches = 0;
    terms.forEach(term => {
      // Criamos uma versão "limpa" do termo para comparar com o texto limpo
      const cleanTerm = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanText.includes(cleanTerm)) {
        matches++;
      }
    });
    return matches >= 2; // Threshold: Pelo menos 2 termos encontrados
  };

  if (type === 'caderneta') {
    const cadernetaTerms = [
      "CADERNETA PREDIAL URBANA",
      "IDENTIFICACAO DO PREDIO",
      "LOCALIZACAO DO PREDIO",
      "DESCRICAO DO PREDIO",
      "DADOS DE AVALIACAO"
    ];
    return checkTerms(cadernetaTerms);
  }

  if (type === 'certidao') {
    const certidaoTerms = [
      "CERTIDAO PERMANENTE",
      "REGISTO PREDIAL ONLINE",
      "INFORMACAO PREDIAL SIMPLIFICADA",
      "CODIGO DE ACESSO",
      "AREA TOTAL"
    ];
    return checkTerms(certidaoTerms);
  }

  return true;
};

export const getInvalidDocumentError = () => 
  "Documento Inválido: A estrutura do ficheiro não corresponde ao template oficial. Por favor, carregue o PDF original exportado diretamente do portal oficial.";
