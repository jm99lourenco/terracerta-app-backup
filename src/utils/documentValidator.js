/**
 * Terra-Certa Document Validator (VIT) v4.0
 * Strict Structural Anchors validation.
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
  // Check de leitura básica (Failure Crítica < 300 chars)
  if (!extractedText || extractedText.length < 300) {
    return {
      isValid: false,
      error: "Erro de Leitura de PDF: O sistema não conseguiu extrair texto suficiente deste ficheiro. Certifique-se que não é uma imagem digitalizada (scan) mas sim o PDF original exportado."
    };
  }

  const normText = normalize(extractedText);

  if (type === 'caderneta') {
    const anchors = [
      { id: "identificacaodopredio", label: "Identificação do Prédio" },
      { id: "localizacaodopredio", label: "Localização do Prédio" },
      { id: "descricaodopredio", label: "Descrição do Prédio" },
      { id: "dadosdeavaliacao", label: "Dados de Avaliação" },
      { id: "titulares", label: "Titulares" }
    ];

    for (const anchor of anchors) {
      if (!normText.includes(anchor.id)) {
        return {
          isValid: false,
          error: `O documento não parece ser uma Caderneta Predial oficial (Falta '${anchor.label}').`
        };
      }
    }
  }

  if (type === 'certidao') {
    const anchors = [
      { id: "descricoes", label: "Descrições" },
      { id: "averbamentos", label: "Averbamentos" },
      { id: "anotacoes", label: "Anotações" },
      { id: "areatotal", label: "Área Total" }
    ];

    for (const anchor of anchors) {
      if (!normText.includes(anchor.id)) {
        return {
          isValid: false,
          error: `O documento não parece ser uma Certidão Permanente oficial (Falta '${anchor.label}').`
        };
      }
    }
  }

  return { isValid: true };
};

export const getInvalidDocumentError = (customError) => 
  customError || "Documento Inválido: A estrutura do ficheiro não corresponde ao template oficial.";
