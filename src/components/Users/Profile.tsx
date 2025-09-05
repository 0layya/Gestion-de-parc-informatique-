import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';
import { User, Camera, Save, Lock, Eye, EyeOff, Upload, X, Plus, Shield, Settings, Key, UserCheck } from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  department_id: number | undefined;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user, updateProfile, updatePassword, updateAvatar } = useAuth();
  const { showNotification } = useNotification();
  const { departments, createDepartment } = useApp();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    department_id: undefined
  });
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [showNewDepartmentForm, setShowNewDepartmentForm] = useState(false);
  const [newDepartmentData, setNewDepartmentData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        department_id: user.department_id || undefined
      });
      // Always set the avatar preview from user data, not from local state
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
      } else {
        setAvatarPreview(''); // Clear preview if no avatar
      }
      // Reset file state when user changes
      setAvatarFile(null);
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file); // Set the file in state
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setAvatarPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const compressImage = (dataUrl: string, maxWidth: number = 200): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions maintaining aspect ratio
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        resolve(compressedDataUrl);
      };
      img.src = dataUrl;
    });
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    
    setLoading(true);

    try {
      // Compress the image before sending
      const compressedAvatar = await compressImage(avatarPreview);
      console.log('Original size:', avatarPreview.length, 'Compressed size:', compressedAvatar.length);
      
      const success = await updateAvatar(compressedAvatar);
      if (success) {
        showNotification({
          type: 'success',
          title: 'Avatar Updated',
          message: 'Your profile picture has been updated successfully!',
        });
        setMessage('Avatar updated successfully!');
        setError('');
        setAvatarFile(null);
        // Don't clear avatarPreview here - let the useEffect handle it from updated user data
      } else {
        showNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update avatar. Please try again.',
        });
        setError('Failed to update avatar. Please try again.');
        setMessage('');
        // Revert to original avatar on failure
        if (user?.avatar_url) {
          setAvatarPreview(user.avatar_url);
        } else {
          setAvatarPreview('');
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: errorMessage,
      });
      // Revert to original avatar on error
      if (user?.avatar_url) {
        setAvatarPreview(user.avatar_url);
      } else {
        setAvatarPreview('');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    // Only revert preview if there's no file selected
    // Keep the current preview as it might be from a successful upload
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await updateProfile(profileData);
      if (success) {
        showNotification({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully!',
        });
        setMessage('Profile updated successfully!');
        setError('');
      } else {
        showNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update profile. Please try again.',
        });
        setError('Failed to update profile. Please try again.');
        setMessage('');
      }
    } catch {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while updating profile.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New passwords do not match.',
      });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showNotification({
        type: 'error',
        title: 'Password Too Short',
        message: 'New password must be at least 6 characters long.',
      });
      setLoading(false);
      return;
    }

    try {
      const success = await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (success) {
        showNotification({
          type: 'success',
          title: 'Password Updated',
          message: 'Your password has been updated successfully!',
        });
        setMessage('Password updated successfully!');
        setError('');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update password. Please check your current password.',
        });
        setError('Failed to update password. Please check your current password.');
        setMessage('');
      }
    } catch {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while updating password.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDepartmentData.name.trim()) return;
    
    try {
      await createDepartment({
        name: newDepartmentData.name,
        description: newDepartmentData.description,
        permissions: {
          tickets: true,
          equipment: false,
          users: false,
          reports: false
        }
      });
      
      // Find the newly created department to get its ID
      const newDept = departments.find(d => d.name === newDepartmentData.name);
      if (newDept) {
        setProfileData(prev => ({ ...prev, department_id: newDept.id }));
      }
      
      setShowNewDepartmentForm(false);
      setNewDepartmentData({ name: '', description: '' });
      
      showNotification({
        type: 'success',
        title: 'Department Created',
        message: 'New department created successfully!',
      });
    } catch {
      showNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create department. Please try again.',
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-8">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return { label: 'Administrator', color: 'bg-purple-100 text-purple-800', icon: Shield };
      case 'it_personnel': return { label: 'IT Personnel', color: 'bg-blue-100 text-blue-800', icon: Settings };
      case 'employee': return { label: 'Employee', color: 'bg-green-100 text-green-800', icon: UserCheck };
      default: return { label: role, color: 'bg-gray-100 text-gray-800', icon: User };
    }
  };

  const roleInfo = getRoleDisplay(user.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Paramètres du compte
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium mt-1">
            
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-2 rounded-lg ${roleInfo.color} flex items-center space-x-2`}>
            <RoleIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{roleInfo.label}</span>
          </div>
          <div className="text-xs sm:text-sm text-slate-500 bg-blue-50/50 px-3 py-2 rounded-lg backdrop-blur-sm">
            <span className="font-medium">Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            {avatarPreview ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img 
                  src={avatarPreview} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            
            {/* Avatar upload overlay */}
            <div className="absolute -bottom-2 -right-2">
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* Remove avatar button */}
            {avatarPreview && (
              <button
                onClick={removeAvatar}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-lg"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">{user.name}</h2>
            <p className="text-slate-600 mb-3">{user.email}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
              {user.department_id && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {departments.find(d => d.id === user.department_id)?.name || 'Department'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Avatar upload section */}
        {avatarFile && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={avatarPreview} 
                  alt="Preview" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                />
                <div>
                  <p className="text-sm font-medium text-blue-900">New avatar selected</p>
                  <p className="text-xs text-blue-700">{avatarFile.name}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAvatarUpload}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{loading ? 'Uploading...' : 'Upload Avatar'}</span>
                </button>
                <button
                  onClick={removeAvatar}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Profile Information Form */}
        <div className="glass-card p-6 rounded-xl flex flex-col">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Informations du profil</h2>
          </div>
          
          <form onSubmit={handleProfileUpdate} className="space-y-5 flex-1 flex flex-col">
            <div className="grid grid-cols-1 gap-5 flex-1">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  required
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-2">
                  Département
                </label>
                <div className="space-y-3">
                  <select
                    id="department_id"
                    name="department_id"
                    value={profileData.department_id || ''}
                    onChange={(e) => setProfileData({ ...profileData, department_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    autoComplete="off"
                  >
                    <option value="">Sélectionner un département</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  
                  {!showNewDepartmentForm ? (
                    <button
                      type="button"
                      onClick={() => setShowNewDepartmentForm(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-2 transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Créer un nouveau département</span>
                    </button>
                  ) : (
                    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 backdrop-blur-sm">
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="newDepartmentName" className="block text-xs font-medium text-slate-700">
                            Nom du département *
                          </label>
                          <input
                            type="text"
                            id="newDepartmentName"
                            name="newDepartmentName"
                            value={newDepartmentData.name}
                            onChange={(e) => setNewDepartmentData(prev => ({ ...prev, name: e.target.value }))}
                            className="mt-1 block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="e.g., HR, Finance, Sales"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label htmlFor="newDepartmentDescription" className="block text-xs font-medium text-slate-700">
                            Description
                          </label>
                          <input
                            type="text"
                            id="newDepartmentDescription"
                            name="newDepartmentDescription"
                            value={newDepartmentData.description}
                            onChange={(e) => setNewDepartmentData(prev => ({ ...prev, description: e.target.value }))}
                            className="mt-1 block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Department description"
                            autoComplete="off"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={handleCreateDepartment}
                            disabled={!newDepartmentData.name.trim()}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
                          >
                            Créer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewDepartmentForm(false);
                              setNewDepartmentData({ name: '', description: '' });
                            }}
                            className="px-4 py-2 text-sm bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-all duration-200"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                  Rôle
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={roleInfo.label}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 cursor-not-allowed"
                  disabled
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-auto">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Updating...' : 'Mettre à jour le profil'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Password Change Form */}
        <div className="glass-card p-6 rounded-xl flex flex-col">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Key className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Changer le mot de passe</h2>
          </div>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-5 flex-1 flex flex-col">
            {/* Hidden username field for accessibility */}
            <input
              type="text"
              name="username"
              value={user.email}
              readOnly
              className="sr-only"
              autoComplete="username"
            />
            
            <div className="space-y-5 flex-1">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-auto">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Updating...' : 'Changer le mot de passe'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Messages */}
      {(message || error) && (
        <div className="glass-card p-4 rounded-xl">
          {message && (
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-800 font-medium">{message}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
