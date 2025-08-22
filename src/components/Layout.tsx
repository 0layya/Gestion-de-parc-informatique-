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
  const { notifications, unreadCount, markAsRead, markAllAsRead, hideNotification, clearAll } = useNotification();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-orange-400 hover:text-white transition-colors rounded-md hover:bg-orange-500/20"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              
              {/* Logo */}
              <div className="flex-shrink-0">
                <h1 className="text-lg font-bold text-orange-500 font-mono uppercase tracking-wider">
                  Gestionaire de département IT
                </h1>
              </div>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notification Icon */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="relative p-2 text-orange-400 hover:text-white transition-colors rounded-md hover:bg-orange-500/20"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                        <div className="flex items-center space-x-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Tout marquer comme lu
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button
                              onClick={clearAll}
                              className="text-xs text-red-600 hover:text-red-800 underline"
                            >
                              Tout effacer
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Aucune notification'}
                      </p>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 hover:bg-gray-50 ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                notification.type === 'success' ? 'bg-green-500' :
                                notification.type === 'error' ? 'bg-red-500' :
                                notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Marquer lu
                                  </button>
                                )}
                                <button
                                  onClick={() => hideNotification(notification.id)}
                                  className="text-gray-400 hover:text-gray-600"
                                  title="Fermer"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500">
                            Aucune notification pour le moment
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider - Hidden on small screens */}
              <div className="hidden sm:block w-px h-6 bg-gray-600"></div>

              {/* User Profile Section */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 sm:space-x-3 text-white hover:text-orange-400 transition-colors rounded-md p-2 hover:bg-orange-500/20"
                >
                  {/* Avatar */}
                  <div className="relative">
                    {user?.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover border-2 border-orange-500"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* User Info - Hidden on very small screens */}
                  <div className="hidden sm:flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {user?.name}
                      </span>
                      <ChevronDown className="h-3 w-3 text-orange-400" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-orange-400 font-mono uppercase">
                        {getRoleLabel(user?.role || '')}
                      </span>
                      {user?.department_id && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">
                            {user.department_name || `Département #${user.department_id}`}
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
        } lg:block fixed lg:relative inset-y-0 left-0 z-40 bg-gray-100 border-r-2 border-black min-h-screen transform transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'w-16 lg:w-16' : 'w-64 lg:w-48'
        }`}>
          <div className="p-3">
            {/* Mobile close button */}
            <div className="lg:hidden flex justify-end mb-4">
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Desktop Toggle Button */}
            <div className="hidden lg:flex justify-end mb-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-200"
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
                      setShowMobileMenu(false); // Close mobile menu on navigation
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-mono uppercase tracking-wider transition-colors rounded-md ${
                      currentPage === item.id
                        ? 'bg-orange-500 text-black border border-black shadow-sm'
                        : 'text-black hover:bg-white border border-transparent hover:border-gray-300'
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className={`whitespace-nowrap ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                      {item.label}
                    </span>
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
        <main className={`flex-1 p-4 w-full transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'lg:ml-16' : ''
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;