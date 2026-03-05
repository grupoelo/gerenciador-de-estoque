
import React, { useMemo } from 'react';
import { Card } from './ui/Card';
import { Transaction, Site } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Button } from './ui/Button';

interface DashboardProps {
    transactions: Transaction[];
    stockBalance: { [key: string]: { [key: string]: number } };
    sites: Site[];
    stockThresholds: { [key: string]: { [key: string]: number } };
    inventoryItems: any[];
    weightedAverageCosts: { [site: string]: { [product: string]: number } };
}

import { toTitleCase } from '../utils/helpers';

const NeonSiteCard: React.FC<{
    title: string;
    entrada: number;
    saida: number;
    glowColor: string;
    gradient: string
}> = ({ title, entrada, saida, glowColor, gradient }) => (
    <div className={`relative group p-6 rounded-[32px] ${gradient} border border-white/10 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01] overflow-hidden`}
        style={{ boxShadow: `0 10px 40px -10px rgba(0,0,0,0.5), 0 0 20px -5px ${glowColor}` }}>
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px]" style={{ backgroundColor: glowColor }}></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h4 className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</h4>
                <p className="text-white text-3xl font-black tabular-nums">{(entrada + saida).toLocaleString()}</p>
            </div>
            <div className="text-right flex gap-4 sm:gap-6">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-emerald-300/70 uppercase">Entradas</span>
                    <span className="text-xl font-black text-emerald-300">+{entrada}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-rose-300/70 uppercase">Saídas</span>
                    <span className="text-xl font-black text-rose-300">-{saida}</span>
                </div>
            </div>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ transactions, stockBalance, stockThresholds }) => {

    const stats = useMemo(() => {
        const getSiteStats = (siteName: string) => {
            const normalizedSite = siteName.toLowerCase().trim();
            const filtered = transactions.filter(t => t.site.toLowerCase().trim() === normalizedSite);
            const entrada = filtered.filter(t => t.type === 'entrada').reduce((sum, t) => sum + t.quantity, 0);
            const saida = filtered.filter(t => t.type === 'saida').reduce((sum, t) => sum + t.quantity, 0);
            return { entrada, saida, total: entrada + saida };
        };

        const lowStockItems: any[] = [];
        Object.entries(stockThresholds).forEach(([siteName, siteProducts]) => {
            const normalizedConfigSite = siteName.trim().toLowerCase();
            const balanceSiteKey = Object.keys(stockBalance).find(k => k.trim().toLowerCase() === normalizedConfigSite);
            const siteStock = balanceSiteKey ? stockBalance[balanceSiteKey] : {};

            Object.entries(siteProducts).forEach(([prodName, threshold]) => {
                const normalizedConfigProd = prodName.trim().toLowerCase();
                const balanceProdKey = Object.keys(siteStock).find(k => k.trim().toLowerCase() === normalizedConfigProd);
                const currentBalance = balanceProdKey ? siteStock[balanceProdKey] : 0;

                if (currentBalance <= threshold) {
                    lowStockItems.push({
                        site: toTitleCase(siteName),
                        productName: toTitleCase(prodName),
                        quantity: currentBalance,
                        threshold: threshold
                    });
                }
            });
        });

        return {
            sp: getSiteStats('São Paulo'),
            rj: getSiteStats('Rio de Janeiro'),
            slzDunas: getSiteStats('São Luís Dunas'),
            slzIlha: getSiteStats('São Luís Ilha'),
            lowStockCount: lowStockItems.length,
            lowStockList: lowStockItems.sort((a, b) => (a.quantity - a.threshold) - (b.quantity - b.threshold))
        };
    }, [transactions, stockBalance, stockThresholds]);

    // Dados para o Gráfico de Barras Horizontais Neon
    const barChartData = useMemo(() => {
        return [
            { name: 'São Paulo', total: stats.sp.total, color: '#0ea5e9', glow: 'neonSP' },
            { name: 'São Luís Ilha', total: stats.slzIlha.total, color: '#10b981', glow: 'neonILHA' },
            { name: 'São Luís Dunas', total: stats.slzDunas.total, color: '#d946ef', glow: 'neonDUNAS' },
            { name: 'Rio de Janeiro', total: stats.rj.total, color: '#f59e0b', glow: 'neonRJ' }
        ].sort((a, b) => b.total - a.total);
    }, [stats]);

    const handleExportPurchaseList = () => {
        if (stats.lowStockList.length === 0) {
            alert("Não há itens em estoque crítico para exportar.");
            return;
        }
        const headers = "Site;Produto;Saldo Atual;Estoque Minimo;Sugestao de Compra";
        const rows = stats.lowStockList.map(item => {
            const suggestion = Math.max(0, item.threshold - item.quantity);
            return `${item.site};${item.productName};${item.quantity};${item.threshold};${suggestion}`;
        });
        const csvContent = [headers, ...rows].join('\r\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `lista_compra_emergencial_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 sm:space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Monitoramento Estratégico</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium uppercase text-[10px] tracking-[0.2em] font-black">Inteligência Operacional e Controle de Ativos</p>
                </div>
            </div>

            {/* Cards Neon Superiores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                <NeonSiteCard title="São Paulo" entrada={stats.sp.entrada} saida={stats.sp.saida} glowColor="#0ea5e9" gradient="bg-gradient-to-br from-sky-600 to-blue-800" />
                <NeonSiteCard title="Rio de Janeiro" entrada={stats.rj.entrada} saida={stats.rj.saida} glowColor="#f59e0b" gradient="bg-gradient-to-br from-amber-500 to-orange-700" />
                <NeonSiteCard title="SLZ Dunas" entrada={stats.slzDunas.entrada} saida={stats.slzDunas.saida} glowColor="#d946ef" gradient="bg-gradient-to-br from-fuchsia-600 to-purple-800" />
                <NeonSiteCard title="SLZ Ilha" entrada={stats.slzIlha.entrada} saida={stats.slzIlha.saida} glowColor="#10b981" gradient="bg-gradient-to-br from-emerald-500 to-teal-700" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Card de Alerta Estoque Baixo */}
                <div className="relative group p-6 sm:p-8 rounded-[40px] bg-slate-900 border border-red-500/30 shadow-[0_20px_50px_-15px_rgba(239,68,68,0.3)] overflow-hidden transition-all duration-500 hover:scale-[1.01]">
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-red-500/20 rounded-3xl border border-red-500/40">
                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-bounce">URGENTE</span>
                        </div>
                        <h3 className="text-white text-4xl font-black mb-1">{stats.lowStockCount}</h3>
                        <p className="text-red-400 font-bold uppercase tracking-wider text-xs mb-6">Itens em Estoque Crítico</p>

                        <div className="space-y-2.5 flex-1 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                            {stats.lowStockList.map((item, i) => (
                                <div key={i} className="flex flex-col p-3 bg-white/5 rounded-2xl border border-white/5 transition-colors hover:bg-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/80 text-[11px] font-bold truncate pr-2">
                                            {item.site} - {item.productName}
                                        </span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-red-400 text-xs font-black">{item.quantity} un</span>
                                            <span className="text-white/30 text-[8px] font-black uppercase">Mín: {item.threshold}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {stats.lowStockCount === 0 && (
                                <div className="text-center py-10 text-white/30 text-xs font-bold uppercase italic tracking-widest">
                                    Nenhum Alerta Ativo
                                </div>
                            )}
                        </div>
                        {stats.lowStockCount > 0 && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <Button onClick={handleExportPurchaseList} className="w-full !bg-red-600 hover:!bg-red-700 !rounded-2xl !py-3 !text-xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Gerar Lista de Compra (CSV)
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráfico de Barras Horizontais Moderno e Neon */}
                <Card className="lg:col-span-2 !p-6 sm:!p-10 !rounded-[40px] shadow-2xl border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-slate-900 overflow-hidden">
                    <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Performance por Unidade</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Análise de Fluxo Operacional Total</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase">Dados Consolidados</span>
                        </div>
                    </div>

                    <div className="h-[400px] w-full min-h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={barChartData} margin={{ top: 5, right: 60, left: 40, bottom: 5 }}>
                                <defs>
                                    <filter id="neonSP" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                                    <filter id="neonRJ" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                                    <filter id="neonDUNAS" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                                    <filter id="neonILHA" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="rgba(148, 163, 184, 0.05)" />
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', className: 'text-slate-900 dark:text-white', fontSize: 11, fontWeight: 'black', textTransform: 'uppercase' }}
                                    width={120}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '24px',
                                        color: '#f8fafc',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                        padding: '16px'
                                    }}
                                    itemStyle={{ fontWeight: 'black', fontSize: '12px', textTransform: 'uppercase' }}
                                    labelStyle={{ marginBottom: '8px', color: '#94a3b8', fontWeight: 'bold' }}
                                />
                                <Bar
                                    dataKey="total"
                                    radius={[0, 20, 20, 0]}
                                    barSize={45}
                                    animationDuration={2000}
                                >
                                    {barChartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            filter={`url(#${entry.glow})`}
                                            className="transition-all duration-300 hover:opacity-80"
                                        />
                                    ))}
                                </Bar>
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="square"
                                    wrapperStyle={{
                                        paddingTop: '40px',
                                        fontWeight: 'black',
                                        fontSize: '10px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        color: '#94a3b8'
                                    }}
                                    formatter={(value) => <span className="dark:text-slate-400">Total por Site</span>}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
