
import React from 'react';
import { User } from '../types';
import { Button } from './ui/Button';

interface HeaderProps {
  authenticatedUser: User | null;
  onLogout: () => void;
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ authenticatedUser, onLogout, onMenuToggle }) => {
  if (!authenticatedUser) return null;

  return (
    <header className="mb-6 sm:mb-8 relative flex items-center justify-between bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
      {/* Lado Esquerdo */}
      <div className="flex items-center gap-4 z-10">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-500 hover:text-emerald-500 bg-slate-100 dark:bg-slate-700 rounded-xl transition-colors"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="hidden sm:block">
           <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Acesso Autorizado</span>
        </div>
      </div>

      {/* Centro - Login do Usuário */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center text-center pointer-events-auto">
          <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate max-w-[150px] sm:max-w-none">
            {authenticatedUser.email}
          </p>
          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-tighter">
            {authenticatedUser.role} • {authenticatedUser.site}
          </p>
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex items-center gap-3 sm:gap-4 z-10">
        <Button onClick={onLogout} variant="secondary" className="!px-3 !py-2 !rounded-xl border-none shadow-none hover:bg-slate-100 dark:hover:bg-slate-700" title="Sair do sistema">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline font-black text-[11px] uppercase tracking-wider">Sair</span>
        </Button>
      </div>
    </header>
  );
};
