import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { equipmentAPI, ticketsAPI, usersAPI, departmentsAPI } from '../services/api';
import { Equipment, Ticket, User, UserFormData, Department, DepartmentFormData } from '../types';

interface AppState {
  equipment: Equipment[];
  tickets: Ticket[];
  users: User[];
  departments: Department[];
}

interface AppContextType extends AppState {
  addEquipment: (equipment: Omit<Equipment, 'id' | 'created_at'>) => Promise<void>;
  updateEquipment: (id: number, updates: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: number) => Promise<void>;
  createTicket: (ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTicket: (id: number, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: number) => Promise<void>;
  addTicketComment: (ticketId: number, content: string) => Promise<void>;
  createUser: (user: UserFormData) => Promise<void>;
  updateUser: (id: number, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  createDepartment: (department: DepartmentFormData) => Promise<void>;
  updateDepartment: (id: number, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: number) => Promise<void>;
  loadUsers: () => void;
  loadData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type AppAction =
  | { type: 'SET_EQUIPMENT'; payload: Equipment[] }
  | { type: 'SET_TICKETS'; payload: Ticket[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_DEPARTMENTS'; payload: Department[] }
  | { type: 'ADD_EQUIPMENT'; payload: Equipment }
  | { type: 'UPDATE_EQUIPMENT'; payload: { id: number; updates: Partial<Equipment> } }
  | { type: 'DELETE_EQUIPMENT'; payload: number }
  | { type: 'CREATE_TICKET'; payload: Ticket }
  | { type: 'UPDATE_TICKET'; payload: { id: number; updates: Partial<Ticket> } }
  | { type: 'DELETE_TICKET'; payload: number }
  | { type: 'CREATE_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: { id: number; updates: Partial<User> } }
  | { type: 'DELETE_USER'; payload: number }
  | { type: 'CREATE_DEPARTMENT'; payload: Department }
  | { type: 'UPDATE_DEPARTMENT'; payload: { id: number; updates: Partial<Department> } }
  | { type: 'DELETE_DEPARTMENT'; payload: number };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_EQUIPMENT':
      return {
        ...state,
        equipment: action.payload,
      };
    case 'SET_TICKETS':
      return {
        ...state,
        tickets: action.payload,
      };
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      };
    case 'SET_DEPARTMENTS':
      return {
        ...state,
        departments: action.payload,
      };
    case 'ADD_EQUIPMENT':
      return {
        ...state,
        equipment: [...state.equipment, action.payload],
      };
    case 'UPDATE_EQUIPMENT':
      return {
        ...state,
        equipment: state.equipment.map(eq =>
          eq.id === action.payload.id ? { ...eq, ...action.payload.updates } : eq
        ),
      };
    case 'DELETE_EQUIPMENT':
      return {
        ...state,
        equipment: state.equipment.filter(eq => eq.id !== action.payload),
      };
    case 'CREATE_TICKET':
      return {
        ...state,
        tickets: [...state.tickets, action.payload],
      };
    case 'UPDATE_TICKET':
      return {
        ...state,
        tickets: state.tickets.map(ticket =>
          ticket.id === action.payload.id ? { ...ticket, ...action.payload.updates } : ticket
        ),
      };
    case 'DELETE_TICKET':
      return {
        ...state,
        tickets: state.tickets.filter(ticket => ticket.id !== action.payload),
      };
    case 'CREATE_USER':
      return {
        ...state,
        users: [...state.users, action.payload],
      };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id ? { ...user, ...action.payload.updates } : user
        ),
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
      };
    case 'CREATE_DEPARTMENT':
      return {
        ...state,
        departments: [...state.departments, action.payload],
      };
    case 'UPDATE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.map(dept =>
          dept.id === action.payload.id ? { ...dept, ...action.payload.updates } : dept
        ),
      };
    case 'DELETE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.filter(dept => dept.id !== action.payload),
      };
    default:
      return state;
  }
}

export const AppProvider: React.FC<{ 
  children: React.ReactNode;
  isAuthenticated: boolean;
}> = ({ children, isAuthenticated }) => {
  const [state, dispatch] = useReducer(appReducer, {
    equipment: [],
    tickets: [],
    users: [],
    departments: [
      {
        id: 1,
        name: 'IT',
        description: 'Département des technologies de l\'information',
        manager_id: undefined,
        permissions: {
          tickets: true,
          equipment: true,
          users: false,
          reports: true
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Marketing',
        description: 'Département marketing et communication',
        manager_id: undefined,
        permissions: {
          tickets: true,
          equipment: false,
          users: false,
          reports: false
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        name: 'RH',
        description: 'Département des ressources humaines',
        manager_id: undefined,
        permissions: {
          tickets: true,
          equipment: false,
          users: false,
          reports: false
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 4,
        name: 'Finance',
        description: 'Département financier',
        manager_id: undefined,
        permissions: {
          tickets: true,
          equipment: false,
          users: false,
          reports: true
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
  });

  useEffect(() => {
    // Only load data if user is authenticated
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      console.log('Loading data...');
      console.log('Token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      const [equipmentRes, ticketsRes, usersRes, departmentsRes] = await Promise.all([
        equipmentAPI.getAll(),
        ticketsAPI.getAll(),
        usersAPI.getAll(),
        departmentsAPI.getAll(),
      ]);
      
      console.log('Data loaded successfully');
      dispatch({ type: 'SET_EQUIPMENT', payload: equipmentRes.data });
      dispatch({ type: 'SET_TICKETS', payload: ticketsRes.data });
      dispatch({ type: 'SET_USERS', payload: usersRes.data });
      dispatch({ type: 'SET_DEPARTMENTS', payload: departmentsRes.data });
    } catch (error: unknown) {
      console.error('Error loading data:', error);
    }
  };

  const addEquipment = async (equipmentData: Omit<Equipment, 'id' | 'created_at'>) => {
    try {
      const response = await equipmentAPI.create(equipmentData);
      dispatch({ type: 'ADD_EQUIPMENT', payload: response.data });
    } catch (error) {
      console.error('Add equipment error:', error);
    }
  };

  const updateEquipment = async (id: number, updates: Partial<Equipment>) => {
    try {
      await equipmentAPI.update(id.toString(), updates);
      dispatch({ type: 'UPDATE_EQUIPMENT', payload: { id, updates } });
    } catch (error) {
      console.error('Update equipment error:', error);
    }
  };

  const deleteEquipment = async (id: number) => {
    try {
      await equipmentAPI.delete(id.toString());
      dispatch({ type: 'DELETE_EQUIPMENT', payload: id });
    } catch (error) {
      console.error('Delete equipment error:', error);
    }
  };

  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await ticketsAPI.create(ticketData);
      const newTicket = response.data;
      
      // Add the new ticket to state
      dispatch({ type: 'CREATE_TICKET', payload: newTicket });

      // Send notifications to relevant department employees
      await sendTicketNotifications(newTicket);
    } catch (error) {
      console.error('Create ticket error:', error);
    }
  };

  const sendTicketNotifications = async (ticket: Ticket) => {
    try {
      // Get all users who should be notified about this ticket
      const usersToNotify = state.users.filter(user => {
        // IT admin and personnel get all tickets
        if (user.role === 'admin' || user.role === 'it_personnel') {
          return true;
        }
        
        // Other users only get tickets from their department
        if (ticket.target_department_id && user.department_id === ticket.target_department_id) {
          return true;
        }
        
        // Users also get tickets created in their own department
        if (ticket.department_id && user.department_id === ticket.department_id) {
          return true;
        }
        
        return false;
      });

      // Send notifications to each relevant user
      for (const user of usersToNotify) {
        // Skip the ticket creator
        if (user.id === ticket.created_by) continue;

        const notificationData = {
          user_id: user.id,
          type: 'info' as const,
          title: 'Nouveau ticket créé',
          message: `Un nouveau ticket "${ticket.title}" a été créé et ciblé vers votre département.`,
        };

        // In a real app, this would call the notifications API
        // For now, we'll just log it
        console.log('Sending notification to user:', user.name, notificationData);
      }
    } catch (error) {
      console.error('Error sending ticket notifications:', error);
    }
  };

  const updateTicket = async (id: number, updates: Partial<Ticket>) => {
    try {
      const response = await ticketsAPI.update(id.toString(), updates);
      dispatch({ type: 'UPDATE_TICKET', payload: { id, updates: response.data } });
    } catch (error) {
      console.error('Update ticket error:', error);
    }
  };

  const deleteTicket = async (id: number) => {
    try {
      await ticketsAPI.delete(id.toString());
      dispatch({ type: 'DELETE_TICKET', payload: id });
    } catch (error) {
      console.error('Delete ticket error:', error);
    }
  };

  const addTicketComment = async (ticketId: number, content: string) => {
    try {
      await ticketsAPI.addComment(ticketId.toString(), content);
      // Reload tickets to get updated data
      const response = await ticketsAPI.getAll();
      dispatch({ type: 'SET_TICKETS', payload: response.data });
    } catch (error) {
      console.error('Add comment error:', error);
    }
  };

  const createUser = async (userData: UserFormData) => {
    try {
      const response = await usersAPI.create(userData);
      dispatch({ type: 'CREATE_USER', payload: response.data });
      // Reload users to get updated data
      const usersRes = await usersAPI.getAll();
      dispatch({ type: 'SET_USERS', payload: usersRes.data });
    } catch (error) {
      console.error('Create user error:', error);
    }
  };

  const updateUser = async (id: number, updates: Partial<User>) => {
    try {
      const response = await usersAPI.update(id.toString(), updates);
      dispatch({ type: 'UPDATE_USER', payload: { id, updates: response.data } });
      // Reload users to get updated data
      const usersRes = await usersAPI.getAll();
      dispatch({ type: 'SET_USERS', payload: usersRes.data });
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await usersAPI.delete(id.toString());
      dispatch({ type: 'DELETE_USER', payload: id });
    } catch (error) {
      console.error('Delete user error:', error);
    }
  };

  const createDepartment = async (departmentData: DepartmentFormData) => {
    try {
      const response = await departmentsAPI.create(departmentData);
      dispatch({ type: 'CREATE_DEPARTMENT', payload: response.data });
      // Reload departments to ensure freshness
      const departmentsRes = await departmentsAPI.getAll();
      dispatch({ type: 'SET_DEPARTMENTS', payload: departmentsRes.data });
    } catch (error) {
      console.error('Create department error:', error);
    }
  };

  const updateDepartment = async (id: number, updates: Partial<Department>) => {
    try {
      const response = await departmentsAPI.update(id.toString(), updates as DepartmentFormData);
      dispatch({ type: 'UPDATE_DEPARTMENT', payload: { id, updates: response.data } });
      // Reload departments to ensure consistency
      const departmentsRes = await departmentsAPI.getAll();
      dispatch({ type: 'SET_DEPARTMENTS', payload: departmentsRes.data });
    } catch (error) {
      console.error('Update department error:', error);
    }
  };

  const deleteDepartment = async (id: number) => {
    try {
      await departmentsAPI.delete(id.toString());
      dispatch({ type: 'DELETE_DEPARTMENT', payload: id });
      // Reload departments after deletion
      const departmentsRes = await departmentsAPI.getAll();
      dispatch({ type: 'SET_DEPARTMENTS', payload: departmentsRes.data });
    } catch (error) {
      console.error('Delete department error:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_USERS', payload: data });
      }
    } catch (error: unknown) {
      console.error('Error loading users:', error);
    }
  };

  return (
    <AppContext.Provider value={{
      ...state,
      addEquipment,
      updateEquipment,
      deleteEquipment,
      createTicket,
      updateTicket,
      deleteTicket,
      addTicketComment,
      createUser,
      updateUser,
      deleteUser,
      createDepartment,
      updateDepartment,
      deleteDepartment,
      loadUsers,
      loadData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};