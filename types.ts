// FIX: Create types.ts to provide shared type definitions across the application.

export type TransactionType = 'entrada' | 'saida';
export type Site = string;
export type Sector = string;
export type UserRole = 'Super Admin' | 'Administrador' | 'Padrão' | 'Restrito';

export interface Transaction {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  type: TransactionType;
  site: Site;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  observation: string;
  responsible: string;
  ticket: string;
  sector: Sector;
  invoiceNumber: string;
  serialNumber: string;
}

export interface InventoryItem {
  id: string;
  type: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  manufactureDate: string; // ISO date string YYYY-MM-DD
  usageTime: string;
  value: number;
  status: string;
  site: Site;
  sector: Sector;
  operatingSystem: string;
  memory: string;
  processor: string;
  storage: string;
}

export interface LogEntry {
  id: string;
  date: string; // ISO datetime string
  user: string; // user email
  site: string;
  action: string;
}

export interface StockBalanceData {
  name: string; // Product name
  [site: string]: string | number;
}

export interface User {
  id: string;
  email: string;
  password?: string; // Should be hashed in a real app, raw here for simplicity
  role: UserRole;
  site: Site | 'Todos';
  forcePasswordChange?: boolean;
}

export type ControllableView = 
  | 'dashboard'
  | 'movimentacoes'
  | 'historico'
  | 'saldo'
  | 'inventario'
  | 'limites'
  | 'logs'
  | 'users';

export type PermissionAction = {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type Permissions = {
  [key in UserRole]?: {
    [key in ControllableView]?: PermissionAction;
  };
};