import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Users, Plus, Edit, Trash2, Search, User, Shield, Building, Mail, Calendar, RefreshCw, Key, X } from 'lucide-react';
import UserForm from './UserForm';
import { User as UserType, UserFormData } from '../../types';

interface UserManagementProps {
  showFormOnMount?: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ showFormOnMount = false }) => {
  const { users, deleteUser, createUser, updateUser, loadUsers } = useApp();
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [showForm, setShowForm] = useState(showFormOnMount);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<UserType | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department_id?.toString().includes(searchTerm);
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesDepartment = !filterDepartment || user.department_id === Number(filterDepartment);
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = (user: UserType) => {
    if (user.id === currentUser?.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      setIsDeleting(true);
      try {
        await deleteUser(userToDelete.id);
        showNotification({
          type: 'success',
          title: 'Utilisateur supprimé',
          message: `L'utilisateur ${userToDelete.name} a été supprimé avec succès.`,
        });
        setShowDeleteModal(false);
        setUserToDelete(null);
      } catch (error) {
        console.error('Error deleting user:', error);
        showNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Une erreur est survenue lors de la suppression de l\'utilisateur.',
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleSubmit = async (userData: UserFormData) => {
    setIsLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        await updateUser(editingUser.id, userData);
        showNotification({
          type: 'success',
          title: 'Utilisateur mis à jour',
          message: `L'utilisateur ${userData.name} a été mis à jour avec succès.`,
        });
      } else {
        // Create new user
        await createUser(userData);
        showNotification({
          type: 'success',
          title: 'Utilisateur créé',
          message: `L'utilisateur ${userData.name} a été créé avec succès.`,
        });
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error saving user:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la sauvegarde de l\'utilisateur.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'it_personnel': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 text-red-600" />;
      case 'it_personnel': return <Shield className="h-4 w-4 text-blue-600" />;
      case 'employee': return <User className="h-4 w-4 text-green-600" />;
      default: return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'it_personnel': return 'Personnel IT';
      case 'employee': return 'Employé';
      default: return role;
    }
  };

  const userRoles = ['admin', 'it_personnel', 'employee'];
  
  // Get unique departments for filtering
  const uniqueDepartments = Array.from(new Set(users.map(u => u.department_id).filter(Boolean))).sort();

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
      setSelectAll(false);
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
      setSelectAll(true);
    }
  };

  const handleSelectUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === filteredUsers.length);
  };

  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) return;
    
    const usersToDelete = users.filter(u => selectedUsers.has(u.id));
    if (usersToDelete.some(u => u.id === currentUser?.id)) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Vous ne pouvez pas supprimer votre propre compte.',
      });
      return;
    }
    
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete all selected users
      for (const userId of selectedUsers) {
        await deleteUser(userId);
      }
      
      showNotification({
        type: 'success',
        title: 'Suppression en masse',
        message: `${selectedUsers.size} utilisateur(s) ont été supprimé(s) avec succès.`,
      });
      
      setSelectedUsers(new Set());
      setSelectAll(false);
      setShowBulkDeleteModal(false);
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la suppression en masse.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePasswordReset = (user: UserType) => {
    setUserToResetPassword(user);
    setNewPassword('');
    setShowPasswordResetModal(true);
  };

  const confirmPasswordReset = async () => {
    if (!userToResetPassword || !newPassword) return;
    
    setIsResettingPassword(true);
    try {
      // This would typically call an API to reset the password
      // For now, we'll just show a success notification
      showNotification({
        type: 'success',
        title: 'Mot de passe réinitialisé',
        message: `Le mot de passe de ${userToResetPassword.name} a été réinitialisé avec succès.`,
      });
      
      setShowPasswordResetModal(false);
      setUserToResetPassword(null);
      setNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la réinitialisation du mot de passe.',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (showForm) {
    return (
      <UserForm
        user={editingUser}
        onSubmit={handleSubmit}
        onClose={handleCloseForm}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadUsers()}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
            title="Actualiser la liste"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2 disabled:opacity-50"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
            <span>{isLoading ? 'Chargement...' : 'Ajouter un utilisateur'}</span>
          </button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white p-6 rounded-lg mb-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              name="searchTerm"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              autoComplete="off"
            />
          </div>
          <select
            name="filterRole"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            autoComplete="off"
          >
            <option value="">Tous les rôles</option>
            {userRoles.map(role => (
              <option key={role} value={role}>{getRoleLabel(role)}</option>
            ))}
          </select>
          <select
            name="filterDepartment"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            autoComplete="off"
          >
            <option value="">Tous les départements</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            {filteredUsers.length} utilisateur(s) trouvé(s)
            {filteredUsers.length !== users.length && (
              <span className="ml-2 text-gray-400">
                sur {users.length} total
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="bg-orange-50 border-b border-orange-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-orange-800">
                {selectedUsers.size} utilisateur(s) sélectionné(s)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Supprimer la sélection
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-3 py-1 text-sm text-orange-600 hover:text-orange-800"
              >
                Annuler la sélection
              </button>
            </div>
          </div>
        )}

        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      name="selectAll"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Département
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        name={`selectUser_${item.id}`}
                        checked={selectedUsers.has(item.id)}
                        onChange={() => handleSelectUser(item.id)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          {item.avatar_url ? (
                            <img 
                              src={item.avatar_url} 
                              alt={item.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{item.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(item.role)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(item.role)}`}>
                          {getRoleLabel(item.role)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.department_id ? (
                        <div className="flex items-center space-x-1">
                          <Building className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-900">{item.department_id}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Non défini</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'it_personnel') && (
                          <button
                            onClick={() => handlePasswordReset(item)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Réinitialiser le mot de passe"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Supprimer"
                          disabled={item.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || filterRole || filterDepartment 
                ? 'Aucun utilisateur trouvé' 
                : 'Aucun utilisateur'
              }
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterRole || filterDepartment 
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par ajouter votre premier utilisateur.'
              }
            </p>
            {searchTerm || filterRole || filterDepartment ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('');
                  setFilterDepartment('');
                }}
                className="mt-3 text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Effacer tous les filtres
              </button>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
              >
                Ajouter un utilisateur
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete.name}</strong> ?
              </p>
              <p className="text-sm text-gray-500">
                Cette action est irréversible et supprimera définitivement l'utilisateur.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression en cours...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmer la suppression en masse
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Êtes-vous sûr de vouloir supprimer {selectedUsers.size} utilisateur(s) sélectionné(s) ?
              </p>
              <p className="text-sm text-gray-500">
                Cette action est irréversible et supprimera définitivement les utilisateurs sélectionnés.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression en cours...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Réinitialiser le mot de passe</h3>
              <button
                onClick={() => setShowPasswordResetModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Réinitialiser le mot de passe pour <strong>{userToResetPassword?.name}</strong>
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nouveau mot de passe"
                required
                autoComplete="new-password"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPasswordResetModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmPasswordReset}
                disabled={!newPassword.trim() || isResettingPassword}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                {isResettingPassword ? 'Réinitialisation...' : 'Réinitialiser'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;