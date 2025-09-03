import React, { useState } from 'react';
import { User, UserFormData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { X, Save, Plus } from 'lucide-react';

interface UserFormProps {
  user: User | null;
  onSubmit: (userData: UserFormData) => Promise<void>;
  onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onClose }) => {
  const { user: currentUser } = useAuth();
  const { departments, createDepartment } = useApp();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'employee',
    department_id: user?.department_id || '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewDepartmentForm, setShowNewDepartmentForm] = useState(false);
  const [newDepartmentData, setNewDepartmentData] = useState({
    name: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'department_id' ? Number(e.target.value) || undefined : e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate passwords match for new users
      if (!user && formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        setLoading(false);
        return;
      }

      // Validate password strength for new users
      if (!user && formData.password && formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        setLoading(false);
        return;
      }

      const { password, confirmPassword: _confirmPassword, ...userData } = formData;
      
      // Ensure department_id is properly typed
      const finalUserData = {
        ...userData,
        department_id: userData.department_id ? Number(userData.department_id) : undefined
      };
      
      if (!user) {
        // For new users, include password
        await onSubmit({ ...finalUserData, password });
      } else {
        // For existing users, don't include password
        await onSubmit(finalUserData);
      }
    } catch {
      setError('Une erreur est survenue lors de la sauvegarde de l\'utilisateur');
    }

    setLoading(false);
  };

  const handleCreateDepartment = async () => {
    if (!newDepartmentData.name.trim()) return;
    
    try {
      await createDepartment({
        name: newDepartmentData.name,
        description: newDepartmentData.description,
        permissions: {
          tickets: true,
          equipment: false,
          users: false,
          reports: false
        }
      });
      
      // Find the newly created department to get its ID
      const newDept = departments.find(d => d.name === newDepartmentData.name);
      if (newDept) {
        setFormData(prev => ({ ...prev, department_id: newDept.id }));
      }
      
      setShowNewDepartmentForm(false);
      setNewDepartmentData({ name: '', description: '' });
    } catch {
      setError('Erreur lors de la création du département');
    }
  };

  const getAvailableRoles = () => {
    if (currentUser?.role === 'admin') {
      return [
        { value: 'admin', label: 'Administrateur' },
        { value: 'it_personnel', label: 'Personnel IT' },
        { value: 'employee', label: 'Employé' },
      ];
    } else if (currentUser?.role === 'it_personnel') {
      return [
        { value: 'employee', label: 'Employé' },
      ];
    }
    return [];
  };

  const availableRoles = getAvailableRoles();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {user ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom complet *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="Nom complet de l'utilisateur"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="Email professionnel"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rôle *
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                autoComplete="off"
              >
                {availableRoles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Département
              </label>
              <div className="mt-1">
                <select
                  id="department_id"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  autoComplete="off"
                >
                  <option value="">Sélectionner un département</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                
                {!showNewDepartmentForm ? (
                  <button
                    type="button"
                    onClick={() => setShowNewDepartmentForm(true)}
                    className="mt-2 text-sm text-orange-600 hover:text-orange-700 flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Créer un nouveau département</span>
                  </button>
                ) : (
                  <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="newDepartmentName" className="block text-xs font-medium text-gray-700">
                          Nom du département *
                        </label>
                        <input
                          type="text"
                          id="newDepartmentName"
                          name="newDepartmentName"
                          value={newDepartmentData.name}
                          onChange={(e) => setNewDepartmentData(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                          placeholder="ex: RH, Finance, Ventes"
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label htmlFor="newDepartmentDescription" className="block text-xs font-medium text-gray-700">
                          Description
                        </label>
                        <input
                          type="text"
                          id="newDepartmentDescription"
                          name="newDepartmentDescription"
                          value={newDepartmentData.description}
                          onChange={(e) => setNewDepartmentData(prev => ({ ...prev, description: e.target.value }))}
                          className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Description du département"
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleCreateDepartment}
                          disabled={!newDepartmentData.name.trim()}
                          className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                          Créer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewDepartmentForm(false);
                            setNewDepartmentData({ name: '', description: '' });
                          }}
                          className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!user && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    placeholder="Mot de passe"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    placeholder="Confirmer le mot de passe"
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Informations de connexion</h4>
            <p className="text-sm text-gray-600">
              {user ? 'Modifiez les informations de l\'utilisateur.' : 'L\'utilisateur pourra se connecter avec l\'email et le mot de passe fournis.'}
            </p>
            {!user && (
              <p className="text-xs text-gray-500 mt-1">
                Assurez-vous de communiquer ces informations de connexion à l'utilisateur de manière sécurisée.
              </p>
            )}
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
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Création...' : (user ? 'Modifier' : 'Créer')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;