import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Package, Plus, Edit, Trash2, Search, User, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import EquipmentForm from './EquipmentForm';
import { Equipment } from '../../types';

interface EquipmentListProps {
  showFormOnMount?: boolean;
}

const EquipmentList: React.FC<EquipmentListProps> = ({ showFormOnMount = false }) => {
  const { equipment, deleteEquipment, users } = useApp();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(showFormOnMount);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || eq.type === filterType;
    const matchesStatus = !filterStatus || eq.status === filterStatus;
    const matchesLocation = !filterLocation || eq.location.toLowerCase().includes(filterLocation.toLowerCase());
    
    return matchesSearch && matchesType && matchesStatus && matchesLocation;
  });

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet équipement ?')) {
      deleteEquipment(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEquipment(null);
  };

  const handleAssignmentClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowAssignmentModal(true);
  };

  const handleCloseAssignmentModal = () => {
    setShowAssignmentModal(false);
    setSelectedEquipment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponible': return 'bg-green-100 text-green-800';
      case 'En utilisation': return 'bg-blue-100 text-blue-800';
      case 'En panne': return 'bg-red-100 text-red-800';
      case 'En maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Retiré': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Disponible': return <Package className="h-4 w-4 text-green-600" />;
      case 'En utilisation': return <User className="h-4 w-4 text-blue-600" />;
      case 'En panne': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'En maintenance': return <Calendar className="h-4 w-4 text-yellow-600" />;
      case 'Retiré': return <Package className="h-4 w-4 text-gray-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const equipmentTypes = ['PC', 'Laptop', 'Clavier', 'Souris', 'Câble', 'Routeur', 'Switch', 'Serveur', 'Écran', 'Imprimante', 'Autre'];
  const equipmentStatuses = ['Disponible', 'En utilisation', 'En panne', 'En maintenance', 'Retiré'];
  
  // Get unique locations for filtering
  const uniqueLocations = Array.from(new Set(equipment.map(eq => eq.location))).sort();

  if (showForm) {
    return (
      <EquipmentForm
        equipment={editingEquipment}
        onClose={handleCloseForm}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Équipements</h1>
        {(user?.role === 'admin' || user?.role === 'it_personnel') && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un équipement</span>
          </button>
        )}
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white p-6 rounded-lg mb-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            name="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            autoComplete="off"
          >
            <option value="">Tous les types</option>
            {equipmentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            name="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            autoComplete="off"
          >
            <option value="">Tous les statuts</option>
            {equipmentStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            name="filterLocation"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            autoComplete="off"
          >
            <option value="">Tous les emplacements</option>
            {uniqueLocations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            {filteredEquipment.length} équipement(s) trouvé(s)
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
        {filteredEquipment.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Équipement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emplacement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigné à
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEquipment.map((item) => {
                  const assignedUser = users.find(u => u.id === Number(item.assigned_to_id));
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.brand} {item.model}</div>
                          <div className="text-xs text-gray-400">SN: {item.serial_number}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-900">{item.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assignedUser ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="text-sm text-gray-900">{assignedUser.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Non assigné</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(user?.role === 'admin' || user?.role === 'it_personnel') && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAssignmentClick(item)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Gérer l'assignation"
                            >
                              <User className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {user?.role === 'employee' && (
                          <span className="text-sm text-gray-400">View only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun équipement</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par ajouter votre premier équipement.
            </p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Gérer l'assignation - {selectedEquipment.name}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Statut actuel: {selectedEquipment.status}</p>
              <p className="text-sm text-gray-600">Emplacement: {selectedEquipment.location}</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseAssignmentModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  handleEdit(selectedEquipment);
                  handleCloseAssignmentModal();
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentList;