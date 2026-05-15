/**
 * Terra-Certa Document Validator (VIT) v1.0
 * Structural integrity checks for official Portuguese AT and SIR documents.
 */

export const validateDocumentStructure = (text, type) => {
  const content = text.toUpperCase();
  
  if (type === 'caderneta') {
    // Check Sequence
    const hasSequence = 
      content.includes("AUTORIDADE TRIBUTÁRIA") && 
      content.includes("IDENTIFICAÇÃO DO PRÉDIO") && 
      content.includes("DESCRIÇÃO DO PRÉDIO") && 
      content.includes("DADOS DE AVALIAÇÃO");
    
    // Check de Dados (Código de Validação: 12 chars alfanuméricos)
    const validationCodeRegex = /[A-Z0-9]{12}/;
    const hasValidationCode = validationCodeRegex.test(content);

    return hasSequence && hasValidationCode;
  }

  if (type === 'certidao') {
    // Check de Origem
    const hasOrigin = content.includes("REGISTO PREDIAL ONLINE") && content.includes("INFORMAÇÃO EM VIGOR");
    
    // Check de Acesso (XXXX-XXXX-XXXX-XXXX-XXXX)
    const accessCodeRegex = /[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/;
    const hasAccessCode = accessCodeRegex.test(content);
    
    // Check de Estrutura (Tabela de Áreas)
    const hasAreaTable = 
      content.includes("ÁREA TOTAL") && 
      content.includes("ÁREA COBERTA") && 
      content.includes("ÁREA DESCOBERTA");

    return hasOrigin && hasAccessCode && hasAreaTable;
  }

  return true; // Default for other types
};

export const getInvalidDocumentError = () => 
  "Documento Inválido: A estrutura do ficheiro não corresponde ao template oficial. Por favor, carregue o PDF original exportado diretamente do portal oficial.";
