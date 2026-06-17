import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '', role: 'seller' });

  useEffect(() => {
    fetchUsers();
    const intervalId = window.setInterval(fetchUsers, 10000);
    window.addEventListener('focus', fetchUsers);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', fetchUsers);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      toast.success('Usuario creado');
      fetchUsers();
      setShowModal(false);
      setFormData({ username: '', password: '', fullName: '', role: 'seller' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error');
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      toast.success('Usuario actualizado');
      fetchUsers();
    } catch (error) {
      toast.error('Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold neon-text-gold">Usuarios</h1>
        <button onClick={() => setShowModal(true)} className="btn-neon-cyan">+ Nuevo Usuario</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user._id} className={`card-neon ${!user.isActive && 'opacity-50'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">{user.fullName}</h3>
                <p className="text-gray-400">@{user.username}</p>
              </div>
              {!user.isPrincipal && (
                <button onClick={() => toggleActive(user)} className={`px-3 py-1 rounded text-xs ${user.isActive ? 'bg-neon-cyan bg-opacity-20 text-neon-cyan' : 'bg-gray-600 text-gray-300'}`}>
                  {user.isActive ? 'Cuenta habilitada' : 'Cuenta inactiva'}
                </button>
              )}
            </div>
            <p className={`text-sm ${user.role === 'admin' ? 'text-neon-cyan' : 'text-gray-400'}`}>
              {user.role === 'admin' ? 'Administrador' : 'Vendedor'}
            </p>
            {user.role === 'seller' && (
              <div className={`mt-3 inline-flex px-3 py-1 rounded-full text-xs ${
                user.isOnShift
                  ? 'bg-neon-green bg-opacity-20 text-neon-green'
                  : 'bg-dark-600 text-gray-400'
              }`}>
                {user.isOnShift ? 'Activo en turno' : 'Inactivo fuera de turno'}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold neon-text-cyan mb-6">Nuevo Usuario</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Nombre completo" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="input-neon w-full" required />
              <input type="text" placeholder="Usuario" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="input-neon w-full" required />
              <input type="password" placeholder="Contraseña" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="input-neon w-full" required minLength="6" />
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="input-neon w-full">
                <option value="seller">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-neon-cyan flex-1">Crear</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-neon-pink flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
