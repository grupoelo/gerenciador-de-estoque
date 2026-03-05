
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, Site, User, ControllableView, TransactionType, Sector } from '../types';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

declare global {
    interface Window {
        jspdf: any;
        XLSX: any;
    }
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  sites: Site[];
  sectors: Sector[];
  logoUrl: string | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  authenticatedUser: User | null;
  hasPermission: (user: User | null, view: ControllableView, action: 'canEdit' | 'canDelete') => boolean;
  onAddMultiple: (transactions: Transaction[]) => void;
}

const toTitleCase = (str: string): string => {
    if (!str) return 'N/A';
    const raw = str.toString().trim();
    const upper = raw.toUpperCase();
    
    // Padroniza variações de N/A para não virar "N/a"
    if (upper === 'N/A' || upper === 'NA' || upper === 'N\\A' || upper === 'N.A' || upper === '') return 'N/A';
    
    // Se for sigla curta (TI, RH, SP, RJ, SLZ, ADM), mantém em maiúsculo
    if (raw.length <= 3 && raw === raw.toUpperCase()) return raw;
    
    // Partículas que devem ficar em minúsculo
    const particles = ['de', 'do', 'da', 'dos', 'das', 'e', 'o', 'a'];
    
    return raw.toLowerCase().split(' ').map((word, index) => {
        if (index > 0 && particles.includes(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

const formatDateToBR = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
        return `${day}/${month}/${year}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
};

const parseBRDateToISO = (brDate: string): string => {
    if (!brDate) return '';
    const parts = brDate.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return brDate;
};

// Mapa de sinônimos exaustivo para as colunas da planilha
const COLUMN_MAP: Record<string, string[]> = {
    date: ['data', 'date', 'movimentacao', 'dia', 'datamovimentacao'],
    type: ['tipo', 'operacao', 'movimentacao', 'entradasaida', 'tipomovimentacao', 'inout', 'lancamento'],
    site: ['site', 'local', 'unidade', 'filial', 'localidade', 'centro'],
    productName: ['produto', 'item', 'nome', 'descricao', 'nomeproduto', 'material'],
    quantity: ['quant', 'quantidade', 'qtd', 'volume', 'unidades', 'qtde'], 
    unitPrice: ['unitario', 'valor', 'preco', 'rsunit', 'valorunitario', 'custo', 'vlrunit'],
    ticket: ['ticket', 'nticket', 'chamado', 'protocolo', 'idchamado', 'numticket'], 
    sector: ['setor', 'operacao', 'area', 'departamento', 'secao', 'localizacao', 'setoroperacao', 'setoroper', 'unidade_setor', 'centrocusto', 'destino', 'solicitante'], 
    invoiceNumber: ['nf', 'nota', 'notafiscal', 'documento', 'fatura'],
    serialNumber: ['serial', 'nserie', 'servicetag', 'numerodeserie', 'serie'],
    responsible: ['tecresponsavel', 'responsavel', 'tecnico', 'quem', 'usuario', 'nome'], 
    observation: ['observacao', 'obs', 'comentario', 'notas', 'detalhes']
};

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, sites, sectors, logoUrl, onEdit, onDelete, authenticatedUser, hasPermission, onAddMultiple }) => {
  const [filterType, setFilterType] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState<Transaction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = hasPermission(authenticatedUser, 'historico', 'canEdit');
  const canDelete = hasPermission(authenticatedUser, 'historico', 'canDelete');

  const productOptions = useMemo(() => {
    const products: string[] = Array.from(new Set(transactions.map(t => t.productName)));
    return products.sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filterType ? t.type === filterType : true)
      .filter(t => filterSite ? t.site.trim().toLowerCase() === filterSite.trim().toLowerCase() : true)
      .filter(t => filterSector ? t.sector.trim().toLowerCase() === filterSector.trim().toLowerCase() : true)
      .filter(t => filterProduct ? t.productName === filterProduct : true)
      .sort((a, b) => {
          const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return b.id.localeCompare(a.id);
      });
  }, [transactions, filterType, filterSite, filterSector, filterProduct]);

  const siteChartData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];
    type ChartDataPoint = { site: string; entrada: number; saida: number; };
    type Accumulator = { [key: string]: ChartDataPoint; };
    const dataBySite = filteredTransactions.reduce((acc: Accumulator, t) => {
      const siteKey = t.site.trim().toUpperCase();
      const canonicalSiteName = sites.find(s => s.trim().toUpperCase() === siteKey) || t.site;
      if (!acc[siteKey]) {
        acc[siteKey] = { site: canonicalSiteName, entrada: 0, saida: 0, };
      }
      if (t.type === 'entrada') acc[siteKey].entrada += t.quantity;
      else if (t.type === 'saida') acc[siteKey].saida += t.quantity;
      return acc;
    }, {} as Accumulator);
    return Object.values(dataBySite).sort((a: ChartDataPoint, b: ChartDataPoint) => a.site.localeCompare(b.site));
  }, [filteredTransactions, sites]);

  const sectorChartData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];
    const isSectorFiltered = !!filterSector;
    type ChartDataPoint = { label: string; entrada: number; saida: number; };
    type Accumulator = { [key: string]: ChartDataPoint; };
    const dataGrouped = filteredTransactions.reduce((acc: Accumulator, t) => {
      const key = isSectorFiltered ? t.productName.trim() : t.sector.trim();
      const upperKey = key.toUpperCase();
      if (!acc[upperKey]) {
        acc[upperKey] = { label: key, entrada: 0, saida: 0, };
      }
      if (t.type === 'entrada') acc[upperKey].entrada += t.quantity;
      else if (t.type === 'saida') acc[upperKey].saida += t.quantity;
      return acc;
    }, {} as Accumulator);
    return Object.values(dataGrouped).sort((a: ChartDataPoint, b: ChartDataPoint) => a.label.localeCompare(b.label));
  }, [filteredTransactions, filterSector]);

  const handleExportPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    const header = () => {
        if (logoUrl && logoUrl.startsWith('data:image')) {
            try { doc.addImage(logoUrl, 'PNG', margin, 10, 30, 12, undefined, 'FAST'); } catch (e) {
                doc.setFontSize(10); doc.text("Gestão de Estoque", margin, 18);
            }
        } else {
            doc.setFontSize(10); doc.text("Gestão de Estoque", margin, 18);
        }
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text("HISTÓRICO DE TRANSAÇÕES", pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        const today = new Date().toLocaleDateString('pt-BR');
        doc.text(`Usuário: ${authenticatedUser?.email || 'N/A'} | Data: ${today}`, pageWidth - margin, 18, { align: 'right' });
        doc.setLineWidth(0.5);
        doc.line(margin, 22, pageWidth - margin, 22);
    };

    const tableColumn = ["Data", "Tipo", "Site", "Produto", "Qtd", "Vlr. Unit.", "Ticket", "Setor", "NF", "Nº Série", "Responsável", "Obs"];
    const tableRows = filteredTransactions.map(t => [
        formatDateToBR(t.date),
        t.type.toUpperCase(),
        t.site,
        t.productName,
        t.quantity.toString(),
        (t.unitPrice ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        t.ticket || '-',
        t.sector,
        t.invoiceNumber || '-',
        t.serialNumber || '-',
        t.responsible,
        t.observation || '-'
    ]);

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 28,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], fontSize: 8 },
        styles: { font: 'helvetica', fontSize: 7, cellPadding: 2 },
        didDrawPage: (data: any) => {
            header();
        },
        margin: { top: 28 }
    });

    doc.save(`historico_estoque_${new Date().getTime()}.pdf`);
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Não há transações para exportar com os filtros atuais.");
      return;
    }
    const headers = "Data;Tipo;Site;Produto;Quantidade;Valor Unitario;Valor Total;Ticket;Setor;Nota Fiscal;Serial;Responsavel;Observacao";
    
    const escapeField = (data: any) => {
        const str = String(data || '').trim();
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvRows = filteredTransactions.map(t => [
        formatDateToBR(t.date),
        t.type.toUpperCase(),
        escapeField(t.site),
        escapeField(t.productName),
        t.quantity.toString().replace('.', ','),
        t.unitPrice.toString().replace('.', ','),
        (t.quantity * t.unitPrice).toString().replace('.', ','),
        escapeField(t.ticket),
        escapeField(t.sector),
        escapeField(t.invoiceNumber),
        escapeField(t.serialNumber),
        escapeField(t.responsible),
        escapeField(t.observation),
    ].join(';'));

    const csvContent = [headers, ...csvRows].join('\r\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `historico_estoque_atualizado_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleDownloadTemplate = () => {
    const headers = "Data;Tipo;Site;Produto;Quantidade;Valor Unitario;Ticket;Setor;Nota Fiscal;Serial;Responsavel;Observacao";
    const exampleRow = `${formatDateToBR(new Date().toISOString().split('T')[0])};saida;Rio de Janeiro;Headsets;5;150,00;298504;RIO - SALA A;NF-999;SN-888;JOSIAS CAMPOS;Atualização de estoque`;
    const csvContent = headers + "\n" + exampleRow;
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "modelo_importacao_historico.csv");
    link.click();
  };

  const processImportedRows = (rows: any[]) => {
      const newTransactions: Transaction[] = [];
      if (!rows || rows.length === 0) return;

      const normalize = (s: string) => {
          if (!s) return "";
          return s.toString().toLowerCase().trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
      };

      rows.forEach((row, rowIndex) => {
          // Normaliza todas as chaves do objeto da linha para facilitar a busca
          const rowData: Record<string, any> = {};
          const rawKeys: string[] = Object.keys(row);
          rawKeys.forEach(k => {
              rowData[normalize(k)] = row[k];
          });

          // Função de busca robusta
          const getVal = (field: keyof typeof COLUMN_MAP, defaultIdx: number) => {
              // 1. Tenta pelos sinônimos exatos normalizados
              for (const syn of COLUMN_MAP[field]) {
                  const key = normalize(syn);
                  if (rowData[key] !== undefined && rowData[key] !== null && rowData[key].toString().trim() !== '') {
                      return rowData[key];
                  }
              }
              // 2. Tenta por busca parcial (se algum cabeçalho contém a palavra chave)
              const fieldKeywords = field === 'sector' ? ['setor', 'oper', 'area'] : [field.toString().toLowerCase()];
              for (const k of rawKeys) {
                  const nk = normalize(k);
                  if (fieldKeywords.some(kw => nk.includes(kw))) {
                      const val = row[k];
                      if (val !== undefined && val !== null && val.toString().trim() !== '') return val;
                  }
              }
              // 3. Fallback posicional (apenas se os cabeçalhos parecerem seguir o padrão do sistema)
              const valuesArray = Object.values(row);
              if (valuesArray.length > defaultIdx && valuesArray[defaultIdx] !== undefined) {
                  return valuesArray[defaultIdx];
              }
              return '';
          };

          const rawTypeStr = getVal('type', 1).toString().trim().toUpperCase();
          let type: TransactionType | null = null;
          if (rawTypeStr.startsWith('E') || rawTypeStr.includes('ENT')) type = 'entrada';
          else if (rawTypeStr.startsWith('S') || rawTypeStr.includes('SAI')) type = 'saida';
          if (!type) return; 

          let rawDate = getVal('date', 0);
          let finalDate = new Date().toISOString().split('T')[0];
          if (rawDate) {
              if (typeof rawDate === 'number' && rawDate > 10000) {
                  const dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
                  finalDate = dateObj.toISOString().split('T')[0];
              } else {
                  const dateStr = rawDate.toString().trim();
                  if (dateStr.includes('/')) finalDate = parseBRDateToISO(dateStr);
                  else if (dateStr.includes('-')) finalDate = dateStr.substring(0, 10);
              }
          }

          const parseNum = (val: any) => {
              if (typeof val === 'number') return val;
              if (!val) return 0;
              const cleaned = String(val).replace(/\s/g, '').replace(/[R$]/g, '').replace(/\./g, '').replace(',', '.');
              const n = parseFloat(cleaned);
              return isNaN(n) ? 0 : n;
          };

          const quantity = parseNum(getVal('quantity', 4));
          const unitPrice = parseNum(getVal('unitPrice', 5));
          
          // Captura o setor com a nova lógica robusta
          const sectorValue = getVal('sector', 8);

          newTransactions.push({
              id: `${Date.now()}-import-${rowIndex}-${Math.random().toString(36).substr(2, 5)}`,
              date: finalDate,
              type: type as TransactionType,
              site: toTitleCase(getVal('site', 2).toString()),
              productName: toTitleCase(getVal('productName', 3).toString()),
              quantity: quantity,
              unitPrice: unitPrice,
              totalPrice: quantity * unitPrice,
              ticket: getVal('ticket', 7).toString().trim(),
              sector: toTitleCase(sectorValue.toString()),
              invoiceNumber: getVal('invoiceNumber', 9).toString().trim(),
              serialNumber: getVal('serialNumber', 10).toString().trim(),
              responsible: getVal('responsible', 11).toString().trim() || 'Importação',
              observation: getVal('observation', 12).toString().trim(),
          });
      });

      if (newTransactions.length > 0) {
          onAddMultiple(newTransactions);
          alert(`${newTransactions.length} lançamentos processados com sucesso!`);
      }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();
    
    if (extension === 'xlsx' || extension === 'xls') {
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = window.XLSX.read(data, { type: 'array', cellDates: true });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            processImportedRows(jsonData);
        };
        reader.readAsArrayBuffer(file);
    } else {
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) return;
            
            let headerLine = lines[0].trim();
            if (headerLine.charCodeAt(0) === 0xFEFF) headerLine = headerLine.substring(1);
            
            const countSemicolon = (headerLine.match(/;/g) || []).length;
            const countComma = (headerLine.match(/,/g) || []).length;
            const delimiter = countSemicolon >= countComma ? ';' : ',';
            
            const headers = headerLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
            const rows = lines.slice(1).map(line => {
                const values = line.split(delimiter);
                const obj: any = {};
                headers.forEach((h, idx) => {
                    if (h) obj[h] = values[idx]?.trim().replace(/"/g, '') || '';
                });
                return obj;
            });
            processImportedRows(rows);
        };
        reader.readAsText(file, 'ISO-8859-1');
    }
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      {confirmingDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setConfirmingDelete(null)}>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full mx-4 border border-slate-200/80 dark:border-slate-700/60" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar Exclusão</h3>
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                      Excluir transação de <strong className="text-slate-800 dark:text-slate-200">{confirmingDelete.productName}</strong> (Qtd: {confirmingDelete.quantity}) em {formatDateToBR(confirmingDelete.date)}?
                  </p>
                  <div className="mt-6 flex justify-end space-x-3">
                      <Button variant="secondary" onClick={() => setConfirmingDelete(null)}>Cancelar</Button>
                      <Button onClick={() => { onDelete(confirmingDelete.id); setConfirmingDelete(null); }} className="!bg-red-600 hover:!bg-red-700 text-white">Confirmar Exclusão</Button>
                  </div>
              </div>
          </div>
      )}

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Histórico de Transações</h2>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Movimentação por Site</h3>
          <div className="w-full h-80">
              {siteChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={siteChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                          <XAxis dataKey="site" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }} labelStyle={{ color: '#cbd5e1' }} itemStyle={{ fontWeight: 'bold' }} />
                          <Legend wrapperStyle={{paddingTop: '10px'}} />
                          <Bar name="Entradas" dataKey="entrada" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={50}><LabelList dataKey="entrada" position="center" style={{ fill: 'white', fontWeight: 'bold' }} formatter={(value: number) => value > 0 ? value : ''} /></Bar>
                          <Bar name="Saídas" dataKey="saida" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={50}><LabelList dataKey="saida" position="center" style={{ fill: 'white', fontWeight: 'bold' }} formatter={(value: number) => value > 0 ? value : ''} /></Bar>
                      </BarChart>
                  </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-slate-500">Sem dados.</div>}
          </div>
        </Card>
        <Card>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              {filterSector ? `Movimentação por Produto (Setor: ${filterSector})` : 'Movimentação por Setor'}
          </h3>
          <div className="w-full h-80">
              {sectorChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sectorChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }} labelStyle={{ color: '#cbd5e1' }} itemStyle={{ fontWeight: 'bold' }} />
                          <Legend wrapperStyle={{paddingTop: '10px'}} />
                          <Bar name="Entradas" dataKey="entrada" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={50}><LabelList dataKey="entrada" position="center" style={{ fill: 'white', fontWeight: 'bold' }} formatter={(value: number) => value > 0 ? value : ''} /></Bar>
                          <Bar name="Saídas" dataKey="saida" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={50}><LabelList dataKey="saida" position="center" style={{ fill: 'white', fontWeight: 'bold' }} formatter={(value: number) => value > 0 ? value : ''} /></Bar>
                      </BarChart>
                  </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-slate-500">Sem dados.</div>}
          </div>
        </Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
          <Select label="Filtrar por tipo" id="filterType" value={filterType} onChange={(e) => setFilterType(e.target.value)}><option value="">Todos</option><option value="entrada">Entrada</option><option value="saida">Saída</option></Select>
          <Select label="Filtrar por Site" id="filterSite" value={filterSite} onChange={(e) => setFilterSite(e.target.value)}><option value="">Todos os Sites</option>{sites.map(site => (<option key={site} value={site}>{site}</option>))}</Select>
          <Select label="Filtrar por Setor" id="filterSector" value={filterSector} onChange={(e) => setFilterSector(e.target.value)}><option value="">Todos os Setores</option>{sectors.map(sector => (<option key={sector} value={sector}>{sector}</option>))}</Select>
          <Select label="Filtrar por Produto" id="filterProduct" value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}><option value="">Todos os Produtos</option>{productOptions.map(prod => (<option key={prod} value={prod}>{prod}</option>))}</Select>
        </div>
        <div className="flex flex-wrap gap-2 justify-end items-center border-t border-slate-200 dark:border-slate-700 pt-4">
            <span className="text-sm text-slate-600 dark:text-slate-400 mr-auto">Importe múltiplas transações. <button onClick={handleDownloadTemplate} className="text-sm text-emerald-600 font-semibold hover:underline">Baixar modelo.</button></span>
            <Button onClick={handleImportClick} variant="secondary">Importar Planilha (CSV/Excel)</Button>
            <Button onClick={handleExportCSV} variant="secondary">Exportar CSV</Button>
            <Button onClick={handleExportPDF} variant="secondary">Exportar PDF</Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv, .xlsx, .xls" />
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 mt-6">
          <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-100 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold text-center">Tipo</th>
                <th className="px-4 py-3 font-semibold">Site</th>
                <th className="px-4 py-3 font-semibold">Produto</th>
                <th className="px-4 py-3 font-semibold text-right">Qtd</th>
                <th className="px-4 py-3 font-semibold text-right">Vlr. Unit.</th>
                <th className="px-4 py-3 font-semibold">Ticket</th>
                <th className="px-4 py-3 font-semibold">Setor</th>
                <th className="px-4 py-3 font-semibold">NF</th>
                <th className="px-4 py-3 font-semibold">Nº Série</th>
                <th className="px-4 py-3 font-semibold">Responsável</th>
                <th className="px-4 py-3 font-semibold">Obs</th>
                {(canEdit || canDelete) && <th className="px-4 py-3 font-semibold text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-4 whitespace-nowrap">{formatDateToBR(t.date)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 min-w-[65px] rounded-md text-[9px] font-black uppercase tracking-tight text-white border-t border-white/20 border-b-2 shadow-lg transition-all duration-300 ${
                      t.type === 'entrada' 
                        ? 'bg-gradient-to-b from-[#00ffa3] to-[#00c853] border-[#008d3a] shadow-[0_0_8px_rgba(0,255,163,0.5)]' 
                        : 'bg-gradient-to-b from-[#ff5f6d] to-[#ff1744] border-[#b91c1c] shadow-[0_0_8px_rgba(255,23,68,0.5)]'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-4">{t.site}</td>
                  <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{t.productName}</td>
                  <td className="px-4 py-4 text-right font-semibold">{t.quantity}</td>
                  <td className="px-4 py-4 text-right">{(t.unitPrice ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-4">{t.ticket}</td>
                  <td className="px-4 py-4">{t.sector}</td>
                  <td className="px-4 py-4">{t.invoiceNumber}</td>
                  <td className="px-4 py-4">{t.serialNumber}</td>
                  <td className="px-4 py-4">{t.responsible}</td>
                  <td className="px-4 py-4 max-w-[150px] truncate" title={t.observation}>{t.observation}</td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-4 text-center">
                      <div className="flex gap-1 justify-center">
                          {canEdit && <button onClick={() => onEdit(t)} className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>}
                          {canDelete && <button onClick={() => setConfirmingDelete(t)} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && <p className="text-center text-slate-500 mt-6">Sem dados para os filtros.</p>}
      </Card>
    </div>
  );
};

export default TransactionHistory;
