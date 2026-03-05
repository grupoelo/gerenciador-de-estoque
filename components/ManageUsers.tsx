
import React, { useState, useEffect } from 'react';
import { User, Site, UserRole, Permissions, ControllableView } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { ManagePermissions } from './ManagePermissions';

interface ManageUsersProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    sites: Site[];
    addLogEntry: (action: string, site?: string) => void;
    authenticatedUser: User | null;
    permissions: Permissions;
    setPermissions: React.Dispatch<React.SetStateAction<Permissions>>;
    hasPermission: (user: User | null, view: ControllableView, action: 'canEdit' | 'canDelete') => boolean;
    hashPassword: (password: string) => string;
}

const UserForm: React.FC<{
    userToEdit: User | null;
    onSave: (user: Omit<User, 'id'> | User) => void;
    onCancel: () => void;
    sites: Site[];
    users: User[];
    hashPassword: (password: string) => string;
    currentUserRole: UserRole | undefined;
}> = ({ userToEdit, onSave, onCancel, sites, users, hashPassword, currentUserRole }) => {
    const isEditing = !!userToEdit;

    const getInitialState = () => ({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Padrão' as UserRole,
        site: sites.length > 0 ? sites[0] : '',
        forcePasswordChange: true,
    });
    
    const [userData, setUserData] = useState(getInitialState());
    const [error, setError] = useState('');

    useEffect(() => {
        if (userToEdit) {
            setUserData({
                email: userToEdit.email,
                password: '', // Do not show existing password
                confirmPassword: '',
                role: userToEdit.role,
                site: userToEdit.site,
                forcePasswordChange: userToEdit.forcePasswordChange || false,
            });
        } else {
            setUserData(getInitialState());
        }
    }, [userToEdit, sites]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as UserRole;
        const newState = { ...userData, role: newRole };
        if (newRole === 'Administrador' || newRole === 'Super Admin') {
            newState.site = 'Todos';
        } else if (userData.site === 'Todos') {
            newState.site = sites.length > 0 ? sites[0] : '';
        }
        setUserData(newState);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!userData.email.trim() || !/^\S+@\S+\.\S+$/.test(userData.email.trim())) {
            setError('Por favor, insira um e-mail válido.');
            return;
        }

        if (isEditing && userToEdit) {
            const otherUsers = users.filter(u => u.id !== userToEdit.id);
            if (otherUsers.some(u => u.email.toLowerCase() === userData.email.trim().toLowerCase())) {
                setError('Este e-mail já está em uso por outro usuário.');
                return;
            }
        } else {
            if (users.some(u => u.email.toLowerCase() === userData.email.trim().toLowerCase())) {
                setError('Este e-mail já está em uso.');
                return;
            }
        }
        
        if (!isEditing && !userData.password) {
            setError('A senha é obrigatória para novos usuários.');
            return;
        }
        if (userData.password !== userData.confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        const { confirmPassword, ...userToSaveData } = userData;

        if (userToSaveData.password) {
            userToSaveData.password = hashPassword(userToSaveData.password);
        } else if (isEditing) {
            delete (userToSaveData as Partial<typeof userToSaveData>).password;
        }

        if (isEditing) {
            const { forcePasswordChange, ...finalData } = userToSaveData;
            onSave({ ...userToEdit, ...finalData });
        } else {
            onSave({ ...userToEdit, ...userToSaveData });
        }
    };

    return (
        <Card>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                {isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
            </h3>
            {error && <p className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-md mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Email do usuário" id="email" name="email" type="email" value={userData.email} onChange={handleInputChange} required />
                <Input label={isEditing ? "Nova Senha (deixe em branco para não alterar)" : "Senha"} id="password" name="password" type="password" value={userData.password} onChange={handleInputChange} required={!isEditing} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 items-end">
                    <Input label={isEditing ? "Confirmar Nova Senha" : "Confirmar Senha"} id="confirmPassword" name="confirmPassword" type="password" value={userData.confirmPassword} onChange={handleInputChange} required={!isEditing || !!userData.password} />
                    {!isEditing && (
                        <div className="flex items-center h-11 pb-1">
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="checkbox" 
                                    id="forcePasswordChange" 
                                    name="forcePasswordChange" 
                                    checked={userData.forcePasswordChange} 
                                    onChange={e => setUserData(prev => ({ ...prev, forcePasswordChange: e.target.checked }))}
                                    className="h-4 w-4 rounded border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-600 text-sky-600 focus:ring-sky-500" 
                                />
                                <label htmlFor="forcePasswordChange" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                                    Alterar senha no primeiro logon
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <Select 
                    label="Nível de Acesso" 
                    id="role" 
                    name="role" 
                    value={userData.role} 
                    onChange={handleRoleChange}
                    disabled={userToEdit?.role === 'Super Admin'}
                >
                    {/* Apenas Super Admins podem ver/manter o cargo Super Admin no form se já for um */}
                    {userToEdit?.role === 'Super Admin' && <option value="Super Admin">Super Admin (Mestre)</option>}
                    <option value="Administrador">Administrador</option>
                    <option value="Padrão">Padrão</option>
                    <option value="Restrito">Restrito</option>
                </Select>
                 <Select label="Nível de Visibilidade" id="site" name="site" value={userData.site} onChange={handleSelectChange} disabled={userData.role === 'Administrador' || userData.role === 'Super Admin' || sites.length === 0}>
                    {(userData.role === 'Administrador' || userData.role === 'Super Admin') ? (
                        <option value="Todos">Administrador (Todos os Sites)</option>
                    ) : (
                        <>
                            <option value="Todos">Todos</option>
                            {sites.map(s => <option key={s} value={s}>Somente Site {s}</option>)}
                        </>
                    )}
                </Select>
                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit">{isEditing ? 'Salvar Alterações' : 'Adicionar Usuário'}</Button>
                </div>
            </form>
        </Card>
    );
};

export const ManageUsers: React.FC<ManageUsersProps> = ({ users, setUsers, sites, addLogEntry, authenticatedUser, permissions, setPermissions, hasPermission, hashPassword }) => {
    const [viewMode, setViewMode] = useState<'list' | 'form' | 'permissions'>('list');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<User | null>(null);

    const isSuperAdmin = authenticatedUser?.role === 'Super Admin';
    const canEditUsers = hasPermission(authenticatedUser, 'users', 'canEdit');
    const canDeleteUsers = hasPermission(authenticatedUser, 'users', 'canDelete');
    
    // TRAVA DE SEGURANÇA: O Super Admin só é visível se o próprio Super Admin estiver logado.
    const visibleUsers = isSuperAdmin 
        ? users 
        : users.filter(u => u.role !== 'Super Admin');
    
    const handleAddNew = () => {
        setEditingUser(null);
        setViewMode('form');
    };

    const handleEdit = (user: User) => {
        // TRAVA DE SEGURANÇA: Impede que um Administrador edite um Super Admin mesmo se souber a URL/ID
        if (user.role === 'Super Admin' && !isSuperAdmin) {
            alert("Acesso Negado: A conta master não pode ser alterada por outros cargos.");
            return;
        }
        setEditingUser(user);
        setViewMode('form');
    };
    
    const handleSaveUser = (userData: Omit<User, 'id'> | User) => {
        const userWithTrimmedEmail = { ...userData, email: userData.email.trim() };
    
        if ('id' in userWithTrimmedEmail && userWithTrimmedEmail.id) { // Editing existing user
            const oldUser = users.find(u => u.id === userWithTrimmedEmail.id);
            
            // TRAVA DE SEGURANÇA: Garante que o cargo Super Admin não seja removido acidentalmente
            if (oldUser?.role === 'Super Admin' && userWithTrimmedEmail.role !== 'Super Admin') {
                alert("Erro: O cargo da conta Master não pode ser alterado.");
                return;
            }

            setUsers(users.map(u => u.id === userWithTrimmedEmail.id ? { ...u, ...userWithTrimmedEmail } : u).sort((a,b) => a.email.localeCompare(b.email)));
            addLogEntry(`Usuário "${oldUser?.email}" atualizado.`, 'Sistema');
        } else { // Adding new user
            const newUser = { ...userWithTrimmedEmail, id: new Date().toISOString() + Math.random() } as User;
            setUsers(prev => [...prev, newUser].sort((a,b) => a.email.localeCompare(b.email)));
            addLogEntry(`Novo usuário adicionado: "${newUser.email}".`, 'Sistema');
        }
        setViewMode('list');
        setEditingUser(null);
    };

    const handleDelete = () => {
        if (confirmingDelete) {
            // TRAVA DE SEGURANÇA: Super Admin NUNCA pode ser excluído
            if (confirmingDelete.role === 'Super Admin') {
                alert('Erro Fatal: A conta master do sistema não pode ser excluída.');
                setConfirmingDelete(null);
                return;
            }

            if (confirmingDelete.id === authenticatedUser?.id) {
                 alert('Não é possível excluir seu próprio usuário.');
                 setConfirmingDelete(null);
                 return;
            }
            addLogEntry(`Usuário removido: "${confirmingDelete.email}".`, 'Sistema');
            setUsers(users.filter(u => u.id !== confirmingDelete.id));
            setConfirmingDelete(null);
        }
    };

    const renderContent = () => {
        switch (viewMode) {
            case 'form':
                return <UserForm 
                    userToEdit={editingUser} 
                    onSave={handleSaveUser} 
                    onCancel={() => setViewMode('list')} 
                    sites={sites}
                    users={users}
                    hashPassword={hashPassword}
                    currentUserRole={authenticatedUser?.role}
                />;
            case 'permissions':
                return <ManagePermissions
                    permissions={permissions}
                    setPermissions={setPermissions}
                    onBack={() => setViewMode('list')}
                    addLogEntry={addLogEntry}
                    authenticatedUser={authenticatedUser}
                />;
            case 'list':
            default:
                return (
                    <Card>
                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                                <thead className="bg-slate-100 dark:bg-slate-700/50 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Email</th>
                                        <th className="px-6 py-3 font-semibold">Nível de Acesso</th>
                                        <th className="px-6 py-3 font-semibold">Nível de Visibilidade</th>
                                        {(canEditUsers || canDeleteUsers) && <th className="px-6 py-3 font-semibold text-center">Ações</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {visibleUsers.map(user => (
                                        <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${user.role === 'Super Admin' ? 'bg-sky-50/30 dark:bg-sky-900/10' : ''}`}>
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                                {user.email}
                                                {user.role === 'Super Admin' && (
                                                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold border border-amber-200 dark:border-amber-800">MASTER</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">{user.role}</td>
                                            <td className="px-6 py-4">{user.site === 'Todos' ? 'Todos os Sites' : `Somente Site ${user.site}`}</td>
                                            {(canEditUsers || canDeleteUsers) && (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Apenas o próprio Super Admin pode editar a si mesmo */}
                                                        {(user.role !== 'Super Admin' || (user.role === 'Super Admin' && authenticatedUser?.id === user.id)) && canEditUsers && (
                                                            <button onClick={() => handleEdit(user)} className="p-2 text-slate-400 hover:text-sky-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600/50 transition-colors" title="Editar Usuário">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            </button>
                                                        )}
                                                        {/* Super Admin nunca pode ser excluído */}
                                                        {user.role !== 'Super Admin' && canDeleteUsers && (
                                                            <button onClick={() => setConfirmingDelete(user)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors" title="Excluir Usuário">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         {visibleUsers.length === 0 && (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-6">Nenhum usuário cadastrado.</p>
                        )}
                    </Card>
                );
        }
    };


    return (
        <div className="space-y-8">
            {confirmingDelete && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmingDelete(null)}>
                    <Card className="max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold">Confirmar Exclusão</h3>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">Tem certeza que deseja excluir o usuário <strong>{confirmingDelete.email}</strong>?</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setConfirmingDelete(null)}>Cancelar</Button>
                            <Button onClick={handleDelete} className="!bg-red-600 hover:!bg-red-700 focus:ring-red-500">Excluir</Button>
                        </div>
                    </Card>
                </div>
            )}
            
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Gerenciar Usuários</h2>
                <div className="flex items-center gap-4">
                    {isSuperAdmin && viewMode === 'list' && (
                        <Button onClick={() => setViewMode('permissions')} variant="secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                            Gerenciar Permissões
                        </Button>
                    )}
                    {viewMode === 'list' && canEditUsers && (
                        <Button onClick={handleAddNew}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                             </svg>
                            Adicionar Usuário
                        </Button>
                    )}
                </div>
            </div>

            {renderContent()}
        </div>
    );
};
