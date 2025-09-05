import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNotification } from '../../context/NotificationContext';
import { Package, Search, Filter, Download, Plus, Edit, Trash2, Eye, CheckCircle, AlertTriangle, Clock, X } from 'lucide-react';
import { Equipment } from '../../types';
import EquipmentForm from './EquipmentForm';

const StockManagement: React.FC = () => {
  const { equipment } = useApp();
  const { showNotification } = useNotification();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterBrand, setFilterBrand] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Filter equipment based on search and filters
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || item.type === filterType;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesBrand = !filterBrand || item.brand === filterBrand;
    
    return matchesSearch && matchesType && matchesStatus && matchesBrand;
  });

  // Get stock equipment (available or in maintenance)
  const stockEquipment = filteredEquipment.filter(item => 
    item.status === 'Disponible' || item.status === 'En maintenance'
  );

  // Get unique values for filters
  const equipmentTypes = Array.from(new Set(equipment.map(e => e.type))).sort();
  const equipmentStatuses = Array.from(new Set(equipment.map(e => e.status))).sort();
  const equipmentBrands = Array.from(new Set(equipment.map(e => e.brand))).sort();

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setShowForm(true);
  };

  const handleDelete = (equipment: Equipment) => {
    setEquipmentToDelete(equipment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (equipmentToDelete) {
      setIsDeleting(true);
      try {
        // This would typically call an API to delete the equipment
        showNotification({
          type: 'success',
          title: 'Équipement supprimé',
          message: `L'équipement ${equipmentToDelete.name} a été supprimé avec succès.`,
        });
        setShowDeleteModal(false);
        setEquipmentToDelete(null);
      } catch (error) {
        console.error('Error deleting equipment:', error);
        showNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Une erreur est survenue lors de la suppression de l\'équipement.',
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEquipment(null);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEquipment(new Set());
      setSelectAll(false);
    } else {
      setSelectedEquipment(new Set(stockEquipment.map(e => e.id)));
      setSelectAll(true);
    }
  };

  const handleSelectEquipment = (equipmentId: number) => {
    const newSelected = new Set(selectedEquipment);
    if (newSelected.has(equipmentId)) {
      newSelected.delete(equipmentId);
    } else {
      newSelected.add(equipmentId);
    }
    setSelectedEquipment(newSelected);
    setSelectAll(newSelected.size === stockEquipment.length);
  };

  const handleBulkDelete = () => {
    if (selectedEquipment.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    try {
      // This would typically call an API to delete multiple equipment
      showNotification({
        type: 'success',
        title: 'Suppression en masse',
        message: `${selectedEquipment.size} équipement(s) ont été supprimé(s) avec succès.`,
      });
      
      setSelectedEquipment(new Set());
      setSelectAll(false);
      setShowBulkDeleteModal(false);
    } catch (error) {
      console.error('Error bulk deleting equipment:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la suppression en masse.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponible': return 'bg-green-100 text-green-800';
      case 'En maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'En utilisation': return 'bg-blue-100 text-blue-800';
      case 'En panne': return 'bg-red-100 text-red-800';
      case 'Retiré': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Disponible': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'En maintenance': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'En utilisation': return <Eye className="w-4 h-4 text-blue-600" />;
      case 'En panne': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'Retiré': return <X className="w-4 h-4 text-gray-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const exportToCSV = () => {
    const headers = ['Nom', 'Type', 'Marque', 'Modèle', 'Numéro de série', 'Statut', 'Emplacement', 'Date d\'achat', 'Fin de garantie'];
    const csvData = stockEquipment.map(item => [
      item.name,
      item.type,
      item.brand,
      item.model,
      item.serial_number,
      item.status,
      item.location,
      item.purchase_date || 'N/A',
      item.warranty_expiry || 'N/A'
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'stock_equipment.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Gestion du stock</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToCSV}
            className="bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 flex items-center space-x-2"
            title="Exporter en CSV"
          >
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
            title="Actualiser la liste"
          >
            <Filter className="h-4 w-4" />
            <span>Actualiser</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un équipement</span>
          </button>
        </div>
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
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              autoComplete="off"
            />
          </div>
          <select
            name="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            autoComplete="off"
          >
            <option value="">Tous les statuts</option>
            {equipmentStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            name="filterBrand"
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            autoComplete="off"
          >
            <option value="">Toutes les marques</option>
            {equipmentBrands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            {stockEquipment.length} équipement(s) en stock
            {stockEquipment.length !== equipment.length && (
              <span className="ml-2 text-gray-400">
                sur {equipment.length} total
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Disponible</p>
              <p className="text-2xl font-bold text-green-600">
                {equipment.filter(e => e.status === 'Disponible').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">En maintenance</p>
              <p className="text-2xl font-bold text-yellow-600">
                {equipment.filter(e => e.status === 'En maintenance').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">En utilisation</p>
              <p className="text-2xl font-bold text-blue-600">
                {equipment.filter(e => e.status === 'En utilisation').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">En panne</p>
              <p className="text-2xl font-bold text-red-600">
                {equipment.filter(e => e.status === 'En panne').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Equipment List */}
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
        {/* Bulk Actions */}
        {selectedEquipment.size > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-800">
                {selectedEquipment.size} équipement(s) sélectionné(s)
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
                onClick={() => setSelectedEquipment(new Set())}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                Annuler la sélection
              </button>
            </div>
          </div>
        )}

        {stockEquipment.length > 0 ? (
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
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Équipement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emplacement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Garantie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockEquipment.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        name={`selectEquipment_${item.id}`}
                        checked={selectedEquipment.has(item.id)}
                        onChange={() => handleSelectEquipment(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.brand} {item.model}</div>
                          <div className="text-xs text-gray-400">SN: {item.serial_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.warranty_expiry ? (
                        <div className="flex items-center space-x-1">
                          <span>{new Date(item.warranty_expiry).toLocaleDateString('fr-FR')}</span>
                          {new Date(item.warranty_expiry) < new Date() && (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Non définie</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Supprimer"
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
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || filterType || filterStatus || filterBrand 
                ? 'Aucun équipement trouvé' 
                : 'Aucun équipement en stock'
              }
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType || filterStatus || filterBrand 
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par ajouter votre premier équipement.'
              }
            </p>
            {searchTerm || filterType || filterStatus || filterBrand ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('');
                  setFilterStatus('');
                  setFilterBrand('');
                }}
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Effacer tous les filtres
              </button>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Ajouter un équipement
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && equipmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Êtes-vous sûr de vouloir supprimer l'équipement <strong>{equipmentToDelete.name}</strong> ?
              </p>
              <p className="text-sm text-gray-500">
                Cette action est irréversible et supprimera définitivement l'équipement.
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
                Êtes-vous sûr de vouloir supprimer {selectedEquipment.size} équipement(s) sélectionné(s) ?
              </p>
              <p className="text-sm text-gray-500">
                Cette action est irréversible et supprimera définitivement les équipements sélectionnés.
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
    </div>
  );
};

export default StockManagement;
