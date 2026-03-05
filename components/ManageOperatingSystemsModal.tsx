import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ManageOperatingSystemsModalProps {
  operatingSystems: string[];
  setOperatingSystems: React.Dispatch<React.SetStateAction<string[]>>;
  onClose: () => void;
  addLogEntry: (action: string, site?: string) => void;
}

export const ManageOperatingSystemsModal: React.FC<ManageOperatingSystemsModalProps> = ({ operatingSystems, setOperatingSystems, onClose, addLogEntry }) => {
    const [newItemName, setNewItemName] = useState('');
    const [editingItem, setEditingItem] = useState<{ index: number; name: string } | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<{ index: number; name: string } | null>(null);

    const handleAddItem = () => {
        const trimmedName = newItemName.trim();
        if (trimmedName && !operatingSystems.find(p => p.toLowerCase() === trimmedName.toLowerCase())) {
            setOperatingSystems(prev => [...prev, trimmedName].sort());
            addLogEntry(`Sistema Operacional de ativo adicionado: "${trimmedName}"`, 'Sistema');
            setNewItemName('');
        }
    };

    const handleUpdateItem = () => {
        if (editingItem && editingItem.name.trim()) {
            const oldName = operatingSystems[editingItem.index];
            const newName = editingItem.name.trim();
            const updatedItems = [...operatingSystems];
            updatedItems[editingItem.index] = newName;
            setOperatingSystems(updatedItems.sort());
            addLogEntry(`Sistema Operacional de ativo "${oldName}" renomeado para "${newName}"`, 'Sistema');
            setEditingItem(null);
        }
    };

    const requestDeleteItem = (index: number) => {
        setConfirmingDelete({ index, name: operatingSystems[index] });
    };

    const confirmDeleteItem = () => {
        if (confirmingDelete) {
            addLogEntry(`Sistema Operacional de ativo removido: "${confirmingDelete.name}"`, 'Sistema');
            setOperatingSystems(prevOS => prevOS.filter((_, index) => index !== confirmingDelete.index));
            setConfirmingDelete(null);
        }
    };

    const rawInputClasses = "flex-grow w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 dark:text-slate-100";

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <Card className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
                {confirmingDelete && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl" onClick={() => setConfirmingDelete(null)}>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border border-slate-200/80 dark:border-slate-700/60" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar Exclusão</h3>
                            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                                Você tem certeza que deseja excluir o sistema operacional <strong className="text-slate-800 dark:text-slate-200">{confirmingDelete.name}</strong>?
                            </p>
                            <div className="mt-4 text-sm bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 p-3 rounded-md border border-red-200 dark:border-red-500/30">
                                <p className="font-bold">ATENÇÃO:</p>
                                <p>Esta ação é irreversível e o S.O. será removido permanentemente.</p>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <Button variant="secondary" onClick={() => setConfirmingDelete(null)}>Cancelar</Button>
                                <Button onClick={confirmDeleteItem} className="!bg-red-600 hover:!bg-red-700 text-white focus:ring-red-500">
                                    Confirmar Exclusão
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Gerenciar S. Operacionais</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Adicionar Novo S.O.</h3>
                    <div className="flex gap-2 items-end">
                        <div className="flex-grow">
                            <Input
                                label="Nome do S.O."
                                id="newItem"
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                                placeholder="Ex: Windows 11 Pro"
                            />
                        </div>
                        <Button onClick={handleAddItem}>Adicionar</Button>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">S.O. Existentes</h3>
                    <div className="max-h-60 overflow-y-auto pr-2 -mr-2">
                        <ul className="space-y-2">
                        {operatingSystems.length > 0 ? operatingSystems.map((item, index) => (
                            <li key={item} className="flex items-center justify-between p-2 rounded-md bg-slate-100 dark:bg-slate-700/50">
                                {editingItem?.index === index ? (
                                    <input
                                        value={editingItem.name}
                                        onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                        onKeyDown={e => e.key === 'Enter' && handleUpdateItem()}
                                        className={rawInputClasses}
                                        autoFocus
                                    />
                                ) : (
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{item}</span>
                                )}
                                <div className="flex gap-2 ml-4 flex-shrink-0">
                                    {editingItem?.index === index ? (
                                        <>
                                            <Button onClick={handleUpdateItem} variant="primary" className="!p-2" title="Salvar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </Button>
                                            <Button onClick={() => setEditingItem(null)} variant="secondary" className="!p-2" title="Cancelar">
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button onClick={() => setEditingItem({ index, name: item })} variant="secondary" className="!p-2" title="Editar S.O.">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </Button>
                                            <Button onClick={() => requestDeleteItem(index)} variant="secondary" className="!p-2 !bg-red-500/10 hover:!bg-red-500/20 text-red-500" title="Excluir S.O.">
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </li>
                        )) : (
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">Nenhum S.O. cadastrado.</p>
                        )}
                        </ul>
                    </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                    <Button onClick={onClose} variant="secondary">Fechar</Button>
                </div>
            </Card>
        </div>
    );
};