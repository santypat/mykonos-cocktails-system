import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, Image as ImageIcon } from 'lucide-react';
import api, { getAssetUrl } from '../../utils/api';
import toast from 'react-hot-toast';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: null,
    preparation: [],
    category: 'Granizados'
  });

  useEffect(() => {
    fetchProducts();
    fetchInventory();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const { data } = await api.get('/inventory');
      setInventory(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('preparation', JSON.stringify(formData.preparation));
    
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Producto creado');
      }
      
      fetchProducts();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const toggleActive = async (product) => {
    try {
      await api.put(`/products/${product._id}`, {
        isActive: !product.isActive
      });
      toast.success(product.isActive ? 'Producto desactivado' : 'Producto activado');
      fetchProducts();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      toast.success('Producto eliminado');
      fetchProducts();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price,
        category: product.category,
        preparation: product.preparation?.map((prep) => ({
          ingredient: prep.ingredient?._id || prep.ingredient,
          quantity: prep.quantity
        })) || [],
        image: null
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        category: 'Granizados',
        preparation: [],
        image: null
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      preparation: [...formData.preparation, { ingredient: '', quantity: 1 }]
    });
  };

  const removeIngredient = (index) => {
    setFormData({
      ...formData,
      preparation: formData.preparation.filter((_, i) => i !== index)
    });
  };

  const updateIngredient = (index, field, value) => {
    const newPrep = [...formData.preparation];
    newPrep[index][field] = value;
    setFormData({ ...formData, preparation: newPrep });
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold neon-text-gold">Productos</h1>
          <p className="text-gray-400">Gestiona los productos del menú</p>
        </div>
        <button onClick={() => openModal()} className="btn-neon-cyan flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product._id} className={`card-neon ${!product.isActive && 'opacity-50'}`}>
            <div className="relative mb-4">
              {product.image ? (
                <img
                  src={getAssetUrl(product.image)}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-dark-700 rounded-lg flex items-center justify-center">
                  <ImageIcon className="text-gray-600" size={48} />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => toggleActive(product)}
                  className={`p-2 rounded-lg ${
                    product.isActive ? 'bg-neon-green' : 'bg-gray-600'
                  } bg-opacity-80`}
                >
                  <Power size={16} className="text-white" />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-2">{product.name}</h3>
            <p className="text-neon-green text-2xl font-bold mb-4">
              ${product.price.toLocaleString()}
            </p>

            {product.preparation?.length > 0 && (
              <div className="mb-4 text-sm">
                <p className="text-gray-400 mb-1">Ingredientes:</p>
                {product.preparation.map((prep, idx) => (
                  <p key={idx} className="text-gray-300 text-xs">
                    • {prep.ingredient?.name} ({prep.quantity})
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => openModal(product)}
                className="flex-1 bg-dark-700 hover:bg-dark-600 text-neon-cyan py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Editar
              </button>
              <button
                onClick={() => deleteProduct(product._id)}
                className="bg-dark-700 hover:bg-dark-600 text-neon-pink p-2 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold neon-text-cyan mb-6">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
                <label className="block text-sm font-medium mb-2">Precio</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-neon w-full"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                  className="input-neon w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Preparación</label>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="text-neon-cyan text-sm hover:underline"
                  >
                    + Agregar Ingrediente
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.preparation.map((prep, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={prep.ingredient}
                        onChange={(e) => updateIngredient(index, 'ingredient', e.target.value)}
                        className="input-neon flex-1"
                        required
                      >
                        <option value="">Seleccionar insumo</option>
                        {inventory.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={prep.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                        className="input-neon w-24"
                        min="0.1"
                        step="0.1"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="bg-dark-700 hover:bg-dark-600 text-neon-pink px-3 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-neon-cyan flex-1">
                  {editingProduct ? 'Actualizar' : 'Crear'}
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

export default AdminProducts;
