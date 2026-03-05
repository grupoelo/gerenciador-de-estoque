import React, { useState } from 'react';
// FIX: Removed SITES from import as it is not exported from '../types'.
import { Transaction, TransactionType, Site } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';

interface TransactionFormProps {
  type: TransactionType;
  onAddTransaction: (transaction: Transaction) => void;
  stockBalance: { [key: string]: { [key: string]: number } };
  // ADD: sites prop to provide the list of sites.
  sites: Site[];
}

// FIX: Receive and use 'sites' prop.
export const TransactionForm: React.FC<TransactionFormProps> = ({ type, onAddTransaction, stockBalance, sites }) => {
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  // FIX: Initialize site from the 'sites' prop.
  const [site, setSite] = useState<Site>(sites.length > 0 ? sites[0] : '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productName || quantity <= 0) {
      setError('Por favor, preencha todos os campos corretamente.');
      return;
    }
    
    if (type === 'saida') {
        const currentStock = stockBalance[site]?.[productName.toUpperCase()] ?? 0;
        if (quantity > currentStock) {
            setError(`Estoque insuficiente em ${site}. Disponível: ${currentStock}`);
            return;
        }
    }


    onAddTransaction({
      id: new Date().toISOString(),
      type,
      productName: productName.toUpperCase(),
      quantity,
      site,
      date: new Date().toISOString().split('T')[0],
      observation: '',
      responsible: '',
      ticket: '',
      sector: 'N/A',
      unitPrice: 0,
      totalPrice: 0,
      // FIX: Add missing properties to satisfy the Transaction type.
      invoiceNumber: '',
      serialNumber: '',
    });

    setProductName('');
    setQuantity(1);
    // FIX: Reset site from the 'sites' prop.
    setSite(sites.length > 0 ? sites[0] : '');
  };

  const title = type === 'entrada' ? 'Registrar Entrada de Produto' : 'Registrar Saída de Produto';

  return (
    <Card>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{title}</h2>
      {error && <p className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-4" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome do Produto"
          id="productName"
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Ex: Headset Gamer"
          required
        />
        <Input
          label="Quantidade"
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
          min="1"
          required
        />
        <Select
          label="Site"
          id="site"
          value={site}
          onChange={(e) => setSite(e.target.value as Site)}
          required
        >
          {/* FIX: Iterate over 'sites' prop. */}
          {sites.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button type="submit" className="w-full justify-center">
          {type === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
        </Button>
      </form>
    </Card>
  );
};
