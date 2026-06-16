// AdminSales.jsx
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export function AdminSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const { data } = await api.get('/sales');
      setSales(data);
    } catch (error) {
      toast.error('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold neon-text-gold">Ventas</h1>
      
      <div className="card-neon overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-600">
              <th className="text-left p-4">Fecha</th>
              <th className="text-left p-4">Factura</th>
              <th className="text-left p-4">Vendedor</th>
              <th className="text-left p-4">Items</th>
              <th className="text-left p-4">Pago</th>
              <th className="text-left p-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale._id} className="border-b border-dark-700 hover:bg-dark-700">
                <td className="p-4">{format(new Date(sale.date), 'dd/MM/yyyy HH:mm', { locale: es })}</td>
                <td className="p-4 font-mono text-sm">{sale.invoiceNumber}</td>
                <td className="p-4">{sale.sellerName}</td>
                <td className="p-4">{sale.items.length}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    sale.paymentMethod === 'cash' ? 'bg-neon-green bg-opacity-20 text-neon-green' :
                    'bg-neon-purple bg-opacity-20 text-neon-purple'
                  }`}>
                    {sale.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                  </span>
                </td>
                <td className="p-4 font-bold text-neon-green">${sale.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// AdminMovements.jsx
export function AdminMovements() {
  const [movements, setMovements] = useState([]);
  const [balance, setBalance] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    paymentMethod: 'cash',
    description: '',
    category: 'Otros'
  });

  useEffect(() => {
    fetchMovements();
    fetchBalance();
  }, []);

  const fetchMovements = async () => {
    try {
      const { data } = await api.get('/movements');
      setMovements(data);
    } catch (error) {
      toast.error('Error al cargar movimientos');
    }
  };

  const fetchBalance = async () => {
    try {
      const { data } = await api.get('/movements/balance');
      setBalance(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/movements', formData);
      toast.success('Movimiento registrado');
      fetchMovements();
      fetchBalance();
      setShowModal(false);
      setFormData({ type: 'income', amount: '', paymentMethod: 'cash', description: '', category: 'Otros' });
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold neon-text-gold">Movimientos de Caja</h1>
        <button onClick={() => setShowModal(true)} className="btn-neon-cyan">+ Nuevo Movimiento</button>
      </div>

      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-neon">
            <p className="text-gray-400 mb-2">Efectivo en Caja</p>
            <p className="text-3xl font-bold neon-text-green">${balance.cash.total.toLocaleString()}</p>
          </div>
          <div className="card-neon">
            <p className="text-gray-400 mb-2">Transferencias</p>
            <p className="text-3xl font-bold neon-text-purple">${balance.transfer.total.toLocaleString()}</p>
          </div>
          <div className="card-neon">
            <p className="text-gray-400 mb-2">Total</p>
            <p className="text-3xl font-bold neon-text-cyan">${balance.total.total.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="card-neon">
        <div className="space-y-3">
          {movements.map((mov) => (
            <div key={mov._id} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
              <div>
                <p className="font-medium">{mov.description}</p>
                <p className="text-sm text-gray-400">
                  {format(new Date(mov.date), 'dd/MM/yyyy HH:mm', { locale: es })} - {mov.userName}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${mov.type === 'income' ? 'text-neon-green' : 'text-neon-pink'}`}>
                  {mov.type === 'income' ? '+' : '-'}${mov.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">{mov.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold neon-text-cyan mb-6">Nuevo Movimiento</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Tipo</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="input-neon w-full">
                  <option value="income">Ingreso</option>
                  <option value="expense">Egreso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Monto</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="input-neon w-full" required min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm mb-2">Método de Pago</label>
                <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="input-neon w-full">
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Descripción</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-neon w-full" rows="3" required></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-neon-cyan flex-1">Guardar</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-neon-pink flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// AdminUsers.jsx
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '', role: 'seller' });

  useEffect(() => {
    fetchUsers();
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
                <button onClick={() => toggleActive(user)} className={`px-3 py-1 rounded text-xs ${user.isActive ? 'bg-neon-green bg-opacity-20 text-neon-green' : 'bg-gray-600 text-gray-300'}`}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </button>
              )}
            </div>
            <p className={`text-sm ${user.role === 'admin' ? 'text-neon-cyan' : 'text-gray-400'}`}>
              {user.role === 'admin' ? 'Administrador' : 'Vendedor'}
            </p>
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

// AdminReports.jsx
export function AdminReports() {

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const fetchReports = async () => {

    try {

      setLoading(true);

      const params = new URLSearchParams();

      if (startDate) {
        params.append(
          'startDate',
          startDate.toISOString().split('T')[0]
        );
      }

      if (endDate) {
        params.append(
          'endDate',
          endDate.toISOString().split('T')[0]
        );
      }

      const { data } = await api.get(
        `/reports/dashboard?${params.toString()}`
      );

      setDashboard(data);

    } catch (error) {

      console.error(error);

      toast.error('Error al cargar reportes');

    } finally {

      setLoading(false);

    }
  };

  if (loading || !dashboard) {
    return (
      <div className="text-center py-12">
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-4">

        <h1 className="text-3xl font-bold neon-text-gold">
          Reportes
        </h1>

        <div className="flex items-center gap-4">

          <div className="flex flex-col">
            <label className="text-sm text-gray-400 mb-1">
              Desde
            </label>

            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="yyyy-MM-dd"
              className="input-neon"
              placeholderText="Fecha inicial"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-400 mb-1">
              Hasta
            </label>

            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="yyyy-MM-dd"
              className="input-neon"
              placeholderText="Fecha final"
            />
          </div>

        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="card-neon">
          <p className="text-gray-400 mb-2">
            Ventas Totales
          </p>

          <p className="text-3xl font-bold neon-text-cyan">
            ${dashboard.sales?.totalSales?.toLocaleString() || 0}
          </p>

          <p className="text-sm text-gray-500">
            {dashboard.sales?.salesCount || 0} transacciones
          </p>
        </div>

        <div className="card-neon">
          <p className="text-gray-400 mb-2">
            Efectivo
          </p>

          <p className="text-3xl font-bold neon-text-green">
            ${dashboard.sales?.cashSales?.toLocaleString() || 0}
          </p>
        </div>

        <div className="card-neon">
          <p className="text-gray-400 mb-2">
            Transferencias
          </p>

          <p className="text-3xl font-bold neon-text-purple">
            ${dashboard.sales?.transferSales?.toLocaleString() || 0}
          </p>
        </div>

        <div className="card-neon">
          <p className="text-gray-400 mb-2">
            Ingreso Neto
          </p>

          <p className="text-3xl font-bold neon-text-pink">
            ${dashboard.netIncome?.toLocaleString() || 0}
          </p>
        </div>

      </div>

    </div>
  );
}

