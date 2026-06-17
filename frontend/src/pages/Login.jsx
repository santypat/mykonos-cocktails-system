import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    
    if (!cleanUsername || !cleanPassword) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        username: cleanUsername,
        password: cleanPassword
      });
      login(data.user, data.token);
      
      toast.success(`¡Bienvenido ${data.user.fullName}!`);
      
      // Redirigir según el rol
      if (data.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/seller', { replace: true });
      }
    } catch (error) {
      console.error('Error en login:', error);
      let message = error.response?.data?.message || 'No se pudo conectar con el servidor';

      if (error.code === 'ECONNABORTED') {
        message = 'La conexion tardo demasiado. Intenta de nuevo';
      } else if (!error.response && !navigator.onLine) {
        message = 'El celular no tiene conexion a internet';
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-pink opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-5xl font-bold mb-2">
              <span className="neon-text-gold">MYKONOS</span>
            </h1>
            <p className="neon-text-pink text-2xl tracking-widest">COCKTAILS</p>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent"></div>
            <span className="text-neon-cyan text-sm">SISTEMA DE GESTIÓN</span>
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent"></div>
          </div>
        </div>

        {/* Formulario */}
        <div className="card-neon glass-morphism">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-cyan" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-neon w-full pl-12"
                  placeholder="Ingrese su usuario"
                  disabled={loading}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-cyan" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-neon w-full pl-12"
                  placeholder="Ingrese su contraseña"
                  disabled={loading}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-neon-cyan w-full flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          {import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === 'true' && (
            <div className="mt-6 pt-6 border-t border-dark-600">
              <p className="text-center text-sm text-gray-400">
                Usuario de prueba: <span className="neon-text-cyan font-mono">admin</span> /
                <span className="neon-text-cyan font-mono ml-1">admin123</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 Mykonos Cocktails. Sistema de Gestión v1.0
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
