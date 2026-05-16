/**
 * Terra-Certa Document Validator (VIT) v5.1
 * Specialized support for "Informação Predial Simplificada".
 */

export const validateDocumentStructure = (extractedText, type, fileName = "") => {
  const normText = (extractedText || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // Limpeza extrema: apenas alfanuméricos

  console.log(`[VIT v5.1] Debug Normalizado (${type}):`, normText.substring(0, 100));

  // Bypass de Emergência: Nome do ficheiro
  if (normText.length < 50) {
    const fn = fileName.toLowerCase();
    if ((type === 'caderneta' && (fn.includes("caderneta") || fn.includes("at"))) || 
        (type === 'certidao' && (fn.includes("certidao") || fn.includes("sir") || fn.includes("registo") || fn.includes("informacao")))) {
      return { isValid: true, isFallback: true };
    }
  }

  const results = {
    caderneta: {
      matricial: /artigo[0-9]+/i.test(normText),
      geografico: /(distrito|concelho|freguesia)[a-z]+/i.test(normText),
      area: /area[a-z]*[0-9]+(m2|m)/i.test(normText)
    },
    certidao: {
      // Suporte para IP-XXXX...
      access: /(codigoacesso|acesso|ip)[a-z0-9]+/i.test(normText),
      // Suporte para Informação Predial Simplificada
      identificacao: /(descricaogenerica|informacaopredialsimplificada|certidaopermanente|matriz)[a-z0-9]*/i.test(normText),
      // Suporte para M2, m2, m2
      metrics: /area(total|coberta|descoberta)[a-z0-9]*[0-9]+(m2|m)/i.test(normText)
    }
  };

  if (type === 'caderneta') {
    const { matricial, geografico, area } = results.caderneta;
    if ((matricial && geografico) || area) return { isValid: true };
  }

  if (type === 'certidao') {
    const { access, identificacao, metrics } = results.certidao;
    // Para Informação Predial Simplificada, se tiver o título ou o código e as métricas, é válido
    if ((identificacao || access) && metrics) return { isValid: true };
  }

  // Fallback final pelo nome
  const fn = fileName.toLowerCase();
  if (fn.includes(type) || (type === 'certidao' && (fn.includes('registo') || fn.includes('informacao')))) return { isValid: true };

  return {
    isValid: false,
    error: "Erro de Estrutura: O documento não apresenta os padrões de dados obrigatórios. Certifique-se que carregou o PDF original (Caderneta ou Certidão/Informação Simplificada)."
  };
};

export const getInvalidDocumentError = (customError) => 
  customError || "Documento Inválido: A estrutura do ficheiro não corresponde ao template oficial.";
