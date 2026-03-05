import React, { useState, useMemo } from 'react';
import { Site } from '../types';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface StockThresholdsProps {
    sites: Site[];
    products: string[];
    thresholds: { [site: string]: { [product: string]: number } };
    setThresholds: React.Dispatch<React.SetStateAction<{ [site: string]: { [product: string]: number } }>>;
    addLogEntry: (action: string, site?: string) => void;
}

export const StockThresholds: React.FC<StockThresholdsProps> = ({ sites, products, thresholds, setThresholds, addLogEntry }) => {
    const [productFilter, setProductFilter] = useState('');
    const [siteFilter, setSiteFilter] = useState('all');

    const handleThresholdChange = (site: string, product: string, value: string) => {
        const newThreshold = parseInt(value, 10);
        const currentThreshold = thresholds[site]?.[product];

        const isRemoving = value === '' || isNaN(newThreshold);
        
        if (isRemoving) {
            if (currentThreshold !== undefined) {
                 addLogEntry(`Limite de estoque para "${product}" removido`, site);
            }
        } else {
            if (currentThreshold !== newThreshold) {
                addLogEntry(`Limite de estoque para "${product}" definido para ${newThreshold}`, site);
            }
        }

        setThresholds(prev => {
            const newThresholds = JSON.parse(JSON.stringify(prev)); // Deep copy

            if (!newThresholds[site]) {
                newThresholds[site] = {};
            }

            if (isRemoving) {
                delete newThresholds[site][product];
            } else {
                 if (newThreshold >= 0) {
                    newThresholds[site][product] = newThreshold;
                 }
            }
            
            return newThresholds;
        });
    };

    const allCombinations = useMemo(() => {
        const combos: { product: string, site: string }[] = [];
        const sortedSites = [...sites].sort((a, b) => a.localeCompare(b));
        const sortedProducts = [...products].sort((a, b) => a.localeCompare(b));
        
        sortedProducts.forEach(product => {
            sortedSites.forEach(site => {
                combos.push({ product, site });
            });
        });
        return combos;
    }, [sites, products]);

    const filteredCombinations = useMemo(() => {
        return allCombinations.filter(item => {
            const siteMatch = siteFilter === 'all' || item.site === siteFilter;
            const productMatch = productFilter ? item.product.toLowerCase().includes(productFilter.toLowerCase()) : true;
            return siteMatch && productMatch;
        });
    }, [allCombinations, siteFilter, productFilter]);
    
    const inputClasses = "w-full text-right px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 dark:text-slate-100";


    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Delimitar Estoque Mínimo</h2>
            <p className="text-slate-600 dark:text-slate-400 -mt-6">
                Defina os limites de estoque baixo para cada produto por site. Alertas serão exibidos no dashboard quando o saldo atingir ou ficar abaixo do valor definido.
            </p>
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Input
                        label="Buscar por Produto"
                        id="productSearch"
                        type="text"
                        placeholder="Nome do produto..."
                        value={productFilter}
                        onChange={(e) => setProductFilter(e.target.value)}
                        autoComplete="off"
                    />
                    <Select
                        label="Filtrar por Site"
                        id="siteFilter"
                        value={siteFilter}
                        onChange={(e) => setSiteFilter(e.target.value)}
                    >
                        <option value="all">Todos os Sites</option>
                        {sites.map(site => (
                            <option key={site} value={site}>{site}</option>
                        ))}
                    </Select>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                        <thead className="bg-slate-100 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400 uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3 font-semibold rounded-l-lg">Produto</th>
                                <th scope="col" className="px-6 py-3 font-semibold">Site</th>
                                <th scope="col" className="px-6 py-3 font-semibold text-right rounded-r-lg">Estoque Mínimo (unidades)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredCombinations.map(({ product, site }) => {
                                const threshold = thresholds[site]?.[product] ?? '';
                                return (
                                    <tr key={`${site}-${product}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-2 font-medium text-slate-900 dark:text-white whitespace-nowrap">{product}</td>
                                        <td className="px-6 py-2 whitespace-nowrap">{site}</td>
                                        <td className="px-6 py-2">
                                            <input
                                                type="number"
                                                value={threshold}
                                                onChange={(e) => handleThresholdChange(site, product, e.target.value)}
                                                placeholder="Defina um limite"
                                                min="0"
                                                aria-label={`Estoque mínimo para ${product} em ${site}`}
                                                className={inputClasses}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                 {filteredCombinations.length === 0 && (
                    <p className="text-center text-slate-500 dark:text-slate-400 mt-6">Nenhuma combinação de produto/site encontrada para os filtros aplicados.</p>
                )}
            </Card>
        </div>
    );
};