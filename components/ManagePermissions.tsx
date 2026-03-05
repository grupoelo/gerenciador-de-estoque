import React from 'react';
import { Button } from './ui/Button';
import { Permissions, User, UserRole, ControllableView } from '../types';

interface ManagePermissionsProps {
    permissions: Permissions;
    setPermissions: React.Dispatch<React.SetStateAction<Permissions>>;
    onBack: () => void;
    addLogEntry: (action: string, site?: string) => void;
    authenticatedUser: User | null;
}

const VIEW_LABELS: Record<ControllableView, string> = {
    dashboard: 'Dashboard',
    movimentacoes: 'Movimentações',
    historico: 'Histórico',
    saldo: 'Saldo de Estoque',
    inventario: 'Inventário',
    limites: 'Limites de Estoque',
    logs: 'Logs de Atividades',
    users: 'Gerenciar Usuários',
};

export const ManagePermissions: React.FC<ManagePermissionsProps> = ({ permissions, setPermissions, onBack, addLogEntry, authenticatedUser }) => {
    
    const handlePermissionChange = (role: UserRole, view: ControllableView, action: 'canView' | 'canEdit' | 'canDelete') => {
        setPermissions(prev => {
            const newPermissions = JSON.parse(JSON.stringify(prev));
            if (!newPermissions[role]) newPermissions[role] = {};
            if (!newPermissions[role][view]) newPermissions[role][view] = { canView: false, canEdit: false, canDelete: false };

            const newValue = !newPermissions[role][view][action];
            newPermissions[role][view][action] = newValue;
            
            // If canView is turned off, also turn off edit and delete
            if (action === 'canView' && !newValue) {
                newPermissions[role][view].canEdit = false;
                newPermissions[role][view].canDelete = false;
            }
            // If edit or delete is turned on, also turn on view
            if ((action === 'canEdit' || action === 'canDelete') && newValue) {
                newPermissions[role][view].canView = true;
            }

            return newPermissions;
        });
    };

    const handleSave = () => {
        addLogEntry('Permissões de usuário foram atualizadas.', 'Sistema');
        onBack();
    };

    const rolesToManage: UserRole[] = ['Administrador', 'Padrão', 'Restrito'];
    const viewsToManage = Object.keys(VIEW_LABELS) as ControllableView[];
    const isSuperAdmin = authenticatedUser?.role === 'Super Admin';

    return (
        <div className="bg-[#1f2937] p-6 rounded-xl shadow-lg border border-slate-700/60 w-full">
            <h2 className="text-3xl font-bold text-white mb-6">Gerenciar Permissões</h2>

            <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-sm text-slate-300">
                    <thead className="bg-[#2c3a4b] text-xs uppercase text-slate-400">
                        <tr>
                            <th scope="col" className="px-4 py-3 font-semibold text-left whitespace-nowrap align-bottom" rowSpan={2}>TELA / MÓDULO</th>
                            {rolesToManage.map(role => (
                                <th key={role} scope="col" className="px-4 py-3 font-semibold text-center whitespace-nowrap border-l border-slate-700" colSpan={3}>{role.toUpperCase()}</th>
                            ))}
                        </tr>
                        <tr>
                            {rolesToManage.map(role => (
                                <React.Fragment key={role}>
                                    <th scope="col" className="px-4 py-2 font-medium text-center whitespace-nowrap border-t border-l border-slate-700">VER</th>
                                    <th scope="col" className="px-4 py-2 font-medium text-center whitespace-nowrap border-t border-l border-slate-700">EDITAR</th>
                                    <th scope="col" className="px-4 py-2 font-medium text-center whitespace-nowrap border-t border-l border-slate-700">EXCLUIR</th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-[#263142] divide-y divide-slate-700">
                       {viewsToManage.map(view => (
                           <tr key={view} className="hover:bg-slate-800/20">
                               <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{VIEW_LABELS[view]}</td>
                               {rolesToManage.map(role => {
                                   const perms = permissions[role]?.[view] ?? { canView: false, canEdit: false, canDelete: false };
                                   const isDisabled = role === 'Administrador' && !isSuperAdmin;

                                   const checkboxClasses = `w-4 h-4 rounded-sm transition-colors duration-200 bg-slate-500 border-slate-400 focus:ring-sky-500 focus:ring-offset-slate-800 text-sky-400 disabled:opacity-50 disabled:cursor-not-allowed`;

                                   return (
                                       <React.Fragment key={`${view}-${role}`}>
                                           <td className="px-4 py-3 text-center border-l border-slate-700">
                                               <input type="checkbox" checked={perms.canView} onChange={() => handlePermissionChange(role, view, 'canView')} disabled={isDisabled} className={checkboxClasses} aria-label={`Ver ${VIEW_LABELS[view]} para ${role}`} />
                                           </td>
                                           <td className="px-4 py-3 text-center border-l border-slate-700">
                                                <input type="checkbox" checked={perms.canEdit} onChange={() => handlePermissionChange(role, view, 'canEdit')} disabled={isDisabled} className={checkboxClasses} aria-label={`Editar ${VIEW_LABELS[view]} para ${role}`} />
                                           </td>
                                           <td className="px-4 py-3 text-center border-l border-slate-700">
                                               <input type="checkbox" checked={perms.canDelete} onChange={() => handlePermissionChange(role, view, 'canDelete')} disabled={isDisabled} className={checkboxClasses} aria-label={`Excluir ${VIEW_LABELS[view]} para ${role}`} />
                                           </td>
                                       </React.Fragment>
                                   );
                               })}
                           </tr>
                       ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" onClick={onBack}>Voltar</Button>
                <Button onClick={handleSave}>Salvar Permissões</Button>
            </div>
        </div>
    );
};
