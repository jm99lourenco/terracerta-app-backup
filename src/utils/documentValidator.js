/**
 * Terra-Certa Document Validator (VIT) v6.0
 * Data Schema Validator - Structural Key-Value analysis.
 */

export const validateDocumentStructure = (extractedText, type) => {
  if (!extractedText || extractedText.length < 100) {
    return {
      isValid: false,
      error: "Erro de Estrutura: O documento não apresenta os campos de dados obrigatórios para análise. Certifique-se que o ficheiro contém texto extraível."
    };
  }

  // Normalização leve para busca (mantendo espaços para regex estrutural)
  const text = extractedText
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase();

  const results = {
    caderneta: {
      admin: /(distrito|concelho|freguesia)\s*:?\s*[a-z0-9]+/i.test(text),
      matricial: /(artigo|matriz)\s*(matricial)?\s*:?\s*[0-9]+/i.test(text),
      metrics: /area\s*(total|implantacao|coberta|descoberta)?\s*:?\s*[0-9]+([.,][0-9]+)?\s*(m2|m2|m2)/i.test(text)
    },
    certidao: {
      access: /(codigo|acesso)\s*(de\s*acesso)?\s*:?\s*[a-z0-9]{4}-/i.test(text),
      metrics: /area\s*(total|coberta|descoberta|implantacao)?\s*:?\s*[0-9]+([.,][0-9]+)?\s*(m2|m2|m2)/i.test(text)
    }
  };

  if (type === 'caderneta') {
    const { admin, matricial, metrics } = results.caderneta;
    if (admin && matricial && metrics) {
      return { isValid: true };
    }
  }

  if (type === 'certidao') {
    const { access, metrics } = results.certidao;
    if (access && metrics) {
      return { isValid: true };
    }
  }

  return {
    isValid: false,
    error: "Erro de Estrutura: O documento não apresenta os campos de dados obrigatórios para análise (Identificação, Artigo ou Áreas). Por favor, carregue o documento oficial emitido pelas entidades competentes."
  };
};

export const getInvalidDocumentError = (customError) => 
  customError || "Documento Inválido: A estrutura do ficheiro não corresponde ao template oficial.";
