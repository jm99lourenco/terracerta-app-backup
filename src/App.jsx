import React, { useState } from 'react';
import Auth from './components/auth/Auth';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="flex min-h-screen bg-soft-bg">
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        onLogout={() => setUser(null)} 
      />
      
      <main className="flex-1 p-10 max-w-7xl mx-auto">
        {activePage === 'dashboard' && (
          <Dashboard onNewAnalysis={() => console.log("Nova Análise")} />
        )}
        
        {activePage === 'sig' && (
          <div className="text-center py-20 text-slate-400">Página de SIG em desenvolvimento...</div>
        )}
      </main>
    </div>
  );
}
