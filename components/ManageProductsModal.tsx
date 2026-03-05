
import React, { useState, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ManageProductsModalProps {
  products: string[];
  setProducts: React.Dispatch<React.SetStateAction<string[]>>;
  onClose: () => void;
  addLogEntry: (action: string, site?: string) => void;
}

const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.trim().replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const ManageProductsModal: React.FC<ManageProductsModalProps> = ({ products, setProducts, onClose, addLogEntry }) => {
  const [newItemName, setNewItemName] = useState('');
  const [editingItem, setEditingItem] = useState<{ index: number; name: string } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<{ index: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddItem = () => {
    const trimmed = newItemName.trim();
    if (trimmed && !products.find(p => p.toLowerCase() === trimmed.toLowerCase())) {
      const newProduct = toTitleCase(trimmed);
      setProducts(prev => [...prev, newProduct].sort());
      addLogEntry(`Produto adicionado: "${newProduct}"`, 'Sistema');
      setNewItemName('');
    } else if (trimmed) {
      alert('Este produto já está cadastrado.');
    }
  };

  const handleUpdateItem = () => {
    if (editingItem && editingItem.name.trim()) {
      const oldName = products[editingItem.index];
      const newName = toTitleCase(editingItem.name.trim());
      
      if (products.some((p, i) => i !== editingItem.index && p.toLowerCase() === newName.toLowerCase())) {
        alert('Já existe outro produto com este nome.');
        return;
      }

      const updatedItems = [...products];
      updatedItems[editingItem.index] = newName;
      setProducts(updatedItems.sort());
      addLogEntry(`Produto "${oldName}" renomeado para "${newName}"`, 'Sistema');
      setEditingItem(null);
    }
  };

  const requestDeleteItem = (index: number) => {
    setConfirmingDelete({ index, name: products[index] });
  };

  const confirmDeleteItem = () => {
    if (confirmingDelete) {
      addLogEntry(`Produto removido: "${confirmingDelete.name}"`, 'Sistema');
      setProducts(prevProducts => prevProducts.filter((_, index) => index !== confirmingDelete.index));
      setConfirmingDelete(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const headers = "Produto";
    const exampleRow1 = "Teclado Mecânico RGB";
    const exampleRow2 = "Mouse Gamer Pro";
    const csvContent = [headers, exampleRow1, exampleRow2].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_importacao_produtos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVLine = (line: string, delimiter: string) => {
    const pattern = new RegExp(
      `(\\${delimiter}|\\r?\\n|\\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^"\\${delimiter}\\r\\n]*))`,
      "gi"
    );
    const data = [];
    let matches = null;
    while ((matches = pattern.exec(line))) {
      let matchedValue;
      if (matches[2] !== undefined) {
        matchedValue = matches[2].replace(/""/g, '"');
      } else {
        matchedValue = matches[3];
      }
      data.push(matchedValue);
    }
    return data;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error("O arquivo está vazio.");

        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 1) {
          throw new Error("O arquivo CSV deve ter pelo menos um cabeçalho.");
        }

        let headerLine = lines[0].trim();
        if (headerLine.charCodeAt(0) === 0xFEFF) {
          headerLine = headerLine.substring(1);
        }
        
        const possibleDelimiters = [';', ',', '\t'];
        let delimiter = ';';
        let maxCols = 0;
        
        possibleDelimiters.forEach(d => {
            const cols = headerLine.split(d).length;
            if (cols > maxCols) {
                maxCols = cols;
                delimiter = d;
            }
        });

        const headers = parseCSVLine(headerLine, delimiter).map(h => 
            (h || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        );
        
        const possibleColumnNames = ['produto', 'nome', 'item', 'product', 'name'];
        const productIndex = headers.findIndex(h => possibleColumnNames.includes(h));

        if (productIndex === -1) {
          throw new Error('Coluna de identificação do produto não encontrada. O cabeçalho deve conter "Produto", "Nome" ou "Item".');
        }
        
        const newProductsSet = new Set<string>();
        const existingProductsLower = new Set(products.map(p => p.toLowerCase()));

        for (let i = 1; i < lines.length; i++) {
          const rowData = parseCSVLine(lines[i], delimiter);
          const productNameRaw = (rowData[productIndex] || '').trim();

          if (productNameRaw) {
            const productName = toTitleCase(productNameRaw);
            if (!existingProductsLower.has(productName.toLowerCase()) && !newProductsSet.has(productName.toLowerCase())) {
              newProductsSet.add(productName);
            }
          }
        }
        
        const productsToAdd = Array.from(newProductsSet);
        if (productsToAdd.length > 0) {
          // A atualização aqui usa o estado funcional para garantir que nada seja perdido
          setProducts(prev => {
            const combined = [...prev, ...productsToAdd];
            const unique = Array.from(new Set(combined.map(p => p.toLowerCase())))
                .map(lower => combined.find(p => p.toLowerCase() === lower) || '');
            return unique.filter(Boolean).sort((a, b) => a.localeCompare(b));
          });
          
          addLogEntry(`${productsToAdd.length} novos produtos importados via CSV.`, 'Sistema');
          alert(`${productsToAdd.length} novos produtos foram importados e salvos definitivamente no sistema!`);
        } else {
          alert('Nenhum produto novo para importar. O arquivo pode estar vazio ou os produtos já existem no sistema.');
        }

      } catch (error) {
        console.error("CSV Import Error:", error);
        alert(`Erro ao importar o arquivo: ${error instanceof Error ? error.message : 'Formato inválido.'}`);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const rawInputClasses = "flex-grow w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 dark:text-slate-100";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <Card className="relative w-full max-w-2xl overflow-hidden bg-slate-800 border-slate-700" onClick={e => e.stopPropagation()}>
        {confirmingDelete && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-[110] flex items-center justify-center rounded-xl" onClick={() => setConfirmingDelete(null)}>
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border border-slate-700" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white">Confirmar Exclusão</h3>
              <p className="mt-4 text-sm text-slate-400">
                Você tem certeza que deseja excluir o produto <strong className="text-white">{confirmingDelete.name}</strong>?
              </p>
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => setConfirmingDelete(null)}>Cancelar</Button>
                <Button onClick={confirmDeleteItem} className="!bg-red-600 hover:!bg-red-700 text-white">
                  Confirmar Exclusão
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Gerenciar Produtos</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 space-y-8">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-300">Adicionar Novo Produto</h3>
              <div className="flex gap-2 items-end">
                <div className="flex-grow">
                  <Input
                    label="Nome do Produto"
                    id="newItem"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                    placeholder="Ex: Cadeira Gamer"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button onClick={handleAddItem} className="h-11 bg-sky-500 hover:bg-sky-600 text-white">Adicionar</Button>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-300">Importar Produtos via CSV</h3>
              <div className="bg-slate-700/30 p-5 rounded-lg border border-slate-700/50">
                <p className="text-sm text-slate-400 mb-3">
                  O arquivo precisa conter uma coluna chamada <strong className="text-slate-200">"Produto"</strong>.
                </p>
                <button type="button" onClick={handleDownloadTemplate} className="text-sky-400 hover:text-sky-300 hover:underline text-sm font-semibold flex items-center gap-1 mb-4 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Baixar modelo.
                </button>
                <Button onClick={handleImportClick} variant="secondary" className="w-full justify-center !py-6 text-base bg-slate-700 hover:bg-slate-600 text-white border-slate-600 border flex flex-col items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Selecionar Arquivo CSV
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv,text/csv" />
              </div>
            </section>
          </div>

          <div className="md:col-span-5 flex flex-col h-[400px]">
            <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center justify-between">
              <span>Produtos Existentes</span>
              <span className="text-xs font-normal bg-slate-700 px-2 py-1 rounded-full">{products.length} itens</span>
            </h3>
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar border border-slate-700 rounded-lg bg-slate-900/30">
              {products.length > 0 ? (
                <ul className="divide-y divide-slate-700">
                  {products.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors">
                      {editingItem?.index === index ? (
                        <div className="flex-grow mr-2">
                          <input
                            value={editingItem.name}
                            onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateItem()}
                            className="w-full px-2 py-1 bg-slate-800 border border-sky-500 rounded text-sm text-white focus:outline-none"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="font-medium text-slate-200 text-sm truncate mr-2" title={item}>{item}</span>
                      )}
                      <div className="flex gap-1 flex-shrink-0">
                        {editingItem?.index === index ? (
                          <button onClick={handleUpdateItem} className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                        ) : (
                          <>
                            <button onClick={() => setEditingItem({ index, name: item })} className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => requestDeleteItem(index)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                  <p className="text-sm">Nenhum produto cadastrado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end pt-4 border-t border-slate-700">
          <Button onClick={onClose} variant="secondary" className="bg-slate-700 hover:bg-slate-600 text-white border-none">Fechar</Button>
        </div>
      </Card>
    </div>
  );
};
