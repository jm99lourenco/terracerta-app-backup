import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  Search, 
  FileSearch, 
  Database, 
  Zap, 
  ShieldCheck,
  Activity
} from 'lucide-react';

const STEPS = [
  { id: 'snit', label: 'Consulta SNIT (Sist. Nac. Inf. Territorial)', icon: Database },
  { id: 'pdm', label: 'Cruzamento com Matrizes de PDM', icon: FileSearch },
  { id: 'ocr', label: 'Processamento OCR de Caderneta Predial', icon: Zap },
  { id: 'ren', label: 'Avaliação de Condicionantes REN/RAN', icon: ShieldCheck },
  { id: 'build', label: 'Cálculo de Coeficientes de Edificabilidade', icon: Search },
  { id: 'health', label: 'Geração de Health Score e Relatório Técnico', icon: Activity },
];

export default function AnalysisOverlay({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = 55000; // 55 segundos
    const stepDuration = totalDuration / STEPS.length;

    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 100));
    }, totalDuration / 100);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= STEPS.length - 1) {
          clearInterval(stepInterval);
          clearInterval(interval);
          setTimeout(onComplete, 1500);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-brand-green-deep/95 backdrop-blur-sm flex items-center justify-center p-6 text-white">
      <div className="max-w-2xl w-full space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Análise de Viabilidade em Curso</h2>
          <p className="text-white/60">A processar dados geospaciais e regulamentares...</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Progresso Global</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-green-accent transition-all duration-300 ease-linear shadow-[0_0_15px_rgba(5,150,105,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;

            return (
              <div 
                key={step.id}
                className={`p-4 rounded-xl border transition-all duration-500 ${
                  isCompleted ? 'bg-white/5 border-emerald-500/50' : 
                  isActive ? 'bg-white/10 border-white/20 scale-[1.02] shadow-xl' : 
                  'opacity-30 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10'}`}>
                    {isCompleted ? <CheckCircle2 size={18} /> : 
                     isActive ? <Loader2 size={18} className="animate-spin" /> : 
                     <step.icon size={18} />}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/80'}`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 animate-pulse">
            Segurança de Dados · Certificação DGT
          </div>
        </div>
      </div>
    </div>
  );
}
