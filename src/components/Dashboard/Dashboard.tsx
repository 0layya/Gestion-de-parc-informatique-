import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  Ticket, 
  Package, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Building,
  Database,
  BarChart3
} from 'lucide-react';

interface DashboardProps {
  onPageChange: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onPageChange }) => {
  const { user } = useAuth();
  const { tickets, equipment, users } = useApp();

  const getStats = () => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'Ouvert').length;
    const resolvedTickets = tickets.filter(t => t.status === 'Résolu').length;
    const closedTickets = tickets.filter(t => t.status === 'Fermé').length;
    const escalatedTickets = tickets.filter(t => t.status === 'Escaladé').length;
    const urgentTickets = tickets.filter(t => t.priority === 'Urgente').length;
    const highPriorityTickets = tickets.filter(t => t.priority === 'Haute').length;
    
    const totalEquipment = equipment.length;
    const availableEquipment = equipment.filter(e => e.status === 'Disponible').length;
    const inUseEquipment = equipment.filter(e => e.status === 'En utilisation').length;
    const maintenanceEquipment = equipment.filter(e => e.status === 'En maintenance').length;
    const brokenEquipment = equipment.filter(e => e.status === 'En panne').length;
    
    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const itPersonnel = users.filter(u => u.role === 'it_personnel').length;
    const employeeUsers = users.filter(u => u.role === 'employee').length;
    
    // Calculer le nombre de tickets créés par l'utilisateur connecté s'il est employé
    const myTickets = user?.role === 'employee' 
      ? tickets.filter(t => t.created_by === user.id).length 
      : 0;
    
    return {
      tickets: {
        total: totalTickets,
        open: openTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
        escalated: escalatedTickets,
        urgent: urgentTickets,
        high: highPriorityTickets,
        myTickets
      },
      equipment: {
        total: totalEquipment,
        available: availableEquipment,
        inUse: inUseEquipment,
        maintenance: maintenanceEquipment,
        broken: brokenEquipment
      },
      users: {
        total: totalUsers,
        admins: adminUsers,
        itPersonnel,
        employees: employeeUsers
      }
    };
  };

  const stats = getStats();

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; isPositive: boolean };
    subtitle?: string;
  }> = ({ title, value, icon, color, trend, subtitle }) => (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${color} shadow-sm`}>
            {icon}
          </div>
          <div className="ml-3">
            <p className="text-xs sm:text-sm font-semibold text-slate-600">{title}</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-800">{value}</p>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center text-xs sm:text-sm font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`} />
            {trend.value}%
          </div>
        )}
      </div>
    </div>
  );

  const ProgressBar: React.FC<{
    label: string;
    value: number;
    total: number;
    color: string;
  }> = ({ label, value, total, color }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">{label}</span>
          <span className="text-xs font-medium text-gray-900">{value}/{total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const ChartCard: React.FC<{
    title: string;
    children: React.ReactNode;
    className?: string;
  }> = ({ title, children, className = '' }) => (
    <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center mb-3">
        <BarChart3 className="w-4 h-4 text-gray-600 mr-2" />
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const recentTickets = tickets
    .filter(t => user?.role === 'employee' ? t.created_by === user.id : true)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ouvert': return 'bg-blue-100 text-blue-800';
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      case 'Résolu': return 'bg-green-100 text-green-800';
      case 'Fermé': return 'bg-gray-100 text-gray-800';
      case 'Escaladé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente': return 'bg-red-100 text-red-800';
      case 'Haute': return 'bg-orange-100 text-orange-800';
      case 'Normale': return 'bg-blue-100 text-blue-800';
      case 'Basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Tableau de Bord
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium mt-1">
            Bienvenue, {user?.name}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500 bg-blue-50/50 px-3 py-2 rounded-lg backdrop-blur-sm">
          <Database className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
          <span className="font-medium">Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}</span>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Tickets"
          value={stats.tickets.total}
          icon={<Ticket className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
          subtitle={`${stats.tickets.open} ouverts`}
        />
        <StatCard
          title="Équipements"
          value={stats.equipment.total}
          icon={<Package className="h-5 w-5 text-green-600" />}
          color="bg-green-100"
          subtitle={`${stats.equipment.available} disponibles`}
        />
        {user?.role === 'admin' || user?.role === 'it_personnel' ? (
          <StatCard
            title="Utilisateurs"
            value={stats.users.total}
            icon={<Users className="h-5 w-5 text-indigo-600" />}
            color="bg-indigo-100"
            subtitle={`${stats.users.admins} admins`}
          />
        ) : (
          <StatCard
            title="Mes Tickets"
            value={stats.tickets.open}
            icon={<Ticket className="h-5 w-5 text-purple-600" />}
            color="bg-purple-100"
            subtitle="En cours"
          />
        )}
        {stats.tickets.urgent > 0 && (
          <StatCard
            title="Urgents"
            value={stats.tickets.urgent}
            icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
            color="bg-red-100"
          />
        )}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Equipment Status */}
        {(user?.role === 'admin' || user?.role === 'it_personnel') && (
          <div className="glass-card p-4 rounded-xl h-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">État des Équipements</h3>
            <div className="space-y-3">
              <ProgressBar 
                label="Disponible" 
                value={stats.equipment.available} 
                total={stats.equipment.total} 
                color="bg-green-500" 
              />
              <ProgressBar 
                label="En utilisation" 
                value={stats.equipment.inUse} 
                total={stats.equipment.total} 
                color="bg-blue-500" 
              />
              <ProgressBar 
                label="En maintenance" 
                value={stats.equipment.maintenance} 
                total={stats.equipment.total} 
                color="bg-yellow-500" 
              />
              <ProgressBar 
                label="En panne" 
                value={stats.equipment.broken} 
                total={stats.equipment.total} 
                color="bg-red-500" 
              />
            </div>
          </div>
        )}

        {/* Ticket Priority */}
        <div className="glass-card p-4 rounded-xl h-full">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Répartition des Priorités</h3>
          <div className="space-y-3">
            <ProgressBar 
              label="Urgente" 
              value={stats.tickets.urgent} 
              total={stats.tickets.total} 
              color="bg-red-500" 
            />
            <ProgressBar 
              label="Haute" 
              value={stats.tickets.high} 
              total={stats.tickets.total} 
              color="bg-orange-500" 
            />
            <ProgressBar 
              label="Normale" 
              value={stats.tickets.total - stats.tickets.urgent - stats.tickets.high} 
              total={stats.tickets.total} 
              color="bg-blue-500" 
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-4 rounded-xl h-full">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Actions Rapides</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors" onClick={() => onPageChange('create-ticket')}>
              + Créer un ticket
            </button>
            {(user?.role === 'admin' || user?.role === 'it_personnel') && (
              <button className="w-full text-left p-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors" onClick={() => onPageChange('add-equipment')}>
                + Ajouter un équipement
              </button>
            )}
            {user?.role === 'admin' && (
              <button className="w-full text-left p-2 text-sm text-purple-600 hover:bg-blue-50 rounded-md transition-colors" onClick={() => onPageChange('create-user')}>
                + Créer un utilisateur
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      {(user?.role === 'admin' || user?.role === 'it_personnel') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Equipment Breakdown */}
          <div className="glass-card p-4 rounded-xl">
            <h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2 text-blue-600" />
              Équipements
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Disponible</span>
                <span className="font-medium text-green-600">{stats.equipment.available}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">En utilisation</span>
                <span className="font-medium text-blue-600">{stats.equipment.inUse}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">En maintenance</span>
                <span className="font-medium text-yellow-600">{stats.equipment.maintenance}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">En panne</span>
                <span className="font-medium text-red-600">{stats.equipment.broken}</span>
              </div>
            </div>
          </div>

          {/* User Breakdown */}
          {user?.role === 'admin' && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-600" />
                Utilisateurs
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Administrateurs</span>
                  <span className="font-medium text-purple-600">{stats.users.admins}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Personnel IT</span>
                  <span className="font-medium text-blue-600">{stats.users.itPersonnel}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Employés</span>
                  <span className="font-medium text-green-600">{stats.users.employees}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Total</span>
                  <span className="font-medium text-gray-900">{stats.users.total}</span>
                </div>
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Building className="w-4 h-4 mr-2 text-gray-600" />
              Statut Système
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Serveur</span>
                <span className="font-medium text-green-600">En ligne</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Base de données</span>
                <span className="font-medium text-green-600">Connectée</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">API</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Tickets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 flex items-center">
            <Ticket className="w-4 h-4 mr-2 text-purple-600" />
            Tickets récents
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTickets.length > 0 ? (
            recentTickets.map((ticket) => {
              const creator = users.find(u => u.id === ticket.created_by);
              return (
                <button
                  key={ticket.id}
                  onClick={() => onPageChange('tickets')}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {ticket.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          Par {creator?.name || 'Utilisateur inconnu'}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center">
              <Ticket className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun ticket</h3>
              <p className="mt-1 text-xs text-gray-500">
                Aucun ticket n'a été créé pour le moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;