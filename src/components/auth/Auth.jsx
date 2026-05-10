import React, { useState } from 'react';
import { Mountain, Lock, Mail, ArrowRight } from 'lucide-react';

const ALLOWED_USERS = ["admin1@terracerta.pt", "admin2@terracerta.pt"];

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ALLOWED_USERS.includes(email.toLowerCase()) && password === "portugal2026") {
      onLogin(email);
    } else {
      alert("Credenciais inválidas ou acesso não autorizado.");
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-brand-green-deep">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-0 w-64 h-32 bg-white/10 blur-3xl rounded-full animate-cloud" />
        <svg className="absolute bottom-0 w-full h-1/2 opacity-20" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#ffffff" d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,186.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-brand-green-deep rounded-lg">
            <Mountain className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-green-deep">TerraCerta</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-60">Email Profissional</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-soft-bg border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green-accent outline-none transition"
                placeholder="nome@terracerta.pt"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-60">Palavra-passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-soft-bg border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green-accent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button className="w-full bg-brand-green-deep hover:bg-brand-green-accent text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]">
            Entrar na Plataforma <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
