import React, { useState, useEffect } from 'react';
import { InventoryItem, Sector, Site } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';

import { ManageInventoryTypesModal } from './ManageInventoryTypesModal';
import { ManageModelsModal } from './ManageModelsModal';
import { ManageManufacturersModal } from './ManageManufacturersModal';
import { ManageStatusesModal } from './ManageStatusesModal';
import { ManageSectorsModal } from './ManageSectorsModal';
import { ManageOperatingSystemsModal } from './ManageOperatingSystemsModal';
import { ManageMemoryOptionsModal } from './ManageMemoryOptionsModal';
import { ManageProcessorOptionsModal } from './ManageProcessorOptionsModal';
import { ManageStorageOptionsModal } from './ManageStorageOptionsModal';

const CogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const toTitleCase = (str: string): string => {
    if (!str) return '';
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
};
  
interface InventoryFormProps {
    itemToEdit?: InventoryItem | null;
    onSave: (item: InventoryItem) => void;
    onCancel: () => void;
    addLogEntry: (action: string, site?: string) => void;
    sites: Site[];
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

const getInitialState = (sites: Site[], sectors: Sector[]): Omit<InventoryItem, 'id'> => ({
    type: '', model: '', manufacturer: '', serialNumber: '', manufactureDate: new Date().toISOString().split('T')[0],
    usageTime: '', value: 0, status: '', 
    site: sites.length > 0 ? sites[0] : '',
    sector: sectors.length > 0 ? sectors[0] : '', 
    operatingSystem: '', memory: '', processor: '', storage: ''
});


export const InventoryForm: React.FC<InventoryFormProps> = (props) => {
    const { itemToEdit } = props;
    const [item, setItem] = useState<Omit<InventoryItem, 'id'>>(() => 
        itemToEdit ? { ...itemToEdit } : getInitialState(props.sites, props.sectors)
    );
    
    useEffect(() => {
        if (itemToEdit) {
            setItem({ ...itemToEdit });
        } else {
            setItem(getInitialState(props.sites, props.sectors));
        }
    }, [itemToEdit, props.sites, props.sectors]);


    const [isModalOpen, setIsModalOpen] = useState({
        types: false, models: false, manufacturers: false, statuses: false, sectors: false,
        operatingSystems: false, memory: false, processors: false, storage: false
    });
    
    useEffect(() => {
      if (props.sectors.length > 0 && !props.sectors.includes(item.sector)) {
          setItem(prev => ({...prev, sector: props.sectors[0]}));
      } else if (props.sectors.length === 0) {
          setItem(prev => ({...prev, sector: ''}));
      }
    }, [props.sectors, item.sector]);
    
     useEffect(() => {
      if (props.sites.length > 0 && !props.sites.includes(item.site)) {
          setItem(prev => ({...prev, site: props.sites[0]}));
      } else if (props.sites.length === 0) {
          setItem(prev => ({...prev, site: ''}));
      }
    }, [props.sites, item.site]);

    useEffect(() => {
        if (item.manufactureDate) {
          const manufacture = new Date(item.manufactureDate);
          // Adjust for timezone issues where new Date('YYYY-MM-DD') can be the day before in some timezones.
          manufacture.setUTCHours(0, 0, 0, 0);
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
  
          if (isNaN(manufacture.getTime()) || manufacture > today) {
            setItem(prev => ({ ...prev, usageTime: 'Data inválida' }));
            return;
          }
  
          let years = today.getFullYear() - manufacture.getFullYear();
          let months = today.getMonth() - manufacture.getMonth();
          
          if (months < 0 || (months === 0 && today.getDate() < manufacture.getDate())) {
              years--;
              months = months < 0 ? months + 12 : 11;
          }
  
          const parts = [];
          if (years > 0) {
            parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
          }
          if (months > 0) {
            parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
          }
  
          if (parts.length === 0) {
             setItem(prev => ({ ...prev, usageTime: 'Menos de um mês' }));
          } else {
             setItem(prev => ({ ...prev, usageTime: parts.join(' e ') }));
          }
  
        } else {
          setItem(prev => ({ ...prev, usageTime: '' }));
        }
      }, [item.manufactureDate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setItem(prev => ({ ...prev, [name]: value }));
    };
    
    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const digits = rawValue.replace(/\D/g, '');
        const value = digits ? parseInt(digits, 10) / 100 : 0;
        setItem(prev => ({ ...prev, value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const itemToSave: InventoryItem = {
            id: itemToEdit ? itemToEdit.id : new Date().toISOString() + Math.random(),
            ...item,
            type: toTitleCase(item.type),
            manufacturer: toTitleCase(item.manufacturer),
            status: toTitleCase(item.status),
        };
        props.onSave(itemToSave);
    };

    const inputClasses = "flex-grow w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 dark:text-slate-100";
    const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
    const iconButtonClasses = "p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600/50 text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex-shrink-0";
    
    const renderManageableInput = (label: string, name: keyof Omit<InventoryItem, 'id' | 'value'>, listId: string, options: string[], onManageClick: () => void, required: boolean = false) => (
        <div>
            <label htmlFor={name} className={labelClasses}>{label}</label>
            <div className="flex items-center gap-2">
                {/* FIX: Cast item[name] to string to resolve TypeScript error where it couldn't guarantee the type was a string. */}
                <input id={name} name={name} type="text" list={listId} value={item[name] as string} onChange={handleInputChange} required={required} className={inputClasses} autoComplete="off" />
                <datalist id={listId}>
                    {options.map(o => <option key={o} value={o} />)}
                </datalist>
                <button type="button" onClick={onManageClick} className={iconButtonClasses} title={`Gerenciar ${label}`} aria-label={`Gerenciar ${label}`}>
                    <CogIcon />
                </button>
            </div>
        </div>
    );

    return (
        <>
        {isModalOpen.types && <ManageInventoryTypesModal inventoryTypes={props.inventoryTypes} setInventoryTypes={props.setInventoryTypes} onClose={() => setIsModalOpen(p => ({...p, types: false}))} addLogEntry={props.addLogEntry} />}
        {isModalOpen.models && <ManageModelsModal models={props.models} setModels={props.setModels} onClose={() => setIsModalOpen(p => ({...p, models: false}))} addLogEntry={props.addLogEntry} />}
        {isModalOpen.manufacturers && <ManageManufacturersModal manufacturers={props.manufacturers} setManufacturers={props.setManufacturers} onClose={() => setIsModalOpen(p => ({...p, manufacturers: false}))} addLogEntry={props.addLogEntry} />}
        {isModalOpen.statuses && <ManageStatusesModal statuses={props.statuses} setStatuses={props.setStatuses} onClose={() => setIsModalOpen(p => ({...p, statuses: false}))} addLogEntry={props.addLogEntry} />}
        {isModalOpen.sectors && <ManageSectorsModal sectors={props.sectors} setSectors={props.setSectors} onClose={() => setIsModalOpen(p => ({...p, sectors: false}))} addLogEntry={props.addLogEntry} />}
        {isModalOpen.operatingSystems && <ManageOperatingSystemsModal operatingSystems={props.operatingSystems} setOperatingSystems={props.setOperatingSystems} onClose={() => setIsModalOpen(p => ({...p, operatingSystems: false}))} addLogEntry={props.addLogEntry} />}
        {isModalOpen.memory && <ManageMemoryOptionsModal memoryOptions={props.memoryOptions} setMemoryOptions={props.setMemoryOptions} onClose={() => setIsModalOpen(p => ({...p, memory: false}))} addLogEntry={props.addLogEntry} />}
        {isModalOpen.processors && <ManageProcessorOptionsModal processorOptions={props.processorOptions} setProcessorOptions={props.setProcessorOptions} onClose={() => setIsModalOpen(p => ({...p, processors: false}))} addLogEntry={props.addLogEntry} />}
        {isModalOpen.storage && <ManageStorageOptionsModal storageOptions={props.storageOptions} setStorageOptions={props.setStorageOptions} onClose={() => setIsModalOpen(p => ({...p, storage: false}))} addLogEntry={props.addLogEntry} />}

        <Card>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                {itemToEdit ? 'Editar Item de Inventário' : 'Registrar Novo Item de Inventário'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderManageableInput('Tipo', 'type', 'type-list', props.inventoryTypes, () => setIsModalOpen(p => ({...p, types: true})), true)}
                {renderManageableInput('Modelo', 'model', 'model-list', props.models, () => setIsModalOpen(p => ({...p, models: true})), true)}
                {renderManageableInput('Fabricante', 'manufacturer', 'manufacturer-list', props.manufacturers, () => setIsModalOpen(p => ({...p, manufacturers: true})), true)}
                <Input label="Nº Série" id="serialNumber" name="serialNumber" value={item.serialNumber} onChange={handleInputChange} required />
                 <div className="md:col-span-1">
                    <Select label="Site" id="site" name="site" value={item.site} onChange={handleInputChange} required>
                       {props.sites.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                 </div>
                 <div>
                    <label htmlFor="sector" className={labelClasses}>Setor/Operação</label>
                    <div className="flex items-center gap-2">
                        <select id="sector" name="sector" value={item.sector} onChange={handleInputChange} required className={inputClasses}>
                            {props.sectors.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button type="button" onClick={() => setIsModalOpen(p => ({...p, sectors: true}))} className={iconButtonClasses} title="Gerenciar Setores">
                            <CogIcon />
                        </button>
                    </div>
                </div>
                <Input label="Data Fabricação" id="manufactureDate" name="manufactureDate" type="date" value={item.manufactureDate} onChange={handleInputChange} />
                <Input label="Tempo de uso" id="usageTime" name="usageTime" value={item.usageTime} readOnly className="cursor-not-allowed bg-slate-100 dark:bg-slate-800" />
                <Input label="Valor" id="value" name="value" type="text" value={item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} onChange={handleValueChange} />
                {renderManageableInput('Status', 'status', 'status-list', props.statuses, () => setIsModalOpen(p => ({...p, statuses: true})), true)}
               
                {renderManageableInput('S.Oper.', 'operatingSystem', 'os-list', props.operatingSystems, () => setIsModalOpen(p => ({...p, operatingSystems: true})))}
                {renderManageableInput('Memória', 'memory', 'memory-list', props.memoryOptions, () => setIsModalOpen(p => ({...p, memory: true})))}
                {renderManageableInput('Processador', 'processor', 'processor-list', props.processorOptions, () => setIsModalOpen(p => ({...p, processors: true})))}
                {renderManageableInput('Armazenamento', 'storage', 'storage-list', props.storageOptions, () => setIsModalOpen(p => ({...p, storage: true})))}
                
                <div className="md:col-span-3 flex justify-end gap-4 mt-4">
                    <Button type="button" variant="secondary" onClick={props.onCancel}>Cancelar</Button>
                    <Button type="submit">{itemToEdit ? 'Salvar Alterações' : 'Salvar Registo'}</Button>
                </div>
            </form>
        </Card>
        </>
    );
};