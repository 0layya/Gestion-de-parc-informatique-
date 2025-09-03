import React, { createContext, useContext, useReducer } from 'react';
import { authAPI, usersAPI } from '../services/api';
import { User, AuthState, UserFormData } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: UserFormData) => Promise<{ success: boolean; error?: string }>;
  createUser: (userData: UserFormData, createdBy: number) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  updatePassword: (passwordData: { currentPassword: string; newPassword: string }) => Promise<boolean>;
  updateAvatar: (avatarUrl: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER'; payload: User };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false };
    case 'REGISTER':
      return { user: action.payload, isAuthenticated: true };
    default:
      return state;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', { email, password: password ? '***' : 'empty' });
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'LOGIN', payload: user });
      console.log('Login successful for:', user.email);
      return true;
    } catch (error: unknown) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const register = async (userData: UserFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Registration attempt with:', { 
        name: userData.name, 
        email: userData.email, 
        passwordProvided: userData.password ? 'Yes' : 'No' 
      });
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'REGISTER', payload: user });
      console.log('Registration successful for:', user.email);
      return { success: true };
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Échec de l\'inscription';
      return { success: false, error: message };
    }
  };

  const createUser = async (userData: UserFormData, createdBy: number): Promise<boolean> => {
    try {
      // Add createdBy to the user data for tracking who created the user
      const userDataWithCreator = { ...userData, created_by: createdBy };
      await usersAPI.create(userDataWithCreator);
      return true;
    } catch (error) {
      console.error('Create user error:', error);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      await usersAPI.delete(userId);
      return true;
    } catch (error) {
      console.error('Delete user error:', error);
      return false;
    }
  };

  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const { user: updatedUser, token: newToken } = response.data;
      
      // Update local storage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      dispatch({ type: 'LOGIN', payload: updatedUser });
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  const updatePassword = async (passwordData: { currentPassword: string; newPassword: string }): Promise<boolean> => {
    try {
      await authAPI.updatePassword(passwordData);
      return true;
    } catch (error) {
      console.error('Update password error:', error);
      return false;
    }
  };

  const updateAvatar = async (avatarUrl: string): Promise<boolean> => {
    try {
      const response = await authAPI.updateAvatar(avatarUrl);
      const { user: updatedUser, token: newToken } = response.data;
      
      // Update local storage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      dispatch({ type: 'LOGIN', payload: updatedUser });
      return true;
    } catch (error) {
      console.error('Update avatar error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      register,
      createUser,
      deleteUser,
      updateProfile,
      updatePassword,
      updateAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};