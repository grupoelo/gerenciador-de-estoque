import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import DailyMovements from './components/DailyMovements';
import TransactionHistory from './components/TransactionHistory';
import { StockBalance } from './components/StockBalance';
import Dashboard from './components/Dashboard';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { ManageUsers } from './components/ManageUsers';
import { LogView } from './components/LogView';
import { StockThresholds } from './components/StockThresholds';
import Inventory from './components/Inventory';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';

import { Transaction, Site, User, LogEntry, ControllableView, StockBalanceData, Permissions, InventoryItem } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

import { toTitleCase, getUserNameFromEmail } from './utils/helpers';

const hashPassword = (pass: string) => `hashed_${pass}`;

const ForcePasswordChange: React.FC<{
  onPasswordChange: (newPassword_raw: string) => void;
  userEmail: string;
  logoUrl: string | null;
  onCancel: () => void;
}> = ({ onPasswordChange, userEmail, logoUrl, onCancel }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      onPasswordChange(newPassword);
    }, 500);
  };

  return (
    <Card className="w-full max-w-md animate-fade-in !rounded-[40px] !p-10 shadow-2xl">
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl shadow-xl flex items-center justify-center p-1 mb-6">
          <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
            ) : (
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m0 0v10l8 4m0-14L4 7" /></svg>
            )}
          </div>
        </div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Nova Senha</h1>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-xs font-bold">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Nova Senha" id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
        <Input label="Confirmar Senha" id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        <div className="flex flex-col gap-3 pt-4">
          <Button type="submit" className="w-full !py-4 !rounded-2xl" disabled={isLoading}>Salvar Senha</Button>
          <Button type="button" variant="secondary" onClick={onCancel} className="w-full !py-3 !rounded-2xl border-none shadow-none">Voltar ao Login</Button>
        </div>
      </form>
    </Card>
  );
};

const initialSites: Site[] = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'São Luís Dunas', 'São Luís Ilha'];
const initialUsers: User[] = [{ id: 'superadmin', email: 'superadmin@gestao.app', password: hashPassword('Qr4$t%gw#'), role: 'Super Admin', site: 'Todos' }];
const defaultPermissions: Permissions = {
  'Administrador': { dashboard: { canView: true, canEdit: true, canDelete: true }, movimentacoes: { canView: true, canEdit: true, canDelete: true }, historico: { canView: true, canEdit: true, canDelete: true }, saldo: { canView: true, canEdit: true, canDelete: true }, inventario: { canView: true, canEdit: true, canDelete: true }, limites: { canView: true, canEdit: true, canDelete: true }, logs: { canView: true, canEdit: true, canDelete: true }, users: { canView: true, canEdit: true, canDelete: true } },
  'Padrão': { dashboard: { canView: true, canEdit: false, canDelete: false }, movimentacoes: { canView: true, canEdit: true, canDelete: false }, historico: { canView: true, canEdit: false, canDelete: false }, saldo: { canView: true, canEdit: false, canDelete: false }, inventario: { canView: true, canEdit: true, canDelete: false }, limites: { canView: false, canEdit: false, canDelete: false }, logs: { canView: false, canEdit: false, canDelete: false }, users: { canView: false, canEdit: false, canDelete: false } },
  'Restrito': { dashboard: { canView: true, canEdit: false, canDelete: false }, movimentacoes: { canView: true, canEdit: false, canDelete: false }, historico: { canView: true, canEdit: false, canDelete: false }, saldo: { canView: true, canEdit: false, canDelete: false }, inventario: { canView: true, canEdit: false, canDelete: false }, limites: { canView: false, canEdit: false, canDelete: false }, logs: { canView: false, canEdit: false, canDelete: false }, users: { canView: false, canEdit: false, canDelete: false } }
};

const App: React.FC = () => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [sites, setSites] = useLocalStorage<Site[]>('sites', initialSites);
  const [products, setProducts] = useLocalStorage<string[]>('products', ['Teclado', 'Mouse', 'Headset']);
  const [sectors, setSectors] = useLocalStorage<string[]>('sectors', ['Operação 1', 'Operação 2']);
  const [responsibles, setResponsibles] = useLocalStorage<string[]>('responsibles', ['Equipe']);
  const [users, setUsers] = useLocalStorage<User[]>('users', initialUsers);
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('logs', []);
  const [permissions, setPermissions] = useLocalStorage<Permissions>('permissions', defaultPermissions);
  const [thresholds, setThresholds] = useLocalStorage<{ [site: string]: { [product: string]: number } }>('thresholds', {});
  const [inventoryItems, setInventoryItems] = useLocalStorage<InventoryItem[]>('inventoryItems', []);

  const [inventoryTypes, setInventoryTypes] = useLocalStorage<string[]>('inventoryTypes', ['Desktop', 'Monitor']);
  const [models, setModels] = useLocalStorage<string[]>('inventoryModels', ['Model A']);
  const [manufacturers, setManufacturers] = useLocalStorage<string[]>('inventoryManufacturers', ['Dell']);
  const [statuses, setStatuses] = useLocalStorage<string[]>('inventoryStatuses', ['Em Uso']);
  const [operatingSystems, setOperatingSystems] = useLocalStorage<string[]>('inventoryOS', ['Windows 11']);
  const [memoryOptions, setMemoryOptions] = useLocalStorage<string[]>('inventoryMemory', ['16GB']);
  const [processorOptions, setProcessorOptions] = useLocalStorage<string[]>('inventoryProcessors', ['i7']);
  const [storageOptions, setStorageOptions] = useLocalStorage<string[]>('inventoryStorage', ['512GB']);

  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ControllableView | 'login' | 'forcePasswordChange'>('login');
  const [logoUrl, setLogoUrl] = useLocalStorage<string | null>('logoUrl', null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const initialAdmin = users.find(u => u.id === 'superadmin');
    if (!initialAdmin) {
      setUsers(initialUsers);
    }
  }, [users]);

  const handleLogin = (email: string, password_raw: string): boolean => {
    const user = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (user && user.password === hashPassword(password_raw)) {
      setAuthenticatedUser(user);
      addLogEntry('Usuário logado com sucesso.');
      setCurrentView(user.forcePasswordChange ? 'forcePasswordChange' : 'dashboard');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    addLogEntry('Usuário deslogado.');
    setAuthenticatedUser(null);
    setCurrentView('login');
    setIsSidebarOpen(false);
  };

  const handleForcePasswordChange = (newPassword_raw: string) => {
    if (!authenticatedUser) return;
    const hashedPassword = hashPassword(newPassword_raw);
    const updatedUser = { ...authenticatedUser, password: hashedPassword, forcePasswordChange: false };
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setAuthenticatedUser(updatedUser);
    setCurrentView('dashboard');
    addLogEntry('Senha alterada no primeiro login.');
  };

  const hasPermission = (user: User | null, view: ControllableView, action: 'canView' | 'canEdit' | 'canDelete') => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    const rolePermissions = permissions[user.role];
    if (!rolePermissions || !rolePermissions[view]) return false;
    return rolePermissions[view]![action];
  };

  const addLogEntry = (action: string, site?: string) => {
    const newLog: LogEntry = {
      id: new Date().toISOString(),
      date: new Date().toISOString(),
      user: authenticatedUser?.email || 'Sistema',
      site: site || authenticatedUser?.site || 'N/A',
      action,
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const stockBalance = useMemo(() => {
    const balance: { [key: string]: { [key: string]: number } } = {};
    const userSiteNormalized = authenticatedUser?.site.toLowerCase().trim();

    const visibleTransactions = transactions.filter(t =>
      authenticatedUser?.site === 'Todos' || t.site.toLowerCase().trim() === userSiteNormalized
    );

    visibleTransactions.forEach(t => {
      const siteKey = toTitleCase(t.site.trim());
      const productKey = toTitleCase(t.productName);
      if (!balance[siteKey]) balance[siteKey] = {};
      if (!balance[siteKey][productKey]) balance[siteKey][productKey] = 0;
      balance[siteKey][productKey] += (t.type === 'entrada' ? t.quantity : -t.quantity);
    });
    return balance;
  }, [transactions, authenticatedUser]);

  const stockChartData: StockBalanceData[] = useMemo(() => {
    const productMap: { [key: string]: StockBalanceData } = {};
    Object.entries(stockBalance).forEach(([site, products]) => {
      Object.entries(products).forEach(([productName, quantity]) => {
        if (quantity <= 0) return;
        if (!productMap[productName]) {
          const newEntry: StockBalanceData = { name: productName };
          sites.forEach(s => newEntry[s] = 0);
          productMap[productName] = newEntry;
        }
        productMap[productName][site] = quantity;
      });
    });
    return Object.values(productMap);
  }, [stockBalance, sites]);

  const weightedAverageCosts = useMemo(() => {
    const costs: { [site: string]: { [product: string]: { totalCost: number; totalQuantity: number } } } = {};
    const averages: { [site: string]: { [product: string]: number } } = {};
    transactions
      .filter(t => t.type === 'entrada')
      .forEach(t => {
        const siteKey = toTitleCase(t.site.trim());
        const productKey = toTitleCase(t.productName);
        if (!costs[siteKey]) costs[siteKey] = {};
        if (!costs[siteKey][productKey]) costs[siteKey][productKey] = { totalCost: 0, totalQuantity: 0 };
        costs[siteKey][productKey].totalCost += t.totalPrice;
        costs[siteKey][productKey].totalQuantity += t.quantity;
      });
    Object.entries(costs).forEach(([site, prods]) => {
      if (!averages[site]) averages[site] = {};
      Object.entries(prods).forEach(([productName, data]) => {
        averages[site][productName] = data.totalQuantity > 0 ? data.totalCost / data.totalQuantity : 0;
      });
    });
    return averages;
  }, [transactions]);

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions([...transactions, transaction]);
    addLogEntry(`Registrou ${transaction.type} de ${transaction.quantity}x "${transaction.productName}".`, transaction.site);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    addLogEntry(`Atualizou transação de "${updatedTransaction.productName}".`, updatedTransaction.site);
    setTransactionToEdit(null);
  };

  const handleNavigate = (view: ControllableView) => {
    if (hasPermission(authenticatedUser, view, 'canView')) {
      setTransactionToEdit(null);
      setCurrentView(view);
      setIsSidebarOpen(false);
    }
  };

  const renderCurrentView = () => {
    if (!authenticatedUser) return <Login onLogin={handleLogin} logoUrl={logoUrl} />;
    if (currentView === 'forcePasswordChange') return <ForcePasswordChange onPasswordChange={handleForcePasswordChange} userEmail={authenticatedUser.email} logoUrl={logoUrl} onCancel={handleLogout} />;

    const userSiteNormalized = authenticatedUser.site.toLowerCase().trim();
    const visibleSites = authenticatedUser.site === 'Todos' ? sites : sites.filter(s => s.toLowerCase().trim() === userSiteNormalized);
    const visibleTransactions = transactions.filter(t => authenticatedUser.site === 'Todos' || t.site.toLowerCase().trim() === userSiteNormalized);
    const visibleInventoryItems = inventoryItems.filter(i => authenticatedUser.site === 'Todos' || i.site.toLowerCase().trim() === userSiteNormalized);

    switch (currentView) {
      case 'dashboard': return <Dashboard transactions={visibleTransactions} stockBalance={stockBalance} sites={visibleSites} stockThresholds={thresholds} inventoryItems={visibleInventoryItems} weightedAverageCosts={weightedAverageCosts} />;
      case 'movimentacoes': return <DailyMovements onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} transactionToEdit={transactionToEdit} onCancelEdit={() => setTransactionToEdit(null)} stockBalance={stockBalance} sites={sites} setSites={setSites} products={products} setProducts={setProducts} sectors={sectors} setSectors={setSectors} responsibles={responsibles} setResponsibles={setResponsibles} users={users} transactions={transactions} addLogEntry={addLogEntry} authenticatedUser={authenticatedUser} />;
      case 'historico': return <TransactionHistory transactions={visibleTransactions} sites={visibleSites} sectors={sectors} logoUrl={logoUrl} onEdit={(t) => { setTransactionToEdit(t); setCurrentView('movimentacoes'); }} onDelete={(id) => setTransactions(transactions.filter(t => t.id !== id))} authenticatedUser={authenticatedUser} hasPermission={hasPermission} onAddMultiple={setTransactions} />;
      case 'saldo': return <StockBalance balance={stockBalance} sites={visibleSites} unitPrices={weightedAverageCosts} logoUrl={logoUrl} />;
      case 'inventario': return <Inventory items={visibleInventoryItems} onAddItem={(i) => setInventoryItems([...inventoryItems, i])} onUpdateItem={(i) => setInventoryItems(inventoryItems.map(it => it.id === i.id ? i : it))} onDeleteItem={(id) => setInventoryItems(inventoryItems.filter(i => i.id !== id))} addLogEntry={addLogEntry} sites={sites} authenticatedUser={authenticatedUser} hasPermission={hasPermission} inventoryTypes={inventoryTypes} setInventoryTypes={setInventoryTypes} models={models} setModels={setModels} manufacturers={manufacturers} setManufacturers={setManufacturers} statuses={statuses} setStatuses={setStatuses} sectors={sectors} setSectors={setSectors} operatingSystems={operatingSystems} setOperatingSystems={setOperatingSystems} memoryOptions={memoryOptions} setMemoryOptions={setMemoryOptions} processorOptions={processorOptions} setProcessorOptions={setProcessorOptions} storageOptions={storageOptions} setStorageOptions={setStorageOptions} />;
      case 'limites': return <StockThresholds sites={sites} products={products} thresholds={thresholds} setThresholds={setThresholds} addLogEntry={addLogEntry} />;
      case 'logs': return <LogView logs={logs} onClearLogs={() => setLogs([])} sites={sites} logoUrl={logoUrl} />;
      case 'users': return <ManageUsers users={users} setUsers={setUsers} sites={sites} addLogEntry={addLogEntry} authenticatedUser={authenticatedUser} permissions={permissions} setPermissions={setPermissions} hasPermission={hasPermission} hashPassword={hashPassword} />;
      default: return null;
    }
  };

  return (
    <div className="bg-[#f1f5f9] dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300 antialiased overflow-hidden">
      {authenticatedUser && currentView !== 'forcePasswordChange' ? (
        <div className="flex p-4 lg:p-6 gap-6 h-screen relative">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

          <Sidebar
            currentView={currentView}
            onNavigate={handleNavigate}
            logoUrl={logoUrl}
            authenticatedUser={authenticatedUser}
            hasPermission={(u, v) => hasPermission(u, v, 'canView')}
            onLogoChange={(f) => setLogoUrl(URL.createObjectURL(f))}
            onLogoRemove={() => setLogoUrl(null)}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
            <Header authenticatedUser={authenticatedUser} onLogout={handleLogout} onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <div className="pb-10">
                {renderCurrentView()}
              </div>
            </main>
          </div>
        </div>
      ) : (
        <main className="flex min-h-screen items-center justify-center">
          {renderCurrentView()}
        </main>
      )}
    </div>
  );
};

export default App;