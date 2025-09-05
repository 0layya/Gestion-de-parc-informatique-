import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNotification } from '../../context/NotificationContext';
import { Building, Plus, Edit, Trash2, Search, Users, Settings, Calendar, Check, X } from 'lucide-react';
import { Department, DepartmentFormData } from '../../types';

const DepartmentManagement: React.FC = () => {
  const { users, departments, createDepartment, updateDepartment, deleteDepartment, updateUser, loadData } = useApp();
  const { showNotification } = useNotification();
  
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setShowForm(true);
  };

  const handleDelete = (department: Department) => {
    setDepartmentToDelete(department);
    setShowDeleteModal(true);
  };

  const handleManageUsers = (department: Department) => {
    setSelectedDepartment(department);
    setShowUserManagementModal(true);
  };

  const handleAddUserToDepartment = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user && selectedDepartment) {
        await updateUser(userId, { department_id: selectedDepartment.id });
        showNotification({
          type: 'success',
          title: 'Utilisateur ajouté',
          message: `${user.name} a été ajouté au département ${selectedDepartment.name}.`,
        });
      }
    } catch {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'ajout de l\'utilisateur au département.',
      });
    }
  };

  const handleRemoveUserFromDepartment = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user) {
        await updateUser(userId, { department_id: undefined });
        showNotification({
          type: 'success',
          title: 'Utilisateur retiré',
          message: `${user.name} a été retiré du département ${selectedDepartment?.name}.`,
        });
      }
    } catch {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors du retrait de l\'utilisateur du département.',
      });
    }
  };

  const confirmDelete = async () => {
    if (departmentToDelete) {
      setIsDeleting(true);
      try {
        // Check if department has users
        const hasUsers = users.some(u => u.department_id === departmentToDelete.id);
        if (hasUsers) {
          showNotification({
            type: 'error',
            title: 'Impossible de supprimer',
            message: 'Ce département a des utilisateurs assignés. Réassignez-les d\'abord.',
          });
          return;
        }

        await deleteDepartment(departmentToDelete.id);
        showNotification({
          type: 'success',
          title: 'Département supprimé',
          message: `Le département ${departmentToDelete.name} a été supprimé avec succès.`,
        });
        setShowDeleteModal(false);
        setDepartmentToDelete(null);
      } catch (error) {
        console.error('Error deleting department:', error);
        showNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Une erreur est survenue lors de la suppression du département.',
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDepartment(null);
  };

  const handleSubmit = async (departmentData: DepartmentFormData) => {
    setIsLoading(true);
    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, departmentData);
        showNotification({
          type: 'success',
          title: 'Département mis à jour',
          message: `Le département ${departmentData.name} a été mis à jour avec succès.`,
        });
      } else {
        await createDepartment(departmentData);
        showNotification({
          type: 'success',
          title: 'Département créé',
          message: `Le département ${departmentData.name} a été créé avec succès.`,
        });
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error saving department:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la sauvegarde du département.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getManagerName = (managerId?: number) => {
    if (!managerId) return 'Non assigné';
    const manager = users.find(u => u.id === managerId);
    return manager ? manager.name : 'Utilisateur inconnu';
  };

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <Check className="w-4 h-4 text-green-600" />
    ) : (
      <X className="w-4 h-4 text-red-600" />
    );
  };

  if (showForm) {
    return (
      <DepartmentForm
        department={editingDepartment}
        onSubmit={handleSubmit}
        onClose={handleCloseForm}
        users={users}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Gestion des départements</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
            <span>{isLoading ? 'Chargement...' : 'Ajouter un département'}</span>
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-6 rounded-lg mb-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher un département..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredDepartments.length} département(s) trouvé(s)
            {filteredDepartments.length !== departments.length && (
              <span className="ml-2 text-gray-400">
                sur {departments.length} total
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Departments List */}
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
        {filteredDepartments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Département
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateurs
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
                {filteredDepartments.map((department) => {
                  const departmentUsers = users.filter(u => u.department_id === department.id);
                  return (
                    <tr key={department.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{department.name}</div>
                            {department.description && (
                              <div className="text-sm text-gray-500">{department.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {getManagerName(department.manager_id)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-1">
                            {getPermissionIcon(department.permissions.tickets)}
                            <span className="text-xs text-gray-600">Tickets</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getPermissionIcon(department.permissions.equipment)}
                            <span className="text-xs text-gray-600">Équipements</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getPermissionIcon(department.permissions.users)}
                            <span className="text-xs text-gray-600">Utilisateurs</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getPermissionIcon(department.permissions.reports)}
                            <span className="text-xs text-gray-600">Rapports</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">{departmentUsers.length}</span>
                          {departmentUsers.length > 0 && (
                            <div className="flex -space-x-1">
                              {departmentUsers.slice(0, 3).map((user) => (
                                <div
                                  key={user.id}
                                  className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600 border-2 border-white"
                                  title={user.name}
                                >
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {departmentUsers.length > 3 && (
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-600 border-2 border-white">
                                  +{departmentUsers.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => handleManageUsers(department)}
                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                            title="Gérer les utilisateurs"
                          >
                            Gérer
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{new Date(department.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(department)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(department)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? 'Aucun département trouvé' : 'Aucun département'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par ajouter votre premier département.'
              }
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Effacer la recherche
              </button>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Ajouter un département
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && departmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Êtes-vous sûr de vouloir supprimer le département <strong>{departmentToDelete.name}</strong> ?
              </p>
              <p className="text-sm text-gray-500">
                Cette action est irréversible et supprimera définitivement le département.
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

      {/* User Management Modal */}
      {showUserManagementModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Gérer les utilisateurs - {selectedDepartment.name}
              </h3>
              <button
                onClick={() => setShowUserManagementModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Fermer"
                title="Fermer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Utilisateurs actuels</h4>
                <div className="space-y-2">
                  {users.filter(u => u.department_id === selectedDepartment.id).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveUserFromDepartment(user.id)}
                        className="text-xs text-red-600 hover:text-red-700 hover:underline"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                  {users.filter(u => u.department_id === selectedDepartment.id).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucun utilisateur dans ce département
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ajouter des utilisateurs</h4>
                <div className="space-y-2">
                  {users.filter(u => !u.department_id || u.department_id !== selectedDepartment.id).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddUserToDepartment(user.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Ajouter
                      </button>
                    </div>
                  ))}
                  {users.filter(u => !u.department_id || u.department_id !== selectedDepartment.id).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Tous les utilisateurs sont déjà assignés à des départements
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Department Form Component
interface DepartmentFormProps {
  department: Department | null;
  onSubmit: (data: DepartmentFormData) => void;
  onClose: () => void;
  users: { id: number; name: string; role: string; department_id?: number }[];
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({ department, onSubmit, onClose, users }) => {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: department?.name || '',
    description: department?.description || '',
    manager_id: department?.manager_id,
    permissions: {
      tickets: department?.permissions.tickets ?? true,
      equipment: department?.permissions.equipment ?? false,
      users: department?.permissions.users ?? false,
      reports: department?.permissions.reports ?? false
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePermissionChange = (permission: keyof typeof formData.permissions) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: !formData.permissions[permission]
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const availableManagers = users.filter(u => u.role === 'admin' || u.role === 'it_personnel' || u.role === 'employee');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {department ? 'Modifier le département' : 'Ajouter un département'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fermer"
            title="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom du département *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="ex: IT, Marketing, RH"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="manager_id" className="block text-sm font-medium text-gray-700">
                Manager du département
              </label>
              <select
                id="manager_id"
                name="manager_id"
                value={formData.manager_id || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                autoComplete="off"
              >
                <option value="">Aucun manager (peut être assigné plus tard)</option>
                {availableManagers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role === 'admin' ? 'Admin' : user.role === 'it_personnel' ? 'IT' : 'Employé'})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Vous pouvez assigner n'importe quel utilisateur comme manager du département
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="Description du département..."
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions du département
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="permissions_tickets"
                  checked={formData.permissions.tickets}
                  onChange={() => handlePermissionChange('tickets')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Gestion des tickets</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="permissions_equipment"
                  checked={formData.permissions.equipment}
                  onChange={() => handlePermissionChange('equipment')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Gestion des équipements</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="permissions_users"
                  checked={formData.permissions.users}
                  onChange={() => handlePermissionChange('users')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Gestion des utilisateurs</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="permissions_reports"
                  checked={formData.permissions.reports}
                  onChange={() => handlePermissionChange('reports')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Accès aux rapports</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>{department ? 'Modifier' : 'Ajouter'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentManagement;
