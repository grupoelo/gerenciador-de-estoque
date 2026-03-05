
import React, { useState, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Sector } from '../types';

interface ManageSectorsModalProps {
  sectors: Sector[];
  setSectors: React.Dispatch<React.SetStateAction<Sector[]>>;
  onClose: () => void;
  addLogEntry: (action: string, site?: string) => void;
}

const toTitleCase = (str: string): string => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

export const ManageSectorsModal: React.FC<ManageSectorsModalProps> = ({ sectors, setSectors, onClose, addLogEntry }) => {
    const [newItemName, setNewItemName] = useState('');
    const [editingItem, setEditingItem] = useState<{ index: number; name: string } | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<{ index: number; name: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddItem = () => {
        const trimmedName = newItemName.trim();
        if (trimmedName && !sectors.find(s => s.toLowerCase() === trimmedName.toLowerCase())) {
            const newSector = toTitleCase(trimmedName);
            setSectors(prev => [...prev, newSector].sort());
            addLogEntry(`Setor adicionado: "${newSector}"`, 'Sistema');
            setNewItemName('');
        }
    };

    const handleUpdateItem = () => {
        if (editingItem && editingItem.name.trim()) {
            const oldName = sectors[editingItem.index];
            const newName = toTitleCase(editingItem.name.trim());
            const updatedItems = [...sectors];
            updatedItems[editingItem.index] = newName;
            setSectors(updatedItems.sort());
            addLogEntry(`Setor "${oldName}" renomeado para "${newName}"`, 'Sistema');
            setEditingItem(null);
        }
    };

    const confirmDeleteItem = () => {
        if (confirmingDelete) {
            addLogEntry(`Setor removido: "${confirmingDelete.name}"`, 'Sistema');
            setSectors(prevSectors => prevSectors.filter((_, index) => index !== confirmingDelete.index));
            setConfirmingDelete(null);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = "Setor";
        const exampleRow = "Recursos Humanos\nJurídico\nT.I";
        const csvContent = [headers, exampleRow].join("\n");
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", "modelo_importacao_setores.csv");
        link.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 1) return;

                let headerLine = lines[0].trim();
                if (headerLine.charCodeAt(0) === 0xFEFF) headerLine = headerLine.substring(1);
                const delimiter = headerLine.split(';').length > headerLine.split(',').length ? ';' : ',';
                const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ""));
                
                const sectorIndex = headers.findIndex(h => ['setor', 'nome', 'operacao', 'area'].includes(h));
                if (sectorIndex === -1) throw new Error('Coluna de identificação do setor não encontrada.');

                const newSectorsSet = new Set<string>();
                const currentSectorsLower = new Set(sectors.map(s => s.toLowerCase()));

                for (let i = 1; i < lines.length; i++) {
                    const rowData = lines[i].split(delimiter);
                    const nameRaw = (rowData[sectorIndex] || '').trim();
                    if (nameRaw) {
                        const name = toTitleCase(nameRaw);
                        if (!currentSectorsLower.has(name.toLowerCase())) newSectorsSet.add(name);
                    }
                }

                const toAdd = Array.from(newSectorsSet);
                if (toAdd.length > 0) {
                    setSectors(prev => [...prev, ...toAdd].sort());
                    addLogEntry(`${toAdd.length} novos setores importados.`, 'Sistema');
                    alert(`${toAdd.length} novos setores cadastrados com sucesso!`);
                } else {
                    alert('Nenhum setor novo encontrado no arquivo.');
                }
            } catch (err) {
                alert('Erro ao importar CSV: ' + (err as Error).message);
            }
        };
        reader.readAsText(file);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const rawInputClasses = "flex-grow w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 dark:text-slate-100";

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <Card className="relative w-full max-w-2xl bg-slate-800 border-slate-700" onClick={e => e.stopPropagation()}>
                {confirmingDelete && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-[110] flex items-center justify-center rounded-xl" onClick={() => setConfirmingDelete(null)}>
                        <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border border-slate-700" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-bold text-white">Confirmar Exclusão</h3>
                            <p className="mt-4 text-sm text-slate-400">Excluir o setor <strong className="text-white">{confirmingDelete.name}</strong>?</p>
                            <div className="mt-6 flex justify-end space-x-3">
                                <Button variant="secondary" onClick={() => setConfirmingDelete(null)}>Cancelar</Button>
                                <Button onClick={confirmDeleteItem} className="!bg-red-600 hover:!bg-red-700 text-white">Excluir</Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
                    <h2 className="text-2xl font-bold text-white">Gerenciar Setores</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-7 space-y-8">
                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-300">Adicionar Novo Setor</h3>
                            <div className="flex gap-2 items-end">
                                <div className="flex-grow">
                                    <Input label="Nome do Setor" id="newItem" value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddItem()} placeholder="Ex: Financeiro" className="bg-slate-700 border-slate-600 text-white" />
                                </div>
                                <Button onClick={handleAddItem} className="h-11">Adicionar</Button>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-300">Importar via CSV</h3>
                            <div className="bg-slate-700/30 p-5 rounded-lg border border-slate-700/50">
                                <button type="button" onClick={handleDownloadTemplate} className="text-sky-400 hover:text-sky-300 hover:underline text-sm font-semibold flex items-center gap-1 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Baixar modelo.
                                </button>
                                <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full justify-center !py-4 text-sm bg-slate-700 hover:bg-slate-600 text-white border-slate-600 border">
                                    Selecionar Arquivo CSV
                                </Button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                            </div>
                        </section>
                    </div>

                    <div className="md:col-span-5 flex flex-col h-[350px]">
                        <h3 className="text-lg font-semibold text-slate-300 mb-4">Setores Existentes ({sectors.length})</h3>
                        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar border border-slate-700 rounded-lg bg-slate-900/30">
                            <ul className="divide-y divide-slate-700">
                                {sectors.map((item, index) => (
                                    <li key={index} className="flex items-center justify-between p-3 hover:bg-slate-700/50">
                                        {editingItem?.index === index ? (
                                            <input value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleUpdateItem()} className="w-full px-2 py-1 bg-slate-800 border border-sky-500 rounded text-sm text-white" autoFocus />
                                        ) : (
                                            <span className="font-medium text-slate-200 text-sm truncate mr-2">{item}</span>
                                        )}
                                        <div className="flex gap-1 flex-shrink-0">
                                            {editingItem?.index === index ? (
                                                <button onClick={handleUpdateItem} className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                                            ) : (
                                                <>
                                                    <button onClick={() => setEditingItem({ index, name: item })} className="p-1.5 text-slate-400 hover:text-sky-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                    <button onClick={() => setConfirmingDelete({ index, name: item })} className="p-1.5 text-slate-400 hover:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                    <Button onClick={onClose} variant="secondary" className="bg-slate-700 hover:bg-slate-600 text-white border-none">Fechar</Button>
                </div>
            </Card>
        </div>
    );
};
