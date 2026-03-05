
import React, { useState, useMemo } from 'react';
import { LogEntry, Site } from '../types';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';

declare global {
    interface Window {
        jspdf: any;
    }
}

interface LogViewProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  sites: Site[];
  logoUrl: string | null;
}

export const LogView: React.FC<LogViewProps> = ({ logs, onClearLogs, sites, logoUrl }) => {
  const [filterText, setFilterText] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => filterSite ? log.site === filterSite : true)
      .filter(log => filterText ? 
        log.action.toLowerCase().includes(filterText.toLowerCase()) ||
        log.user.toLowerCase().includes(filterText.toLowerCase())
        : true);
  }, [logs, filterSite, filterText]);
  
  const handleConfirmClear = () => {
    onClearLogs();
    setIsConfirmingClear(false);
  }

  const handleExportPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    if (logoUrl) doc.addImage(logoUrl, 'PNG', margin, 10, 40, 15, undefined, 'FAST');
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text("LOG DE ATIVIDADES", pageWidth / 2, 20, { align: 'center' });
    const tableColumn = ["Data/Hora", "Usuário", "Site", "Ação / Descrição"];
    const tableRows = filteredLogs.map(log => [
      new Date(log.date).toLocaleString('pt-BR'),
      log.user,
      log.site,
      log.action
    ]);
    (doc as any).autoTable({
      head: [tableColumn], body: tableRows, startY: 40, theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }, // emerald-600 (VERDE MODERNO)
      styles: { font: 'helvetica', fontSize: 9 }
    });
    doc.save('log_de_atividades.pdf');
  };

  return (
    <>
      {isConfirmingClear && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsConfirmingClear(false)}>
          <Card className="max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar Limpeza</h3>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Deseja limpar todo o log de atividades?</p>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setIsConfirmingClear(false)}>Cancelar</Button>
              <Button onClick={handleConfirmClear} className="!bg-red-600 hover:!bg-red-700 text-white">Limpar Log</Button>
            </div>
          </Card>
        </div>
      )}

      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Log de Atividades</h2>
        <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-end">
                <Input label="Pesquisa Avançada" id="filterText" type="text" placeholder="Buscar..." value={filterText} onChange={(e) => setFilterText(e.target.value)} />
                <Select label="Filtrar por Site" id="filterSite" value={filterSite} onChange={(e) => setFilterSite(e.target.value)}><option value="">Todos</option>{[...sites, "Sistema"].sort().map(site => (<option key={site} value={site}>{site}</option>))}</Select>
                 <Button onClick={() => setIsConfirmingClear(true)} variant="secondary" className="!bg-amber-500/10 text-amber-600">Limpar Log</Button>
                <Button onClick={handleExportPDF} variant="secondary">Exportar PDF</Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                <thead className="bg-slate-100 dark:bg-slate-700/50 text-xs uppercase">
                <tr>
                    <th className="px-6 py-3 font-semibold">Data / Hora</th>
                    <th className="px-6 py-3 font-semibold">Usuário</th>
                    <th className="px-6 py-3 font-semibold">Site</th>
                    <th className="px-6 py-3 font-semibold">Ação / Descrição</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(log.date).toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4">{log.user}</td>
                        <td className="px-6 py-4">{log.site}</td>
                        <td className="px-6 py-4">{log.action}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
            {filteredLogs.length === 0 && <p className="text-center text-slate-500 mt-6">Sem registros.</p>}
        </Card>
      </div>
    </>
  );
};
