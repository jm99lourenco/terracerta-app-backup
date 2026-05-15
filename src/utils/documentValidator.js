/**
 * Terra-Certa Document Validator (VIT) v1.1
 * Flexible heuristics for official Portuguese property documents.
 */

export const validateDocumentStructure = (text, type) => {
  if (!text) return false;
  const content = text.toUpperCase();
  
  if (type === 'caderneta') {
    // Essencial (obrigatório)
    const hasEssential = content.includes("CADERNETA PREDIAL URBANA");
    if (!hasEssential) return false;

    // Estrutura (pelo menos 3)
    const structureTerms = [
      "IDENTIFICAÇÃO DO PRÉDIO",
      "LOCALIZAÇÃO DO PRÉDIO",
      "DESCRIÇÃO DO PRÉDIO",
      "DADOS DE AVALIAÇÃO",
      "CÓDIGO DE VALIDAÇÃO"
    ];
    
    const matchedTerms = structureTerms.filter(term => content.includes(term));
    return matchedTerms.length >= 3;
  }

  if (type === 'certidao') {
    // Essencial (obrigatório)
    const hasEssential = (content.includes("CERTIDÃO PERMANENTE") || content.includes("INFORMAÇÃO PREDIAL SIMPLIFICADA")) && 
                         content.includes("CÓDIGO DE ACESSO");
    if (!hasEssential) return false;

    // Estrutura (pelo menos 2)
    const structureTerms = [
      "ÁREA TOTAL",
      "FREGUESIA",
      "INFORMAÇÃO EM VIGOR",
      "REGISTO PREDIAL ONLINE"
    ];
    
    const matchedTerms = structureTerms.filter(term => content.includes(term));
    return matchedTerms.length >= 2;
  }

  return true; // Outros tipos mantêm-se como válidos para agora
};

export const getInvalidDocumentError = () => 
  "Documento Inválido: A estrutura do ficheiro não corresponde ao template oficial. Por favor, carregue o PDF original exportado diretamente do portal oficial.";
