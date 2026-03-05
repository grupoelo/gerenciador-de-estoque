import React, { useState } from 'react';
import { InventoryItem, Sector, Site, User, ControllableView } from '../types';
import { Button } from './ui/Button';
import InventoryList from './InventoryList';
import { InventoryForm } from './InventoryForm';

interface InventoryProps {
    items: InventoryItem[];
    onAddItem: (item: InventoryItem) => void;
    onUpdateItem: (item: InventoryItem) => void;
    onDeleteItem: (id: string) => void;
    addLogEntry: (action: string, site?: string) => void;
    sites: Site[];
    authenticatedUser: User | null;
    hasPermission: (user: User | null, view: ControllableView, action: 'canEdit' | 'canDelete') => boolean;
    // Props for manageable options
    inventoryTypes: string[];
    setInventoryTypes: React.Dispatch<React.SetStateAction<string[]>>;
    models: string[];
    setModels: React.Dispatch<React.SetStateAction<string[]>>;
    manufacturers: string[];
    setManufacturers: React.Dispatch<React.SetStateAction<string[]>>;
    statuses: string[];
    setStatuses: React.Dispatch<React.SetStateAction<string[]>>;
    sectors: Sector[];
    setSectors: React.Dispatch<React.SetStateAction<Sector[]>>;
    operatingSystems: string[];
    setOperatingSystems: React.Dispatch<React.SetStateAction<string[]>>;
    memoryOptions: string[];
    setMemoryOptions: React.Dispatch<React.SetStateAction<string[]>>;
    processorOptions: string[];
    setProcessorOptions: React.Dispatch<React.SetStateAction<string[]>>;
    storageOptions: string[];
    setStorageOptions: React.Dispatch<React.SetStateAction<string[]>>;
}

const Inventory: React.FC<InventoryProps> = (props) => {
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    const handleEditItem = (item: InventoryItem) => {
        setEditingItem(item);
        setShowForm(true);
    };

    const handleFormSubmit = (item: InventoryItem) => {
        if (editingItem) {
            props.onUpdateItem(item);
        } else {
            props.onAddItem(item);
        }
        setShowForm(false);
        setEditingItem(null);
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingItem(null);
    };

    const handleShowForm = () => {
        setEditingItem(null);
        setShowForm(true);
    };
    
    const canAddItem = props.hasPermission(props.authenticatedUser, 'inventario', 'canEdit');

    return (
        <div className="space-y-8">
            {showForm ? (
                <InventoryForm 
                    itemToEdit={editingItem}
                    onSave={handleFormSubmit} 
                    onCancel={handleCancelForm}
                    {...props}
                />
            ) : (
                <>
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Inventário de Ativos</h2>
                        {canAddItem && (
                            <Button onClick={handleShowForm}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Novo Registo
                            </Button>
                        )}
                    </div>
                    <InventoryList 
                        items={props.items} 
                        onEdit={handleEditItem}
                        onDelete={props.onDeleteItem}
                        authenticatedUser={props.authenticatedUser}
                        hasPermission={props.hasPermission}
                    />
                </>
            )}
        </div>
    );
};

export default Inventory;
