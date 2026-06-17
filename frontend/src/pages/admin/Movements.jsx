import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function AdminMovements() {
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
                {mov.paymentMethod === 'cash' && mov.cashReceived > 0 && (
                  <p className="text-xs text-gray-300 mt-1">
                    Recibido: ${mov.cashReceived.toLocaleString()} - Devuelto: ${mov.changeAmount.toLocaleString()}
                  </p>
                )}
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

export default AdminMovements;
