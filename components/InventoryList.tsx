
import React, { useState } from 'react';
import { InventoryItem, User, ControllableView } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface InventoryListProps {
    items: InventoryItem[];
    onEdit: (item: InventoryItem) => void;
    onDelete: (id: string) => void;
    authenticatedUser: User | null;
    hasPermission: (user: User | null, view: ControllableView, action: 'canEdit' | 'canDelete') => boolean;
}

const formatDateToBR = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) return `${day}/${month}/${year}`;
    return new Date(dateStr).toLocaleDateString('pt-BR');
};

const InventoryList: React.FC<InventoryListProps> = ({ items, onEdit, onDelete, authenticatedUser, hasPermission }) => {
    const [confirmingDelete, setConfirmingDelete] = useState<InventoryItem | null>(null);
    const sortedItems = [...items].reverse();
    const canEdit = hasPermission(authenticatedUser, 'inventario', 'canEdit');
    const canDelete = hasPermission(authenticatedUser, 'inventario', 'canDelete');

    const requestDelete = (item: InventoryItem) => setConfirmingDelete(item);
    const confirmDelete = () => {
        if (confirmingDelete) {
            onDelete(confirmingDelete.id);
            setConfirmingDelete(null);
        }
    };

    return (
        <Card className="relative">
             {confirmingDelete && (
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl" onClick={() => setConfirmingDelete(null)}>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full mx-4 border border-slate-200/80 dark:border-slate-700/60" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar Exclusão</h3>
                        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                            Excluir item <strong className="text-slate-800 dark:text-slate-200">{`${confirmingDelete.type} ${confirmingDelete.model}`}</strong>?
                        </p>
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button variant="secondary" onClick={() => setConfirmingDelete(null)}>Cancelar</Button>
                            <Button onClick={confirmDelete} className="!bg-red-600 hover:!bg-red-700 text-white">Confirmar Exclusão</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-100 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400 uppercase">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Tipo</th>
                            <th className="px-6 py-3 font-semibold">Modelo</th>
                            <th className="px-6 py-3 font-semibold">Nº Série</th>
                            <th className="px-6 py-3 font-semibold">Site</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3 font-semibold text-right">Valor</th>
                            <th className="px-6 py-3 font-semibold">Data Fab.</th>
                            <th className="px-6 py-3 font-semibold">Uso</th>
                            <th className="px-6 py-3 font-semibold">Fabricante</th>
                            {(canEdit || canDelete) && <th className="px-6 py-3 font-semibold text-center">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sortedItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.type}</td>
                                <td className="px-6 py-4">{item.model}</td>
                                <td className="px-6 py-4">{item.serialNumber}</td>
                                <td className="px-6 py-4">{item.site}</td>
                                <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200 dark:bg-slate-600">{item.status}</span></td>
                                <td className="px-6 py-4 text-right">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{formatDateToBR(item.manufactureDate)}</td>
                                <td className="px-6 py-4">{item.usageTime}</td>
                                <td className="px-6 py-4">{item.manufacturer}</td>
                                {(canEdit || canDelete) && (
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex gap-2 justify-center">
                                            {canEdit && <button onClick={() => onEdit(item)} className="p-1 text-slate-400 hover:text-sky-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>}
                                            {canDelete && <button onClick={() => requestDelete(item)} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {items.length === 0 && <p className="text-center text-slate-500 py-6">Sem ativos.</p>}
        </Card>
    );
};

export default InventoryList;
