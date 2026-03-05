
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface LoginProps {
    onLogin: (email: string, password_raw: string) => boolean;
    logoUrl: string | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin, logoUrl }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            const success = onLogin(email, password);
            if (!success) {
                setError('E-mail ou senha inválidos. Tente novamente.');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f8fafc] dark:bg-slate-950 relative overflow-hidden">
            {/* Background Decorative Gradients */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px]" />

            <div className="w-full max-w-[440px] relative z-10 animate-fade-in">
                <Card className="!p-10 !rounded-[40px] shadow-2xl border-white dark:border-slate-800">
                    <div className="flex flex-col items-center mb-10">
                        {/* Logo container: Limpo, sem moldura box, brilho neon acompanhando a silhueta */}
                        <div className="w-64 h-40 flex items-center justify-center mb-8 group transition-all duration-300">
                            {logoUrl ? (
                                <img 
                                  src={logoUrl} 
                                  alt="Logo" 
                                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
                                  style={{ filter: 'drop-shadow(0 0 18px rgba(16, 185, 129, 0.75))' }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-emerald-500" style={{ filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.5))' }}>
                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m0 0v10l8 4m0-14L4 7" /></svg>
                                </div>
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight text-center">
                            Bem-vindo ao <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Gerenciador de Estoque</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium">Controle inteligente e simplificado</p>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl mb-8 text-sm font-semibold flex items-center gap-2" role="alert">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <Input 
                                label="E-mail"
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="exemplo@gestao.app"
                                required
                                className="!rounded-2xl !py-3 !bg-slate-50 dark:!bg-slate-800/50"
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-1">
                            <Input 
                                label="Senha"
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="!rounded-2xl !py-3 !bg-slate-50 dark:!bg-slate-800/50"
                                autoComplete="current-password"
                            />
                        </div>
                        
                        <Button type="submit" className="w-full !py-4 !text-lg !rounded-2xl shadow-xl mt-4" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Validando...
                                </>
                            ) : (
                               'Entrar no Sistema'
                            )}
                        </Button>
                    </form>
                    
                    <p className="text-center mt-8 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        Acesso Restrito
                    </p>
                </Card>
            </div>
        </div>
    );
};
