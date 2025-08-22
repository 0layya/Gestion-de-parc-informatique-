import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, User } from 'lucide-react';

interface LoginProps {
  onToggleMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Email ou mot de passe incorrect');
      }
    } catch (_error) {
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials with correct passwords
  const demoUsers = [
    { email: 'admin@ibnzohr.com', password: 'admin', role: 'Administrateur' },
  ];

  const handleDemoLogin = async (email: string, password: string, role: string) => {
    setEmail(email);
    setPassword(password);
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError(`Login failed for ${role}. Please check your credentials.`);
      }
    } catch (_error) {
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8 px-4">
      <div className="max-w-sm w-full space-y-6">
        <div>
          <div className="mx-auto h-8 w-8 bg-orange-500 border border-black flex items-center justify-center">
            <User className="h-4 w-4 text-black" />
          </div>
          <h2 className="mt-4 text-center text-lg font-bold text-black font-mono uppercase tracking-wider">
            Login
          </h2>
          <p className="mt-1 text-center text-xs text-black font-mono">
            IT Management System
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-800 text-red-800 px-2 py-1 text-xs font-mono">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-black">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 industrial-input w-full px-2 py-1"
                placeholder="Votre email"
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-black">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 industrial-input w-full px-2 py-1"
                placeholder="Votre mot de passe"
                autoComplete="current-password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="industrial-button-orange w-full flex justify-center py-2 px-3 disabled:opacity-50"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-2">
                <LogIn className="h-3 w-3" />
              </span>
              {loading ? 'Loading...' : 'Login'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-xs text-orange-500 hover:text-black font-mono"
            >
              No account? Register
            </button>
          </div>
        </form>

        {/* Demo Accounts */}
        <div className="mt-6 p-3 bg-gray-100 border border-black rounded">
          <h4 className="text-xs font-mono uppercase tracking-wider text-black mb-3 text-center">Demo Account:</h4>
          <div className="space-y-2">
            {demoUsers.map((user, index) => (
              <div key={index} className="flex flex-col space-y-1">
                <div className="text-xs text-black font-mono">
                  <strong>{user.email}</strong> - {user.role}
                </div>
                <button
                  type="button"
                  onClick={() => handleDemoLogin(user.email, user.password, user.role)}
                  disabled={loading}
                  className={`w-full py-1 px-2 text-xs font-mono border border-black disabled:opacity-50 transition-colors ${
                    email === user.email && password === user.password
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-black'
                  }`}
                >
                  {loading && email === user.email ? 'Logging in...' : `Login as ${user.role}`}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center text-xs text-gray-600 font-mono">
            Click the button above to auto-fill and login
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;