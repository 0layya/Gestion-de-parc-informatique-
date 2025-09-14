export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'it_personnel' | 'employee';
  department_id?: number | null;
  department_name?: string; 
  avatar_url?: string;
  created_at: string;
  created_by?: number;
}

export interface UserFormData extends Omit<User, 'id' | 'created_at'> {
  password?: string;
  department_id?: number | null;
}

export interface Equipment {
  id: number;
  name: string;
  type: 'PC' | 'Laptop' | 'Clavier' | 'Souris' | 'Câble' | 'Routeur' | 'Switch' | 'Serveur' | 'Écran' | 'Imprimante' | 'Autre';
  brand: string;
  model: string;
  serial_number: string;
  status: 'Disponible' | 'En utilisation' | 'En panne' | 'En maintenance' | 'Retiré';
  assigned_to_id?: number;
  department_id?: number;
  department_name?: string; 
  location: string;
  purchase_date: string;
  warranty_expiry?: string;
  notes?: string;
  created_at: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  type: 'Incident' | 'Demande' | 'Panne' | 'Remplacement' | 'Installation' | 'Maintenance';
  priority: 'Basse' | 'Normale' | 'Haute' | 'Urgente';
  status: 'Ouvert' | 'En cours' | 'Résolu' | 'Fermé' | 'Escaladé' | 'En attente';
  created_by: number;
  assigned_to?: number;
  equipment_id?: number;
  department_id?: number;
  target_department_id?: number;
  department_name?: string; 
  target_department_name?: string; 
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  creator_name?: string;
  assignee_name?: string;
  equipment_name?: string;
}

export interface TicketComment {
  id: number;
  content: string;
  author_id: number;
  author_name: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  manager_id?: number;
  permissions: {
    tickets: boolean;
    equipment: boolean;
    users: boolean;
    reports: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface DepartmentFormData extends Omit<Department, 'id' | 'created_at' | 'updated_at'> {
  manager_id?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}