import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Ticket, Plus, Trash2, Search, User, Clock, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import TicketForm from './TicketForm';
import TicketDetail from './TicketDetail';
import { Ticket as TicketType } from '../../types';

interface TicketListProps {
  showFormOnMount?: boolean;
}

const TicketList: React.FC<TicketListProps> = ({ showFormOnMount = false }) => {
  const { tickets, deleteTicket, users } = useApp();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(showFormOnMount);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredTickets = tickets.filter(ticket => {
    
    if (user?.role === 'employee' && ticket.created_by !== user.id) {
      return false;
    }
    
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || ticket.status === filterStatus;
    const matchesPriority = !filterPriority || ticket.priority === filterPriority;
    const matchesType = !filterType || ticket.type === filterType;
    const matchesAssignee = !filterAssignee || ticket.assigned_to?.toString() === filterAssignee;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesAssignee;
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) {
      deleteTicket(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleViewDetail = (ticket: TicketType) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTicket(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ouvert': return 'bg-blue-100 text-blue-800';
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      case 'En attente': return 'bg-orange-100 text-orange-800';
      case 'Résolu': return 'bg-green-100 text-green-800';
      case 'Fermé': return 'bg-gray-100 text-gray-800';
      case 'Escaladé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Basse': return 'bg-green-100 text-green-800';
      case 'Normale': return 'bg-blue-100 text-blue-800';
      case 'Haute': return 'bg-orange-100 text-orange-800';
      case 'Urgente': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ouvert': return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      case 'En cours': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'En attente': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'Résolu': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Fermé': return <CheckCircle className="h-4 w-4 text-gray-600" />;
      case 'Escaladé': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Basse': return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'Normale': return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      case 'Haute': return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>;
      case 'Urgente': return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  const ticketStatuses = ['Ouvert', 'En cours', 'En attente', 'Résolu', 'Fermé', 'Escaladé'];
  const ticketPriorities = ['Basse', 'Normale', 'Haute', 'Urgente'];
  const ticketTypes = ['Incident', 'Demande', 'Panne', 'Remplacement', 'Installation', 'Maintenance'];
  
  
  const uniqueAssignees = Array.from(new Set(tickets.map(t => t.assigned_to).filter(Boolean))).sort();

  if (showForm) {
    return (
      <TicketForm onClose={handleCloseForm} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Tickets
          </h1>
          <p className="mt-1 text-base sm:text-lg text-slate-600 font-medium">
           
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="enterprise-button flex items-center space-x-2 w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Nouveau Ticket</span>
        </button>
      </div>

      {/* Enhanced Filters */}
      <div className="glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              name="searchTerm"
              placeholder="Chercher tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-10 w-full"
              autoComplete="off"
            />
          </div>
          <select
            name="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="glass-select"
            autoComplete="off"
          >
            <option value="">Tous les statuts</option>
            {ticketStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            name="filterPriority"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="glass-select"
            autoComplete="off"
          >
            <option value="">Toutes priorités</option>
            {ticketPriorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
          <select
            name="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="glass-select"
            autoComplete="off"
          >
            <option value="">Tous les types</option>
            {ticketTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            name="filterAssignee"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="glass-select"
            autoComplete="off"
          >
            <option value="">Tous assignés</option>
            {uniqueAssignees.map(assigneeId => {
              const assignee = users.find(u => u.id === assigneeId);
              return (
                <option key={assigneeId} value={assigneeId?.toString()}>
                  {assignee ? assignee.name : assigneeId}
                </option>
              );
            })}
          </select>
          <div className="text-xs sm:text-sm text-slate-600 flex items-center font-medium col-span-full sm:col-span-1">
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} trouvé{filteredTickets.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="enterprise-table">
        {filteredTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigné à
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
                {filteredTickets.map((item) => {
                  const assignedUser = users.find(u => u.id === item.assigned_to);
                  const createdUser = users.find(u => u.id === item.created_by);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500">#{item.id}</div>
                          <div className="text-xs text-gray-400">Par: {createdUser?.name || 'Inconnu'}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(item.priority)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.type}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetail(item)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
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
            <Ticket className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun ticket</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre premier ticket.
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails du ticket #{selectedTicket.id}
                </h3>
                <button
                  onClick={handleCloseDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fermer</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <TicketDetail ticket={selectedTicket} onClose={handleCloseDetailModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketList;