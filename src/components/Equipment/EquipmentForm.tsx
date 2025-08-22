import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Equipment } from '../../types';
import { X, Save, UserPlus, Package, User } from 'lucide-react';

interface EquipmentFormProps {
  equipment: Equipment | null;
  onClose: () => void;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({ equipment, onClose }) => {
  const { addEquipment, updateEquipment, users } = useApp();
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: equipment?.name || '',
    type: equipment?.type || 'PC',
    brand: equipment?.brand || '',
    model: equipment?.model || '',
    serial_number: equipment?.serial_number || '',
    status: equipment?.status || 'Disponible',
    assigned_to: equipment?.assigned_to_id || '',
    location: equipment?.location || '',
    purchase_date: equipment?.purchase_date || '',
    warranty_expiry: equipment?.warranty_expiry || '',
    notes: equipment?.notes || '',
  });

  const [showUserForm, setShowUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'employee' as 'admin' | 'it_personnel' | 'employee',
    department: '',
    password: '',
  });

  const equipmentTypes = ['PC', 'Laptop', 'Clavier', 'Souris', 'Câble', 'Routeur', 'Switch', 'Serveur', 'Écran', 'Imprimante', 'Autre'];
  const equipmentStatuses = ['Disponible', 'En utilisation', 'En panne', 'En maintenance', 'Retiré'];

  // Filter users based on role permissions
  const availableUsers = users.filter(u => {
    if (currentUser?.role === 'admin') return true;
    if (currentUser?.role === 'it_personnel') return u.role !== 'admin';
    return false;
  });

  useEffect(() => {
    // Update status based on assignment
    if (formData.assigned_to === 'stock') {
      setFormData(prev => ({ ...prev, status: 'Disponible' }));
    } else if (formData.assigned_to && formData.assigned_to !== 'stock') {
      setFormData(prev => ({ ...prev, status: 'En utilisation' }));
    }
  }, [formData.assigned_to]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (equipment) {
      updateEquipment(equipment.id, formData);
    } else {
      addEquipment(formData);
    }
    onClose();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    // This would typically call an API to create the user
    // For now, we'll just close the form
    setShowUserForm(false);
    setNewUserData({ name: '', email: '', role: 'employee', department: '', password: '' });
  };

  const getAssignmentLabel = (assignedTo: string) => {
    if (assignedTo === 'stock') return 'Stock';
    if (assignedTo === '') return 'Non assigné';
    const user = users.find(u => u.id.toString() === assignedTo);
    return user ? user.name : 'Utilisateur inconnu';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {equipment ? 'Modifier l\'équipement' : 'Ajouter un équipement'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom de l'équipement *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="ex: PC Bureau Marketing"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type *
              </label>
              <select
                id="type"
                name="type"
                required
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                autoComplete="off"
              >
                {equipmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                Marque *
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                required
                value={formData.brand}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="ex: Dell, HP, Cisco"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                Modèle *
              </label>
              <input
                type="text"
                id="model"
                name="model"
                required
                value={formData.model}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="ex: OptiPlex 7090"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700">
                Numéro de série *
              </label>
              <input
                type="text"
                id="serial_number"
                name="serial_number"
                required
                value={formData.serial_number}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="ex: SN123456789"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Statut *
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                autoComplete="off"
              >
                {equipmentStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
                Assigné à
              </label>
              <div className="mt-1 space-y-2">
                <select
                  id="assigned_to"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  autoComplete="off"
                >
                  <option value="">Non assigné</option>
                  <option value="stock">Stock</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
                
                {/* Assignment Info */}
                {formData.assigned_to && (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                    {formData.assigned_to === 'stock' ? (
                      <Package className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-green-600" />
                    )}
                    <span className="text-sm text-gray-600">
                      Assigné à: {getAssignmentLabel(String(formData.assigned_to))}
                    </span>
                  </div>
                )}

                {/* Create User Button */}
                {(currentUser?.role === 'admin' || currentUser?.role === 'it_personnel') && (
                  <button
                    type="button"
                    onClick={() => setShowUserForm(true)}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Créer un nouvel utilisateur</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Emplacement *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="ex: Bureau 201, Salle serveur"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
                Date d'achat
              </label>
              <input
                type="date"
                id="purchase_date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="warranty_expiry" className="block text-sm font-medium text-gray-700">
                Fin de garantie
              </label>
              <input
                type="date"
                id="warranty_expiry"
                name="warranty_expiry"
                value={formData.warranty_expiry}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="Notes additionnelles..."
              autoComplete="off"
            />
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
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{equipment ? 'Modifier' : 'Ajouter'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Create User Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Créer un nouvel utilisateur</h3>
              <button
                onClick={() => setShowUserForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label htmlFor="newUserName" className="block text-sm font-medium text-gray-700">
                  Nom complet *
                </label>
                <input
                  type="text"
                  id="newUserName"
                  name="newUserName"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  autoComplete="off"
                />
              </div>
              
              <div>
                <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  id="newUserEmail"
                  name="newUserEmail"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  autoComplete="off"
                />
              </div>
              
              <div>
                <label htmlFor="newUserRole" className="block text-sm font-medium text-gray-700">
                  Rôle *
                </label>
                <select
                  id="newUserRole"
                  name="newUserRole"
                  required
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as 'admin' | 'it_personnel' | 'employee' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  autoComplete="off"
                >
                  <option value="employee">Employé</option>
                  <option value="it_personnel">Personnel IT</option>
                  {currentUser?.role === 'admin' && (
                    <option value="admin">Administrateur</option>
                  )}
                </select>
              </div>
              
              <div>
                <label htmlFor="newUserDepartment" className="block text-sm font-medium text-gray-700">
                  Département
                </label>
                <input
                  type="text"
                  id="newUserDepartment"
                  name="newUserDepartment"
                  value={newUserData.department}
                  onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  autoComplete="off"
                />
              </div>
              
              <div>
                <label htmlFor="newUserPassword" className="block text-sm font-medium text-gray-700">
                  Mot de passe temporaire *
                </label>
                <input
                  type="password"
                  id="newUserPassword"
                  name="newUserPassword"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="L'utilisateur devra le changer à la première connexion"
                  autoComplete="new-password"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Créer l'utilisateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentForm;