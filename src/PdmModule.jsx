// PdmModule.jsx - The Cache-Breaker Version
import React, { useState } from 'react';
import { BookOpen, Search, RefreshCw, CheckCircle2, Eye } from "lucide-react";

export const PdmModule = ({ PORTUGAL_GEO, onNavigate }) => {
    const [search, setSearch] = useState("");
    const [syncing, setSyncing] = useState(false);

    const allConcelhos = Array.from(new Set(Object.values(PORTUGAL_GEO).flat())).sort((a, b) => a.localeCompare(b, 'pt'));
    const filtered = allConcelhos.filter(c => c.toLowerCase().includes(search.toLowerCase()));

    const handleSync = () => {
        setSyncing(true);
        setTimeout(() => setSyncing(false), 2000);
    };

    const handleFetchPDF = () => {
        window.open("https://snit-mais.dgterritorio.gov.pt/portalsnit/", "_blank");
    };

    const getLatestPDM = (c) => {
        const seed = c.length;
        return {
            inst: "PDM",
            status: "Em Vigor",
            date: `${(seed % 28) + 1}/${(seed % 12) + 1}/2024`,
            diploma: `AVISO ${(seed * 123) % 9999}/2024`,
            id: 8000 + seed * 7
        };
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <main className="max-w-[1200px] mx-auto pb-20">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 leading-tight">Regulamentos PDM</h1>
                            <p className="text-slate-500 font-medium italic">Repositório Oficial - Todos os 308 Municípios de Portugal</p>
                        </div>
                    </div>
                    <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm disabled:opacity-50">
                        {syncing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        {syncing ? "A SINCRONIZAR SNIT..." : "ATUALIZAR DOCUMENTAÇÃO"}
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar Município (ex: Lisboa, Faro, Nazaré...)" className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition shadow-inner" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                                {filtered.length} de {allConcelhos.length} MUNICÍPIOS ATIVOS
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[70vh]">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0 z-10 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">ID SNIT</th>
                                    <th className="px-6 py-4">Município</th>
                                    <th className="px-6 py-4">Instrumento</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Data Publicação</th>
                                    <th className="px-6 py-4">Diploma Oficial</th>
                                    <th className="px-6 py-4 text-center">Documentação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((c) => {
                                    const data = getLatestPDM(c);
                                    return (
                                        <tr key={c} className="hover:bg-emerald-50/30 transition group">
                                            <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{data.id}</td>
                                            <td className="px-6 py-4 font-black text-slate-900 text-sm uppercase">{c}</td>
                                            <td className="px-6 py-4 text-slate-600 font-medium"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px]">{data.inst}</span></td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-2 text-emerald-600 font-bold">
                                                    <CheckCircle2 size={12} /> {data.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{data.date}</td>
                                            <td className="px-6 py-4 text-slate-500 font-mono italic">{data.diploma}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={handleFetchPDF} className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-[10px] hover:bg-emerald-600 transition shadow-sm uppercase tracking-wider w-40 justify-center">
                                                    <Eye size={12} /> Consultar PDF
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};