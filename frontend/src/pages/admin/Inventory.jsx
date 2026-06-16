import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: 'unidades',
    minStock: 5
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await api.get('/inventory');
      setInventory(data);
    } catch (error) {
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem._id}`, formData);
        toast.success('Insumo actualizado');
      } else {
        await api.post('/inventory', formData);
        toast.success('Insumo creado');
      }
      
      fetchInventory();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const adjustInventory = async (id, adjustment) => {
    try {
      await api.patch(`/inventory/${id}/adjust`, { adjustment });
      toast.success('Inventario ajustado');
      fetchInventory();
    } catch (error) {
      toast.error('Error al ajustar inventario');
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('¿Eliminar este insumo?')) return;
    
    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Insumo eliminado');
      fetchInventory();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        minStock: item.minStock
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        quantity: 0,
        unit: 'unidades',
        minStock: 5
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const getStockStatus = (item) => {
    if (item.quantity === 0) return 'out';
    if (item.quantity <= item.minStock) return 'low';
    return 'ok';
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  const lowStockItems = inventory.filter(item => getStockStatus(item) !== 'ok');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text-gold">Inventario</h1>
          <p className="text-gray-400">Gestiona los insumos del negocio</p>
        </div>
        <button onClick={() => openModal()} className="btn-neon-cyan flex items-center gap-2">
          <Plus size={20} />
          Nuevo Insumo
        </button>
      </div>

      {/* Alertas de stock bajo */}
      {lowStockItems.length > 0 && (
        <div className="card-neon border-2 border-neon-pink">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-neon-pink" />
            <h2 className="text-xl font-bold neon-text-pink">
              Alertas de Stock ({lowStockItems.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map((item) => (
              <div key={item._id} className="bg-dark-700 rounded-lg p-3 border border-neon-pink border-opacity-30">
                <p className="font-medium">{item.name}</p>
                <p className="text-neon-pink font-bold">
                  {item.quantity} {item.unit}
                </p>
                <p className="text-xs text-gray-500">
                  {item.quantity === 0 ? 'Sin stock' : `Mínimo: ${item.minStock}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de inventario */}
      <div className="card-neon">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left p-4">Insumo</th>
                <th className="text-left p-4">Cantidad</th>
                <th className="text-left p-4">Stock Mínimo</th>
                <th className="text-left p-4">Estado</th>
                <th className="text-left p-4">Ajustar</th>
                <th className="text-left p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr key={item._id} className="border-b border-dark-700 hover:bg-dark-700">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4">
                      <span className={`font-bold ${
                        status === 'out' ? 'text-red-500' :
                        status === 'low' ? 'text-neon-pink' :
                        'text-neon-green'
                      }`}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="p-4">
                      {status === 'out' ? (
                        <span className="px-3 py-1 bg-red-500 bg-opacity-20 text-red-500 rounded-full text-sm">
                          Sin stock
                        </span>
                      ) : status === 'low' ? (
                        <span className="px-3 py-1 bg-neon-pink bg-opacity-20 text-neon-pink rounded-full text-sm">
                          Stock bajo
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-neon-green bg-opacity-20 text-neon-green rounded-full text-sm">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => adjustInventory(item._id, -1)}
                          className="bg-dark-600 hover:bg-dark-500 p-2 rounded text-neon-pink"
                          title="Quitar 1"
                        >
                          <TrendingDown size={16} />
                        </button>
                        <button
                          onClick={() => adjustInventory(item._id, 1)}
                          className="bg-dark-600 hover:bg-dark-500 p-2 rounded text-neon-green"
                          title="Agregar 1"
                        >
                          <TrendingUp size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(item)}
                          className="bg-dark-600 hover:bg-dark-500 text-neon-cyan p-2 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteItem(item._id)}
                          className="bg-dark-600 hover:bg-dark-500 text-neon-pink p-2 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {inventory.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay insumos registrados
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold neon-text-cyan mb-6">
              {editingItem ? 'Editar Insumo' : 'Nuevo Insumo'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-neon w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cantidad</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                  className="input-neon w-full"
                  required
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Unidad</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="input-neon w-full"
                >
                  <option value="unidades">Unidades</option>
                  <option value="kg">Kilogramos</option>
                  <option value="litros">Litros</option>
                  <option value="gramos">Gramos</option>
                  <option value="ml">Mililitros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stock Mínimo</label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) })}
                  className="input-neon w-full"
                  required
                  min="0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-neon-cyan flex-1">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-neon-pink flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventory;
