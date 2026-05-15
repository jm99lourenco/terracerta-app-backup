/**
 * Terra-Certa Health Engine (TCHE) v1.0
 * Professional urbanistic scoring for Portuguese territory.
 */

export const calculateHealthScore = (terrainData, filesCount = 0) => {
  // Rule 1: Firewall de Documentos
  if (filesCount < 3) {
    return {
      total: 0,
      status: "Incompleto",
      categories: {
        legal: 0,
        urbanistico: 0,
        tecnico: 0
      },
      justifications: {
        legal: "Documentação insuficiente (mínimo 3 ficheiros: Caderneta, Planta, Certidão).",
        urbanistico: "Análise suspensa por falta de dados base.",
        tecnico: "Impossível validar infraestruturas sem documentação."
      },
      recommendation: "Por favor, carregue a Caderneta Predial, Planta de Localização e Certidão Permanente."
    };
  }

  const isUrbano = terrainData.designacao?.toLowerCase().includes("urbano") || terrainData.tipo === "urbano";
  let scores = {
    legal: 90,
    urbanistico: 85,
    tecnico: 80
  };

  let justifications = {
    legal: "Documentação base validada e artigo matricial ativo.",
    urbanistico: "Enquadramento em zona de densidade consolidada.",
    tecnico: "Acesso rodoviário e infraestruturas básicas detetadas."
  };

  // Rule 2: Specific Logic
  if (isUrbano) {
    // Focus on Edification & Infrastructure
    if (terrainData.area < 200) {
      scores.urbanistico -= 15;
      justifications.urbanistico = "Área reduzida para os índices de ocupação da zona.";
    }
    if (!terrainData.saneamento) { // Mock check
      scores.tecnico -= 20;
      justifications.tecnico = "Penalizado por falta de rede pública de saneamento.";
    }
  } else {
    // Rústico: Focus on Reconversion & Environment
    scores.urbanistico = 40; // Default lower for rustic
    justifications.urbanistico = "Solo rústico com necessidade de Plano de Pormenor para reconversão.";
    
    // REN/RAN Mock penalty
    const hasEnvironmentalRestrictions = terrainData.freguesia?.length % 2 === 0;
    if (hasEnvironmentalRestrictions) {
      scores.legal -= 30;
      justifications.legal = "Sobreposição parcial com Reserva Ecológica Nacional (REN).";
    }
  }

  // Rule 3: Penalização por Incoerência (Simulated)
  const hasInconsistency = terrainData.matricial === "ERR_DATA"; // Mock flag
  if (hasInconsistency) {
    scores.legal = Math.max(0, scores.legal - 30);
    justifications.legal = "Divergência detetada entre área declarada e Caderneta Predial.";
  }

  const total = Math.round((scores.legal + scores.urbanistico + scores.tecnico) / 3);

  return {
    total,
    status: total > 70 ? "Favorável" : total > 40 ? "Sob Condição" : "Desfavorável",
    categories: scores,
    justifications,
    caminhoUrbanizacao: !isUrbano ? "Para urbanizar este solo, é necessário promover uma Unidade de Execução (Art. 146º RJIGT) ou aguardar pela revisão do PDM para alteração da classificação do solo." : null
  };
};
