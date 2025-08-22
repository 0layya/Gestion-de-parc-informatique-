import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import EquipmentList from './components/Equipment/EquipmentList';
import TicketList from './components/Tickets/TicketList';
import UserManagement from './components/Users/UserManagement';
import Profile from './components/Users/Profile';
import DepartmentManagement from './components/Users/DepartmentManagement';
import StockManagement from './components/Equipment/StockManagement';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated) {
    return isLoginMode ? (
      <Login onToggleMode={() => setIsLoginMode(false)} />
    ) : (
      <Register onToggleMode={() => setIsLoginMode(true)} />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onPageChange={setCurrentPage} />;
      case 'equipment':
        return <EquipmentList />;
      case 'tickets':
        return <TicketList />;
      case 'users':
        return <UserManagement />;
      case 'profile':
        return <Profile />;
      case 'departments':
        return <DepartmentManagement />;
      case 'stock':
        return <StockManagement />;
      case 'create-ticket':
        return <TicketList showFormOnMount={true} />;
      case 'add-equipment':
        return <EquipmentList showFormOnMount={true} />;
      case 'create-user':
        return <UserManagement showFormOnMount={true} />;
      default:
        return <Dashboard onPageChange={setCurrentPage} />;
    }
  };

  return (
    <AppProvider isAuthenticated={isAuthenticated}>
      <NotificationProvider>
        <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
          {renderPage()}
        </Layout>
      </NotificationProvider>
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;