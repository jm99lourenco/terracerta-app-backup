// PdmModule.jsx - Supabase Static Document Architecture
import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Search, RefreshCw, CheckCircle2, Eye, FileText, AlertCircle, Loader2, ExternalLink, X } from "lucide-react";

export const PdmModule = ({ PORTUGAL_GEO, onNavigate, supabaseClient }) => {
    const [search, setSearch] = useState("");
    const [regulations, setRegulations] = useState({});
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedMunicipality, setSelectedMunicipality] = useState(null);
    const [municipalityDocs, setMunicipalityDocs] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    const allConcelhos = Array.from(new Set(Object.values(PORTUGAL_GEO).flat())).sort((a, b) => a.localeCompare(b, 'pt'));
    const filtered = allConcelhos.filter(c => c.toLowerCase().includes(search.toLowerCase()));

    // Fetch all regulations on mount to build a lookup map
    const fetchRegulations = useCallback(async () => {
        if (!supabaseClient) return;
        setLoading(true);
        try {
            const { data, error } = await supabaseClient
                .from('municipality_regulations')
                .select('municipality_name, document_type, pdf_url');

            if (error) throw error;

            // Build a lookup: { "Lisboa": { "PDM": url, "RAN": url, ... } }
            const map = {};
            (data || []).forEach(row => {
                if (!map[row.municipality_name]) map[row.municipality_name] = {};
                map[row.municipality_name][row.document_type] = row.pdf_url;
            });
            setRegulations(map);
        } catch (err) {
            console.error('Failed to fetch regulations:', err);
        } finally {
            setLoading(false);
        }
    }, [supabaseClient]);

    useEffect(() => {
        fetchRegulations();
    }, [fetchRegulations]);

    const handleSync = async () => {
        setSyncing(true);
        await fetchRegulations();
        setSyncing(false);
    };

    // Fetch documents for a specific municipality
    const handleViewDocs = async (municipalityName) => {
        setSelectedMunicipality(municipalityName);
        setLoadingDocs(true);

        if (!supabaseClient) {
            setMunicipalityDocs([]);
            setLoadingDocs(false);
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('municipality_regulations')
                .select('*')
                .eq('municipality_name', municipalityName)
                .order('document_type');

            if (error) throw error;
            setMunicipalityDocs(data || []);
        } catch (err) {
            console.error('Failed to fetch municipality docs:', err);
            setMunicipalityDocs([]);
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleOpenPdf = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const getDocBadge = (type) => {
        const styles = {
            PDM: 'bg-blue-100 text-blue-700',
            RAN: 'bg-amber-100 text-amber-700',
            REN: 'bg-emerald-100 text-emerald-700',
        };
        return styles[type] || 'bg-slate-100 text-slate-600';
    };

    const getMunicipalityStatus = (name) => {
        const docs = regulations[name];
        if (!docs) return { count: 0, label: 'Sem Documentos', color: 'text-slate-400' };
        const count = Object.keys(docs).length;
        if (count >= 3) return { count, label: 'Completo', color: 'text-emerald-600' };
        return { count, label: `${count}/3 Documentos`, color: 'text-amber-600' };
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
                            <p className="text-slate-500 font-medium italic">Repositório Oficial — Todos os 308 Municípios de Portugal</p>
                        </div>
                    </div>
                    <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm disabled:opacity-50">
                        {syncing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        {syncing ? "A SINCRONIZAR..." : "ATUALIZAR DOCUMENTAÇÃO"}
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

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 size={24} className="animate-spin mb-3" />
                            <p className="text-xs font-bold uppercase tracking-widest">A carregar regulamentos...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-h-[70vh]">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0 z-10 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Município</th>
                                        <th className="px-6 py-4 text-center">PDM</th>
                                        <th className="px-6 py-4 text-center">RAN</th>
                                        <th className="px-6 py-4 text-center">REN</th>
                                        <th className="px-6 py-4 text-center">Estado</th>
                                        <th className="px-6 py-4 text-center">Documentação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map((c) => {
                                        const status = getMunicipalityStatus(c);
                                        const docs = regulations[c] || {};
                                        return (
                                            <tr key={c} className="hover:bg-emerald-50/30 transition group">
                                                <td className="px-6 py-4 font-black text-slate-900 text-sm uppercase">{c}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {docs.PDM
                                                        ? <button onClick={() => handleOpenPdf(docs.PDM)} className="text-blue-600 hover:text-blue-800 transition" title="Abrir PDM"><CheckCircle2 size={16} /></button>
                                                        : <span className="text-slate-300">—</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {docs.RAN
                                                        ? <button onClick={() => handleOpenPdf(docs.RAN)} className="text-amber-600 hover:text-amber-800 transition" title="Abrir RAN"><CheckCircle2 size={16} /></button>
                                                        : <span className="text-slate-300">—</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {docs.REN
                                                        ? <button onClick={() => handleOpenPdf(docs.REN)} className="text-emerald-600 hover:text-emerald-800 transition" title="Abrir REN"><CheckCircle2 size={16} /></button>
                                                        : <span className="text-slate-300">—</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-[10px] font-bold uppercase ${status.color}`}>{status.label}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleViewDocs(c)} className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-[10px] hover:bg-emerald-600 transition shadow-sm uppercase tracking-wider w-40 justify-center">
                                                        <Eye size={12} /> Consultar PDF
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Document Detail Modal */}
            {selectedMunicipality && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedMunicipality(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="px-8 py-6 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-wide">{selectedMunicipality}</h2>
                                <p className="text-slate-400 text-xs font-medium mt-1">Documentos Regulamentares</p>
                            </div>
                            <button onClick={() => setSelectedMunicipality(null)} className="text-slate-400 hover:text-white transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8">
                            {loadingDocs ? (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <Loader2 size={20} className="animate-spin mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-widest">A carregar...</p>
                                </div>
                            ) : municipalityDocs.length > 0 ? (
                                <div className="space-y-4">
                                    {municipalityDocs.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition group">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                                    <FileText size={20} className="text-slate-600" />
                                                </div>
                                                <div>
                                                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mb-1 ${getDocBadge(doc.document_type)}`}>
                                                        {doc.document_type}
                                                    </span>
                                                    <p className="text-xs text-slate-500 font-medium">{selectedMunicipality} — {doc.document_type}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleOpenPdf(doc.pdf_url)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 transition shadow-sm"
                                            >
                                                <ExternalLink size={12} /> Abrir PDF
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Fallback state - no documents found */
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="p-4 bg-amber-50 rounded-2xl mb-4">
                                        <AlertCircle size={28} className="text-amber-500" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">Regulamento em processamento para este município.</h3>
                                    <p className="text-xs text-slate-400 max-w-xs">Os documentos PDM, RAN e REN estão a ser carregados para o sistema. Consulte novamente em breve.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};