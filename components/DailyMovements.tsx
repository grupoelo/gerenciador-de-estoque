
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, Site, Sector, User } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';

const CogIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
import { ManageSitesModal } from './ManageSitesModal';
import { ManageProductsModal } from './ManageProductsModal';
import { ManageSectorsModal } from './ManageSectorsModal';


interface DailyMovementsProps {
  onAddTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  transactionToEdit: Transaction | null;
  onCancelEdit: () => void;
  addLogEntry: (action: string, site?: string) => void;
  stockBalance: { [key: string]: { [key: string]: number } };
  sites: Site[];
  setSites: React.Dispatch<React.SetStateAction<Site[]>>;
  products: string[];
  setProducts: React.Dispatch<React.SetStateAction<string[]>>;
  sectors: string[];
  setSectors: React.Dispatch<React.SetStateAction<string[]>>;
  responsibles: string[];
  setResponsibles: React.Dispatch<React.SetStateAction<string[]>>;
  users: User[];
  transactions: Transaction[];
  authenticatedUser: User | null;
}

import { toTitleCase, getUserNameFromEmail } from '../utils/helpers';

const DailyMovements: React.FC<DailyMovementsProps> = ({
  onAddTransaction,
  onUpdateTransaction,
  transactionToEdit,
  onCancelEdit,
  addLogEntry,
  stockBalance,
  sites,
  setSites,
  products,
  setProducts,
  sectors,
  setSectors,
  responsibles,
  setResponsibles,
  users,
  transactions,
  authenticatedUser
}) => {
  const isEditing = !!transactionToEdit;
  const isAdmin = authenticatedUser?.role === 'Administrador' || authenticatedUser?.role === 'Super Admin';
  const isOperator = !isAdmin;
  const isSiteSelectionLocked = isOperator && authenticatedUser?.site !== 'Todos';

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>('saida');
  const [site, setSite] = useState<Site>(isSiteSelectionLocked && authenticatedUser?.site !== 'Todos' ? authenticatedUser.site : (sites.length > 0 ? sites[0] : ''));
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [observation, setObservation] = useState('');
  const [responsible, setResponsible] = useState('');
  const [ticket, setTicket] = useState('');
  const [sector, setSector] = useState<Sector>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [currentStock, setCurrentStock] = useState<number | null>(null);

  const [isSitesModalOpen, setIsSitesModalOpen] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [isSectorsModalOpen, setIsSectorsModalOpen] = useState(false);

  // Lógica de filtragem de setores baseada no tipo de transação e usuário logado
  const availableSectors = useMemo(() => {
    if (type === 'entrada') {
      // Lista de Entradas sugerida (fixa por regras de negócio)
      const fullEntryList = ['Sala Conecta', 'Sala Est.Slz Dunas', 'Sala Est.Slz Ilha', 'Sala Est.RJ', 'Sala Est.SP'];

      if (isAdmin || authenticatedUser?.site === 'Todos') {
        return fullEntryList;
      }

      const userSite = (authenticatedUser?.site || '').toUpperCase();
      if (userSite.includes('DUNAS')) return ['Sala Conecta', 'Sala Est.Slz Dunas'];
      if (userSite.includes('ILHA')) return ['Sala Est.Slz Ilha'];
      if (userSite.includes('RIO')) return ['Sala Est.RJ'];
      if (userSite.includes('SÃO PAULO') || userSite.includes('SP')) return ['Sala Est.SP'];

      return []; // Outros sites não mapeados
    } else {
      // Lógica de Saídas (conforme comportamento anterior)
      if (isAdmin || authenticatedUser?.site === 'Todos') {
        return sectors;
      }
      const userSiteKey = authenticatedUser?.site.toUpperCase() || "";
      return sectors.filter(s => s.toUpperCase().includes(userSiteKey));
    }
  }, [sectors, isAdmin, authenticatedUser, type]);

  const isSerialNumberEnabled = useMemo(() => {
    return type === 'saida';
  }, [type]);

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setType('saida');
    setSite(isSiteSelectionLocked && authenticatedUser?.site !== 'Todos' ? authenticatedUser.site : (sites.length > 0 ? sites[0] : ''));
    setProductName('');
    setQuantity(1);
    setUnitPrice(0);
    setObservation('');
    setTicket('');
    setInvoiceNumber('');
    setSerialNumber('');
    setError(null);
  };

  useEffect(() => {
    if (authenticatedUser?.email) {
      setResponsible(getUserNameFromEmail(authenticatedUser.email));
    }
  }, [authenticatedUser]);

  useEffect(() => {
    if (transactionToEdit) {
      setDate(transactionToEdit.date);
      setType(transactionToEdit.type);
      setSite(transactionToEdit.site);
      setProductName(transactionToEdit.productName);
      setQuantity(transactionToEdit.quantity);
      setUnitPrice(transactionToEdit.unitPrice);
      setObservation(transactionToEdit.observation);
      setTicket(transactionToEdit.ticket);
      setSector(transactionToEdit.sector);
      setInvoiceNumber(transactionToEdit.invoiceNumber);
      setSerialNumber(transactionToEdit.serialNumber);
    } else {
      resetForm();
    }
  }, [transactionToEdit, authenticatedUser, sites]);

  useEffect(() => {
    if (!isSerialNumberEnabled) {
      setSerialNumber('');
    }
  }, [isSerialNumberEnabled]);

  // Sincroniza o setor selecionado com a lista disponível quando o tipo de transação ou usuário mudam
  useEffect(() => {
    if (availableSectors.length > 0) {
      if (!availableSectors.includes(sector)) {
        setSector(availableSectors[0]);
      }
    } else {
      setSector('');
    }
  }, [availableSectors, sector]);

  useEffect(() => {
    if (sites.length > 0 && !sites.includes(site)) {
      setSite(sites[0]);
    } else if (sites.length === 0) {
      setSite('');
    }
  }, [sites, site]);

  useEffect(() => {
    if (productName && site) {
      const productKey = Object.keys(stockBalance[site] || {}).find(k => k.toLowerCase() === productName.toLowerCase())
      const stock = productKey ? stockBalance[site][productKey] : 0;
      setCurrentStock(stock);
    } else {
      setCurrentStock(null);
    }

    if (type === 'saida' && productName && site) {
      const productEntriesForSite = transactions.filter(t =>
        t.type === 'entrada' &&
        t.productName.toLowerCase() === productName.toLowerCase() &&
        t.site === site
      );

      if (productEntriesForSite.length > 0) {
        const totalValue = productEntriesForSite.reduce((acc, t) => acc + t.totalPrice, 0);
        const totalQuantity = productEntriesForSite.reduce((acc, t) => acc + t.quantity, 0);
        setUnitPrice(totalQuantity > 0 ? totalValue / totalQuantity : 0);
      } else {
        const allProductEntries = transactions.filter(t =>
          t.type === 'entrada' &&
          t.productName.toLowerCase() === productName.toLowerCase()
        );

        if (allProductEntries.length > 0) {
          const totalValue = allProductEntries.reduce((acc, t) => acc + t.totalPrice, 0);
          const totalQuantity = allProductEntries.reduce((acc, t) => acc + t.quantity, 0);
          setUnitPrice(totalQuantity > 0 ? totalValue / totalQuantity : 0);
        } else {
          setUnitPrice(0);
        }
      }
    } else if (type === 'entrada' && !isEditing) {
      setUnitPrice(0);
    }
  }, [productName, site, type, stockBalance, transactions, isEditing]);


  useEffect(() => {
    if (type === 'entrada' && !isEditing) {
      setTicket('');
    }
  }, [type, isEditing]);

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '');

    if (digits) {
      const cents = parseInt(digits, 10);
      setUnitPrice(cents / 100);
    } else {
      setUnitPrice(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isSaida = type === 'saida';

    if (!productName || quantity === '' || quantity <= 0 || !responsible || !date || !site || (isSaida && !ticket) || (availableSectors.length > 0 && !sector)) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (type === 'saida') {
      const originalQuantity = isEditing ? transactionToEdit.quantity : 0;
      const siteBalance = stockBalance[site] || {};
      const productKey = Object.keys(siteBalance).find(k => k.toLowerCase() === productName.toLowerCase());
      const currentStock = productKey ? siteBalance[productKey] : 0;
      const availableStock = currentStock + (isEditing && transactionToEdit.type === 'saida' && transactionToEdit.productName.toLowerCase() === productName.toLowerCase() ? originalQuantity : 0);

      if (Number(quantity) > availableStock) {
        setError(`Estoque insuficiente para "${productName}" em ${site}. Disponível para movimentação: ${availableStock}`);
        return;
      }
    }

    const transactionData = {
      id: isEditing ? transactionToEdit.id : new Date().toISOString() + Math.random(),
      date,
      type,
      site,
      productName: toTitleCase(productName),
      quantity: Number(quantity),
      unitPrice,
      totalPrice: Number(quantity) * unitPrice,
      observation,
      responsible: responsible,
      ticket,
      sector: sector || 'N/A',
      invoiceNumber,
      serialNumber: isSerialNumberEnabled ? serialNumber : '',
    };

    if (isEditing) {
      onUpdateTransaction(transactionData);
    } else {
      onAddTransaction(transactionData);
      resetForm();
    }
  };

  const inputClasses = "flex-grow w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 dark:text-slate-100";
  const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
  const iconButtonClasses = "p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600/50 text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed";


  return (
    <>
      {isSitesModalOpen && <ManageSitesModal sites={sites} setSites={setSites} onClose={() => setIsSitesModalOpen(false)} addLogEntry={addLogEntry} />}
      {isProductsModalOpen && <ManageProductsModal products={products} setProducts={setProducts} onClose={() => setIsProductsModalOpen(false)} addLogEntry={addLogEntry} />}
      {isSectorsModalOpen && <ManageSectorsModal sectors={sectors} setSectors={setSectors} onClose={() => setIsSectorsModalOpen(false)} addLogEntry={addLogEntry} />}

      <Card>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          {isEditing ? 'Editar Movimentação' : 'Registrar Movimentação'}
        </h2>

        {currentStock !== null && (
          <div className="bg-sky-100 dark:bg-sky-900/50 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200 px-4 py-3 rounded-md mb-5 text-sm" role="status">
            Saldo atual para <strong>{toTitleCase(productName)}</strong> em <strong>{site}</strong>: <span className="font-bold text-base">{currentStock}</span>
          </div>
        )}

        {error && <p className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-4" role="alert">{error}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-6 gap-x-4 gap-y-5">

          <div className="col-span-6 sm:col-span-2">
            <Input
              label="Data"
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="col-span-6 sm:col-span-2">
            <Select
              label="Entrada/Saída"
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              required
            >
              <option value="saida">Saída</option>
              <option value="entrada">Entrada</option>
            </Select>
          </div>

          <div className="col-span-6 sm:col-span-2">
            <label htmlFor="site" className={labelClasses}>Site</label>
            <div className="flex items-center gap-2">
              <select id="site" value={site} onChange={(e) => setSite(e.target.value as Site)} required className={`${inputClasses} ${isSiteSelectionLocked ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`} disabled={sites.length === 0 || isSiteSelectionLocked}>
                {sites.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              <button type="button" onClick={() => setIsSitesModalOpen(true)} className={iconButtonClasses} title="Gerenciar Sites" aria-label="Gerenciar Sites" disabled={isSiteSelectionLocked}>
                <CogIcon />
              </button>
            </div>
          </div>

          <div className="col-span-6 sm:col-span-4">
            <label htmlFor="productName" className={labelClasses}>Produto</label>
            <div className="flex items-center gap-2">
              <input
                id="productName"
                type="text"
                list="product-list"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Headsets"
                required
                className={inputClasses}
              />
              <datalist id="product-list">
                {products.map(p => <option key={p} value={p} />)}
              </datalist>
              <button type="button" onClick={() => setIsProductsModalOpen(true)} className={iconButtonClasses} title="Gerenciar Produtos" aria-label="Gerenciar Produtos">
                <CogIcon />
              </button>
            </div>
          </div>

          <div className="col-span-6 sm:col-span-2">
            <Input
              label="Qtd"
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              min="1"
              required
            />
          </div>

          <div className="col-span-6 sm:col-span-3">
            <Input
              label="Valor Unitário"
              id="unitPrice"
              type="text"
              value={unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              onChange={handleUnitPriceChange}
              placeholder="R$ 0,00"
              required
              readOnly={type === 'saida'}
              className={type === 'saida' ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}
            />
          </div>
          <div className="col-span-6 sm:col-span-3">
            <Input
              label="Valor Total"
              id="totalPrice"
              type="text"
              value={(Number(quantity) * unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              readOnly
              className="focus:ring-transparent focus:border-slate-300 dark:focus:border-slate-600 cursor-default bg-slate-100 dark:bg-slate-800"
            />
          </div>

          <div className="col-span-6 sm:col-span-3">
            <Input
              label="Ticket"
              id="ticket"
              type="text"
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              placeholder="Ex: 266903"
              required={type === 'saida'}
              disabled={type === 'entrada'}
              className={type === 'entrada' ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}
            />
          </div>

          <div className="col-span-6 sm:col-span-3">
            <label htmlFor="sector" className={labelClasses}>Setor/Operação</label>
            <div className="flex items-center gap-2">
              <select
                id="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value as Sector)}
                required={availableSectors.length > 0}
                className={inputClasses}
                disabled={availableSectors.length === 0}
              >
                {availableSectors.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              {/* Botão de gerenciar oculto para Entradas pois a lista é fixa nestas condições */}
              <button
                type="button"
                onClick={() => setIsSectorsModalOpen(true)}
                className={`${iconButtonClasses} ${type === 'entrada' ? 'hidden' : ''}`}
                title="Gerenciar Setores"
                aria-label="Gerenciar Setores"
              >
                <CogIcon />
              </button>
            </div>
          </div>

          <div className="col-span-6 sm:col-span-2">
            <Input
              label="Nota Fiscal"
              id="invoiceNumber"
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Ex: 123456"
            />
          </div>
          <div className="col-span-6 sm:col-span-2">
            <Input
              label="Nº de Série"
              id="serialNumber"
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Ativos específicos"
              disabled={!isSerialNumberEnabled}
              className={!isSerialNumberEnabled ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}
            />
          </div>
          <div className="col-span-6 sm:col-span-2">
            <Input
              label="Observação"
              id="observation"
              type="text"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: item com defeito"
            />
          </div>

          <div className="col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <Input
                label="Responsável Lançamento"
                id="responsible"
                value={responsible}
                readOnly
                required
                className="cursor-default bg-slate-100 dark:bg-slate-800"
              />
            </div>
            <div className="flex items-center gap-4">
              {isEditing && (
                <Button type="button" variant="secondary" onClick={onCancelEdit} className="w-full justify-center">
                  Cancelar
                </Button>
              )}
              <Button type="submit" className="w-full justify-center !py-3 !text-base">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                {isEditing ? 'Salvar Alterações' : 'Registrar Movimentação'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </>
  );
};

export default DailyMovements;
