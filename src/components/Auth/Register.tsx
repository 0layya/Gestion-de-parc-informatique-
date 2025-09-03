import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserFormData } from '../../types';
import { UserPlus } from 'lucide-react';

interface RegisterProps {
  onToggleMode: () => void;
}

const Register: React.FC<RegisterProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    department_id: undefined,
    password: '',
    role: 'employee',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'department_id') {
      const parsed = value === '' ? undefined : Number(value);
      setFormData({ ...formData, department_id: Number.isNaN(parsed as number) ? undefined : (parsed as number) });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData);
    if (!result.success) {
      setError(result.error || 'Échec de l\'inscription');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 floating-element">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="mt-2 text-lg text-slate-600 font-medium">
            Join the IT Management System
          </p>
        </div>

        <div className="glass-modal p-8 floating-element">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100/80 backdrop-blur-sm border border-red-200/50 text-red-800 px-4 py-3 text-sm font-medium rounded-xl">
                {error}
              </div>
            )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom complet
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Votre nom complet"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Votre email professionnel"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">
                Département (ID) <span className="text-gray-400">— optionnel</span>
              </label>
              <input
                id="department_id"
                name="department_id"
                type="number"
                min={1}
                value={formData.department_id ?? ''}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Ex: 1 pour IT"
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-gray-500">Laissez vide si vous ne connaissez pas l'ID. Un admin pourra l'assigner plus tard.</p>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Votre mot de passe"
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <UserPlus className="h-5 w-5 text-orange-500 group-hover:text-orange-400" />
              </span>
              {loading ? 'Création...' : 'Créer un compte'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-sm text-orange-600 hover:text-orange-500"
            >
              Déjà un compte ? Se connecter
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;