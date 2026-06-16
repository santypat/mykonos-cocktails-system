import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign,
  CreditCard,
  Printer,
  Check,
  LogOut,
  Clock,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api, { getAssetUrl } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function SellerPanel() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [shift, setShift] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchActiveShift();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products/active');
      setProducts(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveShift = async () => {
    try {
      const { data } = await api.get('/shifts/active');
      setShift(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleStartShift = async () => {
    try {
      const { data } = await api.post('/shifts/start');
      setShift(data);
      toast.success('Turno iniciado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al iniciar turno');
    }
  };

  const handleEndShift = async () => {
    if (!confirm('¿Finalizar turno?')) return;
    
    try {
      await api.post('/shifts/end');
      setShift(null);
      toast.success('Turno finalizado');
    } catch (error) {
      toast.error('Error al finalizar turno');
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product === product._id);
    if (existing) {
      setCart(cart.map(item =>
        item.product === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product !== productId));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSale = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (!shift) {
      toast.error('Debes iniciar turno primero');
      return;
    }

    try {
      const { data } = await api.post('/sales', {
        items: cart.map(item => ({
          product: item.product,
          quantity: item.quantity
        })),
        paymentMethod
      });

      setLastSale(data);
      setShowInvoice(true);
      setCart([]);
      toast.success('Venta registrada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrar venta');
    }
  };

  const handlePrint = () => {
    window.print();
    setShowInvoice(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="card-neon">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold neon-text-gold">MYKONOS COCKTAILS</h1>
              <p className="text-gray-400">Vendedor: {user?.fullName}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {shift ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-neon-green bg-opacity-20 px-4 py-2 rounded-lg">
                    <Clock className="text-neon-green" size={20} />
                    <div>
                      <p className="text-xs text-gray-400">Turno activo</p>
                      <p className="text-sm font-bold text-neon-green">
                        {shift.startTime && format(new Date(shift.startTime), 'HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleEndShift} className="btn-neon-pink flex items-center gap-2">
                    <StopCircle size={20} />
                    Finalizar Turno
                  </button>
                </div>
              ) : (
                <button onClick={handleStartShift} className="btn-neon-cyan flex items-center gap-2">
                  <PlayCircle size={20} />
                  Iniciar Turno
                </button>
              )}
              
              <button onClick={handleLogout} className="btn-neon-pink flex items-center gap-2">
                <LogOut size={20} />
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos */}
        <div className="lg:col-span-2">
          <div className="card-neon mb-4">
            <h2 className="text-xl font-bold neon-text-cyan mb-4">Productos Disponibles</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <button
                key={product._id}
                onClick={() => addToCart(product)}
                disabled={!shift}
                className="card-neon hover:scale-105 transition-transform text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.image ? (
                  <img
                    src={getAssetUrl(product.image)}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-full h-32 bg-dark-700 rounded-lg mb-3 flex items-center justify-center">
                    <ShoppingCart className="text-gray-600" size={32} />
                  </div>
                )}
                
                <h3 className="font-bold mb-2">{product.name}</h3>
                <p className="text-neon-green text-xl font-bold">
                  ${product.price.toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Carrito */}
        <div className="lg:col-span-1">
          <div className="card-neon sticky top-4">
            <h2 className="text-xl font-bold neon-text-pink mb-4 flex items-center gap-2">
              <ShoppingCart size={24} />
              Pedido Actual
            </h2>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product} className="bg-dark-700 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-400">
                        ${item.price.toLocaleString()} c/u
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product)}
                      className="text-neon-pink hover:bg-dark-600 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product, -1)}
                      className="bg-dark-600 hover:bg-dark-500 p-2 rounded"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product, 1)}
                      className="bg-dark-600 hover:bg-dark-500 p-2 rounded"
                    >
                      <Plus size={16} />
                    </button>
                    <div className="ml-2">
                      <p className="text-neon-green font-bold">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart size={48} className="mx-auto mb-2 opacity-30" />
                  <p>Carrito vacío</p>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div className="border-t border-dark-600 pt-4 mb-4">
                  <div className="flex items-center justify-between text-2xl font-bold mb-4">
                    <span>TOTAL:</span>
                    <span className="neon-text-green">${getTotal().toLocaleString()}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <label className="block text-sm font-medium mb-2">Método de Pago</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          paymentMethod === 'cash'
                            ? 'border-neon-cyan bg-neon-cyan bg-opacity-20 text-neon-cyan'
                            : 'border-dark-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <DollarSign size={20} />
                        Efectivo
                      </button>
                      <button
                        onClick={() => setPaymentMethod('transfer')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          paymentMethod === 'transfer'
                            ? 'border-neon-purple bg-neon-purple bg-opacity-20 text-neon-purple'
                            : 'border-dark-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <CreditCard size={20} />
                        Transferencia
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSale}
                  disabled={!shift}
                  className="btn-neon-cyan w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Venta
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Factura */}
      {showInvoice && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-black rounded-xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">¡Venta Exitosa!</h2>
              <p className="text-gray-600">Factura #{lastSale.invoiceNumber}</p>
            </div>

            <div className="border-t border-b border-gray-300 py-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">
                Fecha: {format(new Date(lastSale.date), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}
              </p>
              <p className="text-sm text-gray-600">Vendedor: {lastSale.sellerName}</p>
            </div>

            <div className="space-y-2 mb-4">
              {lastSale.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.productName} x{item.quantity}</span>
                  <span className="font-bold">${item.subtotal.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-300 pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>TOTAL:</span>
                <span>${lastSale.total.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-600 text-right mt-1">
                Pago: {lastSale.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Printer size={20} />
                Imprimir
              </button>
              <button
                onClick={() => setShowInvoice(false)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerPanel;
