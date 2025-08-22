import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';
import { User, Camera, Save, Lock, Eye, EyeOff, Upload, X, Plus } from 'lucide-react';

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
    } catch (_err) {
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
    } catch (_err) {
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
    } catch (_error) {
      showNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create department. Please try again.',
      });
    }
  };

  if (!user) {
    return <div className="text-center py-8">Please log in to view your profile.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            {avatarPreview ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-200">
                <img 
                  src={avatarPreview} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
            )}
            
            {/* Avatar upload overlay */}
            <div className="absolute -bottom-1 -right-1">
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
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
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Manage your account information and security</p>
          </div>
        </div>

        {/* Avatar upload section */}
        {avatarFile && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={avatarPreview} 
                  alt="Preview" 
                  className="w-12 h-12 rounded-full object-cover"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  {loading ? 'Uploading...' : 'Upload Avatar'}
                </button>
                <button
                  onClick={removeAvatar}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Information Form */}
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Profile Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <div className="mt-1">
                <select
                  id="department_id"
                  name="department_id"
                  value={profileData.department_id || ''}
                  onChange={(e) => setProfileData({ ...profileData, department_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="off"
                >
                  <option value="">Select a department</option>
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
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create a new department</span>
                  </button>
                ) : (
                  <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="newDepartmentName" className="block text-xs font-medium text-gray-700">
                          Department Name *
                        </label>
                        <input
                          type="text"
                          id="newDepartmentName"
                          name="newDepartmentName"
                          value={newDepartmentData.name}
                          onChange={(e) => setNewDepartmentData(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., HR, Finance, Sales"
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label htmlFor="newDepartmentDescription" className="block text-xs font-medium text-gray-700">
                          Description
                        </label>
                        <input
                          type="text"
                          id="newDepartmentDescription"
                          name="newDepartmentDescription"
                          value={newDepartmentData.description}
                          onChange={(e) => setNewDepartmentData(prev => ({ ...prev, description: e.target.value }))}
                          className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Department description"
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleCreateDepartment}
                          disabled={!newDepartmentData.name.trim()}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewDepartmentForm(false);
                            setNewDepartmentData({ name: '', description: '' });
                          }}
                          className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={user.role}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600"
                disabled
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Updating...' : 'Update Profile'}</span>
            </button>
          </div>
        </form>

        {/* Password Change Form */}
        <form onSubmit={handlePasswordUpdate} className="space-y-6 mt-8 pt-8 border-t">
          {/* Hidden username field for accessibility */}
          <input
            type="text"
            name="username"
            value={user.email}
            readOnly
            className="sr-only"
            autoComplete="username"
          />
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Change Password</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Updating...' : 'Change Password'}</span>
            </button>
          </div>
        </form>

        {/* Messages */}
        {message && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
