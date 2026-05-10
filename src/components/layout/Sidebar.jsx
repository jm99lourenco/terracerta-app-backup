import React from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  FileText, 
  Settings, 
  LogOut,
  Mountain
} from 'lucide-react';

export default function Sidebar({ activePage, onNavigate, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sig', label: 'Camadas SIG', icon: MapIcon },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'settings', label: 'Definições', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-brand-green-deep h-screen sticky top-0 flex flex-col text-white shadow-xl">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="p-1.5 bg-brand-green-accent rounded-md">
          <Mountain size={20} />
        </div>
        <span className="font-bold tracking-tight text-xl">TerraCerta</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activePage === item.id 
                ? 'bg-brand-green-accent text-white shadow-lg' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
