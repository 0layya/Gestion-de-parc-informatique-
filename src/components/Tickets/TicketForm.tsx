import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { X, Send, Building } from 'lucide-react';

interface TicketFormProps {
  onClose: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({ onClose }) => {
  const { createTicket, equipment, departments } = useApp();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Incident' as const,
    priority: 'Normale' as const,
    equipment_id: '',
    target_department_id: '',
  });

  const ticketTypes = ['Incident', 'Demande', 'Panne', 'Remplacement', 'Installation', 'Maintenance'];
  const ticketPriorities = ['Urgente', 'Haute', 'Normale', 'Basse'];

  
  const userDepartment = departments.find(d => d.id === user?.department_id);
  
  
  const availableTargetDepartments = departments.filter(dept => {
    if (user?.role === 'admin' || user?.role === 'it_personnel') {
      return true; 
    }
    return dept.id === user?.department_id || dept.name === 'IT'; 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEquipmentChange = (equipmentId: string) => {
    const selectedEquipment = equipment.find(eq => eq.id === Number(equipmentId));
    setFormData({
      ...formData,
      equipment_id: equipmentId,
      
      target_department_id: selectedEquipment?.department_id?.toString() || user?.department_id?.toString() || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    
    const ticketData = {
      ...formData,
      status: 'Ouvert' as const,
      created_by: Number(user.id),
      equipment_id: formData.equipment_id ? Number(formData.equipment_id) : undefined,
      department_id: user.department_id || undefined, 
      target_department_id: formData.target_department_id ? Number(formData.target_department_id) : user.department_id || undefined,
      assigned_to: undefined, 
    };

    console.log('User object:', user);
    console.log('User ID type:', typeof user.id, 'Value:', user.id);
    console.log('Submitting ticket data:', ticketData);
    
    
    if (!ticketData.created_by || isNaN(ticketData.created_by)) {
      console.error('Invalid user ID:', ticketData.created_by);
      alert('Erreur: ID utilisateur invalide');
      return;
    }
    
    createTicket(ticketData);
    onClose();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Créer un ticket
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
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Titre *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="Décrivez brièvement le problème ou la demande"
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="Décrivez en détail le problème, les étapes pour le reproduire, ou la demande spécifique"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {ticketTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priorité *
              </label>
              <select
                id="priority"
                name="priority"
                required
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                autoComplete="off"
              >
                {ticketPriorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="equipment_id" className="block text-sm font-medium text-gray-700">
                Équipement concerné
              </label>
              <select
                id="equipment_id"
                name="equipment_id"
                value={formData.equipment_id}
                onChange={(e) => handleEquipmentChange(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                autoComplete="off"
              >
                <option value="">Sélectionner un équipement</option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} - {eq.serial_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="target_department_id" className="block text-sm font-medium text-gray-700">
                Département cible *
              </label>
              <select
                id="target_department_id"
                name="target_department_id"
                required
                value={formData.target_department_id}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                autoComplete="off"
              >
                <option value="">Sélectionner un département</option>
                {availableTargetDepartments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {user?.role === 'admin' || user?.role === 'it_personnel' 
                  ? 'Vous pouvez cibler n\'importe quel département'
                  : 'Vous pouvez cibler votre département ou le département IT'
                }
              </p>
            </div>
          </div>

          {userDepartment && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Département de création: {userDepartment.name}
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Ce ticket sera créé depuis votre département ({userDepartment.name}) et sera automatiquement assigné au département cible sélectionné.
              </p>
            </div>
          )}

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
              <Send className="h-4 w-4" />
              <span>Créer le ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;