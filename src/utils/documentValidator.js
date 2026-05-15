/**
 * Terra-Certa Document Validator (VIT) v5.0
 * Fuzzy Template Recognition based on structural "fingerprints".
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
  // Check de leitura básica
  if (!extractedText || extractedText.length < 100) {
    return {
      isValid: false,
      error: "Erro de Leitura: O ficheiro parece estar vazio ou não contém texto extraível. Certifique-se que é o PDF original."
    };
  }

  const normText = normalize(extractedText);

  // Dicionários de Estrutura
  const dictionaries = {
    caderneta: [
      'CADERNETA', 'PREDIAL', 'URBANA', 'TRIBUTARIA', 'MATRICIAL', 
      'IDENTIFICACAO', 'AVALIACAO', 'TITULARES', 'PAGINA', 'FINANCAS'
    ],
    certidao: [
      'CONSERVATORIA', 'REGISTO', 'PREDIAL', 'CERTIDAO', 'PERMANENTE', 
      'SIMPLIFICADA', 'DESCRICOES', 'AVERBAMENTOS', 'ANOTACOES', 'AREA', 'TOTAL', 'VIGOR'
    ]
  };

  const words = dictionaries[type] || [];
  if (words.length === 0) return { isValid: true };

  let matchCount = 0;
  const missingWords = [];

  words.forEach(word => {
    const normWord = normalize(word);
    if (normText.includes(normWord)) {
      matchCount++;
    } else {
      missingWords.push(word);
    }
  });

  const matchPercentage = (matchCount / words.length) * 100;
  console.log(`[VIT v5.0] Debug Fuzzy (${type}): ${matchCount}/${words.length} (${matchPercentage.toFixed(1)}%)`);

  // Regra de Aceitação: 60%
  if (matchPercentage >= 60) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: "Documento não reconhecido: O formato não corresponde ao template oficial da AT/Conservatória. Verifique se carregou o PDF original."
  };
};

export const getInvalidDocumentError = (customError) => 
  customError || "Documento Inválido: A estrutura do ficheiro não corresponde ao template oficial.";
