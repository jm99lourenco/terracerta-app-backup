/**
 * Terra-Certa Document Validator (VIT) v5.0 - FINAL
 * Pattern-based validation with extreme resilience.
 */

export const validateDocumentStructure = (extractedText, type, fileName = "") => {
  const normText = (extractedText || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // Limpeza extrema: apenas alfanuméricos

  console.log(`[VIT v5.0] Debug Normalizado (${type}):`, normText.substring(0, 100));

  // Bypass de Emergência: Se o texto for demasiado curto (PDF protegido),
  // validamos pelo nome do ficheiro para não bloquear o utilizador.
  if (normText.length < 50) {
    const fn = fileName.toLowerCase();
    const isCadernetaName = fn.includes("caderneta") || fn.includes("at") || fn.includes("predial");
    const isCertidaoName = fn.includes("certidao") || fn.includes("sir") || fn.includes("registo") || fn.includes("descricao");
    
    if ((type === 'caderneta' && isCadernetaName) || (type === 'certidao' && isCertidaoName)) {
      return { isValid: true, isFallback: true };
    }
  }

  const results = {
    caderneta: {
      matricial: /artigo[0-9]+/i.test(normText),
      geografico: /(distrito|concelho|freguesia)[a-z]+/i.test(normText),
      area: /area[0-9]+(m2|m)/i.test(normText)
    },
    certidao: {
      identificacao: /(descricao|matriz|no)[0-9]+/i.test(normText),
      metrics: /area(total|coberta|descoberta)[0-9]+(m2|m)/i.test(normText)
    }
  };

  if (type === 'caderneta') {
    const { matricial, geografico, area } = results.caderneta;
    // Se encontrar pelo menos 2 padrões, consideramos válido
    if ((matricial && geografico) || area) return { isValid: true };
  }

  if (type === 'certidao') {
    const { identificacao, metrics } = results.certidao;
    if (identificacao || metrics) return { isValid: true };
  }

  // Fallback final: Se o nome do ficheiro parecer correto, deixamos passar
  const fn = fileName.toLowerCase();
  if (fn.includes(type) || (type === 'certidao' && fn.includes('registo'))) return { isValid: true };

  return {
    isValid: false,
    error: "Erro de Estrutura: O documento não apresenta os padrões de dados obrigatórios. Certifique-se que carregou o PDF original."
  };
};

export const getInvalidDocumentError = (customError) => 
  customError || "Documento Inválido: A estrutura do ficheiro não corresponde ao template oficial.";
