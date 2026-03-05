
import React, { useRef } from 'react';
import { ControllableView, User } from '../types';

interface SidebarProps {
    currentView: ControllableView | 'login';
    onNavigate: (view: ControllableView) => void;
    logoUrl: string | null;
    authenticatedUser: User | null;
    hasPermission: (user: User | null, view: ControllableView, action: 'canView') => boolean;
    onLogoChange: (file: File) => void;
    onLogoRemove: () => void;
    isOpen?: boolean;
    onToggle?: () => void;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactElement<{ className?: string }>;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <li>
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`flex items-center p-3 text-sm font-semibold rounded-xl transition-all duration-300 group ${isActive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]'
                : 'text-slate-500 dark:text-slate-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
        >
            <div className={`p-2 rounded-lg transition-all duration-300 ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30'
                }`}>
                {React.cloneElement(icon, {
                    className: `w-5 h-5 transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`,
                })}
            </div>
            <span className="ml-3 flex-1 whitespace-nowrap">{label}</span>
        </a>
    </li>
);

const DashboardIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const MovementsIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M5.75 13.25a7.5 7.5 0 102.5-8.5M4 9V4" /></svg>;
const HistoryIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BalanceIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10m16-10v10M8 7v10m8-10v10M12 5v14" /></svg>;
const InventoryIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const ThresholdIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const LogIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, logoUrl, authenticatedUser, hasPermission, onLogoChange, onLogoRemove, isOpen, onToggle }) => {
    const logoInputRef = useRef<HTMLInputElement>(null);
    const canChangeLogo = authenticatedUser?.role === 'Super Admin' || authenticatedUser?.role === 'Administrador';

    const handleLogoClick = () => { if (canChangeLogo) logoInputRef.current?.click(); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) onLogoChange(e.target.files[0]); };

    const navItems: { view: ControllableView, label: string, icon: React.ReactElement<{ className?: string }> }[] = [
        { view: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
        { view: 'movimentacoes', label: 'Movimentações', icon: <MovementsIcon /> },
        { view: 'historico', label: 'Histórico', icon: <HistoryIcon /> },
        { view: 'saldo', label: 'Saldo de Estoque', icon: <BalanceIcon /> },
        { view: 'inventario', label: 'Inventário', icon: <InventoryIcon /> },
        { view: 'limites', label: 'Estoque Mínimo', icon: <ThresholdIcon /> },
        { view: 'logs', label: 'Logs Sistema', icon: <LogIcon /> },
        { view: 'users', label: 'Usuários', icon: <UsersIcon /> },
    ];

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden"
                    onClick={onToggle}
                />
            )}

            <aside
                className={`fixed lg:static inset-y-0 left-0 w-72 z-[100] transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    } p-4 lg:p-0 h-full`}
            >
                <div className="flex flex-col h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/50 p-6 overflow-hidden">
                    <div className="flex items-center justify-between lg:hidden mb-6">
                        <span className="text-xs font-black uppercase text-slate-400">Navegação</span>
                        <button onClick={onToggle} className="p-2 text-slate-400 hover:text-emerald-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div
                        className={`relative mb-8 text-center transition-all duration-300 ${canChangeLogo ? 'cursor-pointer hover:opacity-80' : ''}`}
                        onClick={handleLogoClick}
                    >
                        <div className="flex flex-col items-center">
                            {/* Logo container: Totalmente transparente, sem moldura, brilho neon na figura */}
                            <div className="w-52 h-32 flex items-center justify-center relative mb-4 group transition-all duration-300">
                                {logoUrl ? (
                                    <div className="relative group">
                                        <img
                                            src={logoUrl}
                                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                                            style={{ filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.8))' }}
                                            alt="Logo"
                                        />
                                        {canChangeLogo && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onLogoRemove(); }}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:!opacity-100 transition-opacity shadow-lg z-[110]"
                                                title="Remover Logo"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-emerald-500" style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))' }}>
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m0 0v10l8 4m0-14L4 7" /></svg>
                                    </div>
                                )}
                            </div>
                            <h1 className="text-[13px] font-black text-slate-800 dark:text-white uppercase leading-tight tracking-[0.1em]">Gerenciador de <span className="text-emerald-500">Estoque</span></h1>
                        </div>
                        {canChangeLogo && <input type="file" ref={logoInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />}
                    </div>

                    <nav className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                        {navItems.map(item => hasPermission(authenticatedUser, item.view, 'canView') && (
                            <NavItem key={item.view} label={item.label} icon={item.icon} isActive={currentView === item.view} onClick={() => onNavigate(item.view)} />
                        ))}
                    </nav>

                    <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                        <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 text-center">
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-600 dark:text-emerald-400 mb-1">Versão 2.5</p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Developed by José Botelho</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};
