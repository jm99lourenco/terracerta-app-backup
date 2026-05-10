import React, { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { formatArea } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock
} from 'lucide-react';

export default function Dashboard({ onNewAnalysis }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      const { data, error } = await supabase
        .from('propriedades')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error("Erro ao carregar propriedades:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-green-deep tracking-tight">Portefólio Territorial</h1>
          <p className="text-tech-gray/60 mt-1">Gestão centralizada de ativos e viabilidades</p>
        </div>
        <button 
          onClick={onNewAnalysis}
          className="bg-brand-green-deep hover:bg-brand-green-accent text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-brand-green-deep/10 transition-all active:scale-95"
        >
          <Plus size={20} /> Nova Análise
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<TrendingUp className="text-brand-green-accent" />} 
          label="Score Médio" 
          value="78.4" 
          sub="+2.1 vs mês ant." 
        />
        <StatCard 
          icon={<MapPin className="text-brand-green-accent" />} 
          label="Total de Área" 
          value={formatArea(properties.reduce((acc, curr) => acc + (curr.area || 0), 0))} 
          sub={`${properties.length} Ativos`} 
        />
        <StatCard 
          icon={<Clock className="text-brand-green-accent" />} 
          label="Análises Pendentes" 
          value="0" 
          sub="Tudo em dia" 
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar terrenos..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green-accent outline-none text-sm transition"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"><Filter size={20} /></button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"><Download size={20} /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-400 bg-slate-50/30">
                <th className="px-6 py-4 font-semibold">Identificação</th>
                <th className="px-6 py-4 font-semibold">Localização</th>
                <th className="px-6 py-4 font-semibold">Área</th>
                <th className="px-6 py-4 font-semibold text-center">Health Score</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">A carregar dados...</td></tr>
              ) : properties.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">Nenhum terreno encontrado.</td></tr>
              ) : properties.map((prop) => (
                <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-brand-green-deep">{prop.designacao}</div>
                    <div className="text-xs text-slate-400">{prop.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {prop.freguesia}, {prop.concelho}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {formatArea(prop.area)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                        prop.score >= 80 ? 'border-emerald-500 text-emerald-600 bg-emerald-50' :
                        prop.score >= 60 ? 'border-lime-500 text-lime-600 bg-lime-50' :
                        'border-amber-500 text-amber-600 bg-amber-50'
                      }`}>
                        {prop.score}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      prop.status === 'Analisado' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {prop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-300 hover:text-brand-green-deep transition transform group-hover:translate-x-1">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-brand-green-deep">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </div>
  );
}
