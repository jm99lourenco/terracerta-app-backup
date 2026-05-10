import React, { useState } from 'react';
import { Layers, Map as MapIcon, Shield, Eye, EyeOff } from 'lucide-react';

export default function SIGMap() {
  const [layers, setLayers] = useState({
    pdm: true,
    ren: false,
    ran: false,
    patrimonio: false
  });

  const toggleLayer = (id) => {
    setLayers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-[calc(100vh-80px)] gap-6 animate-in fade-in zoom-in duration-500">
      {/* Map Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative">
        <iframe 
          title="SIG TerraCerta"
          className="w-full h-full grayscale-[0.2] contrast-[1.1]"
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d12453.649520448135!2d-9.1393366!3d38.7222524!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1spt!2spt!4v1700000000000!5m2!1spt!2spt"
          allowFullScreen=""
          loading="lazy"
        />
        
        {/* Map Overlays (Mock) */}
        {layers.ren && (
          <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none mix-blend-multiply border-[20px] border-emerald-500/20" />
        )}
        {layers.pdm && (
          <div className="absolute inset-0 bg-amber-500/5 pointer-events-none mix-blend-overlay" />
        )}
      </div>

      {/* Layers Panel */}
      <aside className="w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Layers className="text-brand-green-accent" size={20} />
          <h2 className="font-bold text-brand-green-deep">Gestão de Camadas</h2>
        </div>

        <div className="space-y-4 flex-1">
          <LayerToggle 
            id="pdm" 
            label="PDM (Ordenamento)" 
            active={layers.pdm} 
            onToggle={toggleLayer} 
            color="bg-amber-400"
          />
          <LayerToggle 
            id="ren" 
            label="REN (Reserva Ecológica)" 
            active={layers.ren} 
            onToggle={toggleLayer} 
            color="bg-emerald-500"
          />
          <LayerToggle 
            id="ran" 
            label="RAN (Reserva Agrícola)" 
            active={layers.ran} 
            onToggle={toggleLayer} 
            color="bg-lime-500"
          />
          <LayerToggle 
            id="patrimonio" 
            label="Património Classificado" 
            active={layers.patrimonio} 
            onToggle={toggleLayer} 
            color="bg-brand-green-deep"
          />
        </div>

        <div className="p-4 bg-slate-50 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Shield size={14} /> Fonte de Dados
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Dados sincronizados com o GeoPortal da DGT e Câmaras Municipais. Última atualização: Hoje, 08:32.
          </p>
        </div>
      </aside>
    </div>
  );
}

function LayerToggle({ id, label, active, onToggle, color }) {
  return (
    <button 
      onClick={() => onToggle(id)}
      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
        active ? 'border-brand-green-accent bg-brand-green-accent/5' : 'border-slate-100 hover:border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color} ${active ? 'ring-4 ring-brand-green-accent/20' : ''}`} />
        <span className={`text-sm font-semibold ${active ? 'text-brand-green-deep' : 'text-slate-500'}`}>{label}</span>
      </div>
      {active ? <Eye size={18} className="text-brand-green-accent" /> : <EyeOff size={18} className="text-slate-300" />}
    </button>
  );
}
