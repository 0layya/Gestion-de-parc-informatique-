import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  User, 
  LogOut, 
  ChevronDown, 
  Building,
  Bell,
  Package,
  Ticket,
  Users,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, hideNotification, clearAll, isLoading } = useNotification();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Tableau de bord', icon: Building },
      { id: 'tickets', label: 'Tickets', icon: Ticket },
    ];

    if (user?.role === 'admin' || user?.role === 'it_personnel') {
      baseItems.push({ id: 'equipment', label: 'Équipements', icon: Package });
      baseItems.push({ id: 'stock', label: 'Stock', icon: Package });
    }

    if (user?.role === 'admin') {
      baseItems.push({ id: 'users', label: 'Utilisateurs', icon: Users });
      baseItems.push({ id: 'departments', label: 'Départements', icon: Settings });
    }

    return baseItems;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin Système';
      case 'it_personnel': return 'Support IT';
      case 'employee': return 'Employé';
      default: return 'Utilisateur';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return timestamp.toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-blue-200/30 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Left side - Logo and Mobile Menu Button */}
            <div className="flex items-center space-x-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-800 transition-colors duration-200 rounded-lg hover:bg-slate-100/50"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <img 
                  src="/assests/logo.png" 
                  alt="Logo" 
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                />
                <div className="flex-shrink-0">
                  <h1 className="text-base sm:text-lg font-bold" style={{color: '#36446A'}}>
                    Parc Informatique
                  </h1>
                  <p className="text-xs text-slate-500 hidden sm:block"></p>
                </div>
              </div>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center space-x-2">
              {/* Notification Icon */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="relative p-2 text-slate-600 hover:text-slate-800 transition-colors duration-200 rounded-lg hover:bg-slate-100/50"
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-semibold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-modal z-50 max-h-80 sm:max-h-96 overflow-y-auto">
                    <div className="p-4 sm:p-6 border-b border-blue-200/30 bg-gradient-to-r from-blue-50/50 to-blue-100/30">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              console.log('Current notifications:', notifications);
                              console.log('Unread count:', unreadCount);
                              window.dispatchEvent(new CustomEvent('refreshNotifications'));
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                            title="Actualiser les notifications"
                          >
                            Actualiser
                          </button>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                            >
                              Tout marquer comme lu
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button
                              onClick={clearAll}
                              className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
                            >
                              Tout effacer
                            </button>
                          )}
                        </div>
                      </div>
                    <p className="text-sm text-slate-600 mt-2">
                      {isLoading ? 'Chargement...' : (unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Aucune notification')}
                    </p>
                    </div>
                    <div className="divide-y divide-blue-100/50">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-blue-50/30 transition-all duration-200 ${
                              !notification.read ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className={`w-3 h-3 rounded-full mt-2 shadow-sm ${
                                notification.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/30' :
                                notification.type === 'error' ? 'bg-red-500 shadow-red-500/30' :
                                notification.type === 'warning' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-blue-500 shadow-blue-500/30'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-slate-800">{notification.title}</h4>
                                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{notification.message}</p>
                                <p className="text-xs text-slate-500 mt-2 font-medium">
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {!notification.read && (
                                                                  <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                                >
                                  Marquer lu
                                </button>
                                )}
                                <button
                                  onClick={() => hideNotification(notification.id)}
                                  className="text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1 rounded-lg hover:bg-slate-100/50"
                                  title="Close"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100/50 rounded-full flex items-center justify-center">
                            <Bell className="h-8 w-8 text-blue-400" />
                          </div>
                          <p className="text-sm text-slate-600 font-medium">
                            Aucune notification pour le moment
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider - Hidden on small screens */}
              <div className="hidden sm:block w-px h-6 bg-slate-200"></div>

              {/* User Profile Section */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 text-slate-700 hover:text-slate-800 transition-colors duration-200 rounded-lg p-1 sm:p-2 hover:bg-slate-100/50"
                >
                  {/* Avatar */}
                  <div className="relative">
                    {user?.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt="Profile" 
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-600 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* User Info - Hidden on very small screens */}
                  <div className="hidden md:flex flex-col text-left">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-slate-800">
                        {user?.name}
                      </span>
                      <ChevronDown className="h-3 w-3 text-slate-500" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-500 font-medium">
                        {getRoleLabel(user?.role || '')}
                      </span>
                      {user?.department_id && (
                        <>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">
                            {user.department_name || `Dept #${user.department_id}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onPageChange('profile');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <User className="h-4 w-4" />
                        <span>Mon Profil</span>
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Responsive with Toggle */}
        <nav className={`${
          showMobileMenu ? 'block' : 'hidden'
        } lg:block fixed lg:relative inset-y-0 left-0 z-40 glass-sidebar min-h-screen transform transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-16 lg:w-16' : 'w-64 sm:w-72 lg:w-64'
        }`}>
          <div className={`${sidebarCollapsed ? 'p-2' : 'p-4 sm:p-6'}`}>
            {/* Mobile close button */}
            <div className="lg:hidden flex justify-end mb-4">
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors duration-200 rounded-lg hover:bg-slate-100/50"
                title="Fermer le menu"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Desktop Toggle Button */}
            <div className={`hidden lg:flex mb-4 ${sidebarCollapsed ? 'justify-center' : 'justify-end'}`}>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors duration-200 rounded-lg hover:bg-slate-100/50"
                title={sidebarCollapsed ? 'Étendre la barre latérale' : 'Réduire la barre latérale'}
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
            
            <ul className="space-y-2">
              {getMenuItems().map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onPageChange(item.id);
                      setShowMobileMenu(false); 
                    }}
                    className={`w-full flex items-center transition-all duration-300 rounded-xl ${
                      sidebarCollapsed 
                        ? 'justify-center px-2 py-2' 
                        : 'space-x-3 px-3 py-2 sm:space-x-4 sm:px-4 sm:py-3'
                    } text-sm font-semibold ${
                      currentPage === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-700 hover:bg-blue-50/50 hover:text-blue-700'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${currentPage === item.id ? 'text-white' : 'text-slate-600'}`} />
                    {!sidebarCollapsed && (
                      <span className="whitespace-nowrap text-sm sm:text-base">
                        {item.label}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Mobile overlay */}
        {showMobileMenu && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        {/* Main content */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 w-full transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:ml-16' : ''
        }`}>
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;