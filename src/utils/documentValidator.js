/**
 * Terra-Certa Document Validator (VIT) v4.1
 * Refined Structural Anchors based on Real Document Templates.
 */

const normalize = (text) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // Remove tudo o que não é alfanumérico
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
      { id: "cadernetapredialurbana", label: "Caderneta Predial Urbana" },
      { id: "identificacaodopredio", label: "Identificação do Prédio" },
      { id: "descricaodopredio", label: "Descrição do Prédio" },
      { id: "dadosdeavaliacao", label: "Dados de Avaliação" },
      { id: "titulares", label: "Titulares" },
      { id: "codigodevalidacao", label: "Código de Validação" }
    ];

    for (const anchor of anchors) {
      if (!normText.includes(anchor.id)) {
        console.warn(`[VIT v4.1] Âncora em falta (Caderneta): ${anchor.id}`);
        return {
          isValid: false,
          error: `O documento não parece ser uma Caderneta Predial oficial (Falta '${anchor.label}').`
        };
      }
    }
  }

  if (type === 'certidao') {
    // Check Origem (Pelo menos uma)
    const hasOrigin = normText.includes("informacaopredialsimplificada") || normText.includes("certidaopermanente");
    if (!hasOrigin) {
      console.warn(`[VIT v4.1] Âncora em falta (Certidão): Origem não identificada`);
      return {
        isValid: false,
        error: "O documento não parece ser uma Certidão Permanente ou Informação Predial Simplificada oficial."
      };
    }

    // Check Bases (Obrigatórias)
    const anchors = [
      { id: "codigodeacesso", label: "Código de Acesso" },
      { id: "descricoes", label: "Descrições" },
      { id: "averbamentos", label: "Averbamentos" },
      { id: "anotacoes", label: "Anotações" },
      { id: "areatotal", label: "Área Total" }
    ];

    for (const anchor of anchors) {
      if (!normText.includes(anchor.id)) {
        console.warn(`[VIT v4.1] Âncora em falta (Certidão): ${anchor.id}`);
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
