import React, { useMemo, useState } from 'react';
import { Card } from './ui/Card';
import { Site } from '../types';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';

interface FlatBalanceItem {
    product: string;
    site: string;
    balance: number;
    unitPrice: number;
    totalPrice: number;
}

declare global {
    interface Window {
        jspdf: any;
    }
}

interface StockBalanceProps {
  balance: { [key: string]: { [key: string]: number } };
  sites: Site[];
  unitPrices: { [site: string]: { [productName: string]: number } };
  logoUrl: string | null;
}

export const StockBalance: React.FC<StockBalanceProps> = ({ balance, sites, unitPrices, logoUrl }) => {
  const [productFilter, setProductFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');

  const flatBalance = useMemo(() => {
    const flatData: FlatBalanceItem[] = [];
    Object.entries(balance).forEach(([site, products]) => {
        // FIX: Normalização robusta para encontrar preços unitários do site
        const normalizedSiteName = site.trim().toLowerCase();
        const priceSiteKey = Object.keys(unitPrices).find(k => k.trim().toLowerCase() === normalizedSiteName);
        const sitePrices = priceSiteKey ? unitPrices[priceSiteKey] : {};

        Object.entries(products).forEach(([productName, quantity]) => {
            if (quantity !== 0) {
                // FIX: Busca de preço insensível a maiúsculas/minúsculas para o produto
                const normalizedProdName = productName.trim().toLowerCase();
                const priceProdKey = Object.keys(sitePrices).find(k => k.trim().toLowerCase() === normalizedProdName);
                const unitPrice = priceProdKey ? sitePrices[priceProdKey] : 0;

                flatData.push({
                    product: productName,
                    site: site,
                    balance: quantity,
                    unitPrice: unitPrice,
                    totalPrice: quantity * unitPrice,
                });
            }
        });
    });
    return flatData.sort((a, b) => a.product.localeCompare(b.product) || a.site.localeCompare(b.site));
  }, [balance, unitPrices]);

  const productOptions = useMemo(() => {
    const products: string[] = Array.from(new Set(flatBalance.map(item => item.product)));
    return products.sort((a, b) => a.localeCompare(b));
  }, [flatBalance]);

  const filteredData = useMemo(() => {
    return flatBalance.filter(item => {
        const siteMatch = siteFilter === 'all' || 
                         item.site.trim().toLowerCase() === siteFilter.trim().toLowerCase();
        
        const productMatch = productFilter ? item.product === productFilter : true;
        
        return siteMatch && productMatch;
    });
  }, [flatBalance, siteFilter, productFilter]);

  const totalFilteredValue = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [filteredData]);
  
  const handleExport = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    if (logoUrl && logoUrl.startsWith('data:image')) {
        try {
            doc.addImage(logoUrl, 'PNG', margin, 10, 40, 15, undefined, 'FAST');
        } catch (e) {
            console.error("Error adding logo to PDF", e);
            doc.setFontSize(12);
            doc.text("Gestão de Estoque", margin, 20);
        }
    } else {
        doc.setFontSize(12);
        doc.text("Gestão de Estoque", margin, 20);
    }

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("SALDO DE ESTOQUE", pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString('pt-BR');
    doc.text(`Usuário: Sistema`, pageWidth - margin, 15, { align: 'right' });
    doc.text(`Data: ${today}`, pageWidth - margin, 20, { align: 'right' });
    
    const tableColumn = ["Produto", "Site", "Saldo", "R$ Unit.", "R$ Total"];
    const tableRows = filteredData.map(item => [
        item.product,
        item.site,
        item.balance.toString(),
        item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    ]);

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }, 
        styles: { font: 'helvetica', fontSize: 9 },
        didParseCell: (data: any) => {
            if (data.column.index >= 2) { 
                data.cell.styles.halign = 'right';
            } else { 
                data.cell.styles.halign = 'left';
            }
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const totalText = `Valor Total Filtrado: ${totalFilteredValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    doc.text(totalText, pageWidth - margin, finalY + 15, { align: 'right' });

    doc.save('saldo_de_estoque.pdf');
  }

  return (
    <div className="space-y-8">
        <Card className="!p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <Select
                    label="Filtrar por Produto"
                    id="productSearch"
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                >
                    <option value="">Todos os Produtos</option>
                    {productOptions.map(prod => (
                        <option key={prod} value={prod}>{prod}</option>
                    ))}
                </Select>
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
                 <Input
                    label="Valor Total Filtrado"
                    id="totalFilteredValue"
                    readOnly
                    value={totalFilteredValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    className="font-bold"
                />
                <Button onClick={handleExport} variant="secondary" className="w-full justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                   </svg>
                    Exportar para PDF
                </Button>
            </div>
        </Card>
      
        <Card className="overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-700 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Estoque Atual</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Saldo atual de produtos por localização</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase">
                        <tr className="border-b border-slate-200 dark:border-slate-600">
                            <th scope="col" className="px-6 py-3 font-bold text-left">Produto</th>
                            <th scope="col" className="px-6 py-3 font-bold text-left">Site</th>
                            <th scope="col" className="px-6 py-3 font-bold text-right">Saldo</th>
                            <th scope="col" className="px-6 py-3 font-bold text-right">R$ Unit.</th>
                            <th scope="col" className="px-6 py-3 font-bold text-right">R$ Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredData.length > 0 ? filteredData.map((item, index) => (
                        <tr key={`${item.site}-${item.product}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap text-left">{item.product}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 text-left">{item.site}</td>
                            <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">{item.balance}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 text-right">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800 dark:text-white text-right">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>
                        )) : (
                        <tr>
                            <td colSpan={5} className="text-center py-10 text-slate-500 dark:text-slate-400">Nenhum produto em estoque para os filtros aplicados.</td>
                        </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    </div>
  );
};