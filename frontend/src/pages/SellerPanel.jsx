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
  StopCircle,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Receipt,
  X
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api, { getAssetUrl } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const createInvoice = (index = 1) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: `Factura ${index}`,
  cart: [],
  paymentMethod: 'cash',
  cashReceived: ''
});

function SellerPanel() {
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([createInvoice(1)]);
  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const [shift, setShift] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [reportFilters, setReportFilters] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return { startDate: today, endDate: today };
  });

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const activeInvoice = invoices.find((invoice) => invoice.id === activeInvoiceId) || invoices[0];
  const cart = activeInvoice?.cart || [];
  const paymentMethod = activeInvoice?.paymentMethod || 'cash';
  const cashReceived = Number(activeInvoice?.cashReceived || 0);

  useEffect(() => {
    setActiveInvoiceId((current) => current || invoices[0]?.id);
  }, [invoices]);

  useEffect(() => {
    fetchProducts();
    fetchActiveShift();
    fetchSellerReport();
  }, []);

  useEffect(() => {
    fetchSellerReport();
  }, [reportFilters.startDate, reportFilters.endDate]);

  const updateActiveInvoice = (updater) => {
    setInvoices((current) => current.map((invoice) => (
      invoice.id === activeInvoice.id ? updater(invoice) : invoice
    )));
  };

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

  const fetchSellerReport = async () => {
    try {
      const params = new URLSearchParams();
      if (reportFilters.startDate) params.set('startDate', reportFilters.startDate);
      if (reportFilters.endDate) params.set('endDate', reportFilters.endDate);
      const { data } = await api.get(`/reports/seller-summary?${params.toString()}`);
      setReport(data);
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
    if (!confirm('Finalizar turno?')) return;

    try {
      await api.post('/shifts/end');
      setShift(null);
      toast.success('Turno finalizado');
    } catch (error) {
      toast.error('Error al finalizar turno');
    }
  };

  const handleNewInvoice = () => {
    if (invoices.length >= 5) {
      toast.error('Solo puedes manejar hasta 5 facturas simultaneas');
      return;
    }

    const nextInvoice = createInvoice(invoices.length + 1);
    setInvoices((current) => [...current, nextInvoice]);
    setActiveInvoiceId(nextInvoice.id);
  };

  const handleCloseInvoice = (invoiceId) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (invoice?.cart?.length && !confirm('Esta factura tiene productos. Cerrarla de todos modos?')) return;

    setInvoices((current) => {
      const next = current.filter((item) => item.id !== invoiceId);
      if (!next.length) return [createInvoice(1)];
      return next.map((item, index) => ({ ...item, name: `Factura ${index + 1}` }));
    });
  };

  const addToCart = (product) => {
    updateActiveInvoice((invoice) => {
      const existing = invoice.cart.find((item) => item.product === product._id);
      const cart = existing
        ? invoice.cart.map((item) => (
          item.product === product._id ? { ...item, quantity: item.quantity + 1 } : item
        ))
        : [...invoice.cart, {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: 1
        }];

      return { ...invoice, cart };
    });
  };

  const updateQuantity = (productId, delta) => {
    updateActiveInvoice((invoice) => ({
      ...invoice,
      cart: invoice.cart
        .map((item) => {
          if (item.product !== productId) return item;
          const quantity = item.quantity + delta;
          return quantity > 0 ? { ...item, quantity } : item;
        })
        .filter((item) => item.quantity > 0)
    }));
  };

  const removeFromCart = (productId) => {
    updateActiveInvoice((invoice) => ({
      ...invoice,
      cart: invoice.cart.filter((item) => item.product !== productId)
    }));
  };

  const setPaymentMethod = (method) => {
    updateActiveInvoice((invoice) => ({
      ...invoice,
      paymentMethod: method,
      cashReceived: method === 'cash' ? invoice.cashReceived : ''
    }));
  };

  const setCashReceived = (value) => {
    updateActiveInvoice((invoice) => ({ ...invoice, cashReceived: value }));
  };

  const getTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = getTotal();
  const changeAmount = paymentMethod === 'cash' ? Math.max(cashReceived - total, 0) : 0;

  const handleSale = async () => {
    if (cart.length === 0) {
      toast.error('El carrito esta vacio');
      return;
    }

    if (!shift) {
      toast.error('Debes iniciar turno primero');
      return;
    }

    if (paymentMethod === 'cash' && cashReceived < total) {
      toast.error('El efectivo recibido no alcanza para pagar la venta');
      return;
    }

    try {
      const { data } = await api.post('/sales', {
        items: cart.map((item) => ({
          product: item.product,
          quantity: item.quantity
        })),
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? cashReceived : 0
      });

      setLastSale(data);
      setShowInvoice(true);
      clearActiveInvoiceAfterSale();
      fetchProducts();
      fetchSellerReport();
      toast.success('Venta registrada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrar venta');
    }
  };

  const clearActiveInvoiceAfterSale = () => {
    if (invoices.length === 1) {
      updateActiveInvoice((invoice) => ({
        ...invoice,
        cart: [],
        paymentMethod: 'cash',
        cashReceived: ''
      }));
      return;
    }

    const currentId = activeInvoice.id;
    const nextInvoices = invoices
      .filter((invoice) => invoice.id !== currentId)
      .map((invoice, index) => ({ ...invoice, name: `Factura ${index + 1}` }));
    setInvoices(nextInvoices);
    setActiveInvoiceId(nextInvoices[0]?.id);
  };

  const handlePrint = () => {
    window.print();
    setShowInvoice(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const lowStockProducts = products.filter((product) => product.stock?.status === 'low' || product.stock?.status === 'out');

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
      <div className="max-w-7xl mx-auto mb-6">
        <div className="card-neon">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold neon-text-gold">MYKONOS COCKTAILS</h1>
              <p className="text-gray-400">Vendedor: {user?.fullName}</p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {shift ? (
                <div className="flex items-center gap-3 flex-wrap">
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

      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 card-neon">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-xl font-bold neon-text-cyan flex items-center gap-2">
              <BarChart3 size={22} />
              Reporte de ventas
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <CalendarDays className="text-neon-cyan" size={18} />
              <input
                type="date"
                value={reportFilters.startDate}
                onChange={(e) => setReportFilters((current) => ({ ...current, startDate: e.target.value }))}
                className="input-neon"
              />
              <input
                type="date"
                value={reportFilters.endDate}
                onChange={(e) => setReportFilters((current) => ({ ...current, endDate: e.target.value }))}
                className="input-neon"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Total vendido</p>
              <p className="text-2xl font-bold neon-text-green">${(report?.totalSales || 0).toLocaleString()}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Ventas</p>
              <p className="text-2xl font-bold text-white">{report?.salesCount || 0}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Efectivo</p>
              <p className="text-xl font-bold text-neon-cyan">${(report?.cashSales || 0).toLocaleString()}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Transferencia</p>
              <p className="text-xl font-bold text-neon-purple">${(report?.transferSales || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`card-neon ${lowStockProducts.length ? 'border-2 border-neon-pink' : ''}`}>
          <h2 className="text-lg font-bold neon-text-pink flex items-center gap-2 mb-3">
            <AlertTriangle size={20} />
            Alertas de stock
          </h2>
          <div className="space-y-2 max-h-44 overflow-y-auto">
            {lowStockProducts.map((product) => (
              <div key={product._id} className="bg-dark-700 rounded-lg p-3">
                <p className="font-medium">{product.name}</p>
                <p className={`text-sm ${product.stock?.status === 'out' ? 'text-red-400' : 'text-neon-pink'}`}>
                  {product.stock?.status === 'out'
                    ? 'Sin unidades disponibles'
                    : `${product.stock?.availableUnits ?? 0} unidades estimadas disponibles`}
                </p>
                {product.stock?.warnings?.slice(0, 2).map((warning) => (
                  <p key={warning.ingredientId} className="text-xs text-gray-400">
                    {warning.ingredientName}: {warning.quantity} {warning.unit} / min {warning.minStock}
                  </p>
                ))}
              </div>
            ))}
            {!lowStockProducts.length && (
              <p className="text-gray-400 text-sm">Sin alertas por ahora</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card-neon mb-4">
            <h2 className="text-xl font-bold neon-text-cyan mb-4">Productos Disponibles</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <button
                key={product._id}
                onClick={() => addToCart(product)}
                disabled={!shift || product.stock?.status === 'out'}
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
                {product.stock?.status !== 'ok' && (
                  <div className={`mb-2 text-xs rounded-lg px-2 py-1 inline-flex items-center gap-1 ${
                    product.stock?.status === 'out'
                      ? 'bg-red-500 bg-opacity-20 text-red-300'
                      : 'bg-neon-pink bg-opacity-20 text-neon-pink'
                  }`}>
                    <AlertTriangle size={13} />
                    {product.stock?.status === 'out' ? 'Sin stock' : 'Stock bajo'}
                  </div>
                )}
                <p className="text-neon-green text-xl font-bold">
                  ${product.price.toLocaleString()}
                </p>
                {product.stock?.availableUnits !== null && product.stock?.availableUnits !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    Disp: {product.stock.availableUnits}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card-neon sticky top-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold neon-text-pink flex items-center gap-2">
                <Receipt size={24} />
                Facturas
              </h2>
              <button
                onClick={handleNewInvoice}
                disabled={invoices.length >= 5}
                className="btn-neon-cyan px-3 py-2 disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className={`flex items-center rounded-lg border ${invoice.id === activeInvoice.id ? 'border-neon-cyan bg-neon-cyan bg-opacity-10' : 'border-dark-600 bg-dark-700'}`}>
                  <button
                    onClick={() => setActiveInvoiceId(invoice.id)}
                    className="px-3 py-2 text-sm whitespace-nowrap"
                  >
                    {invoice.name}
                    {invoice.cart.length > 0 && <span className="text-neon-green ml-1">({invoice.cart.length})</span>}
                  </button>
                  {invoices.length > 1 && (
                    <button onClick={() => handleCloseInvoice(invoice.id)} className="px-2 text-neon-pink">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
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
                  <p>Factura vacia</p>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div className="border-t border-dark-600 pt-4 mb-4">
                  <div className="flex items-center justify-between text-2xl font-bold mb-4">
                    <span>TOTAL:</span>
                    <span className="neon-text-green">${total.toLocaleString()}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <label className="block text-sm font-medium mb-2">Metodo de Pago</label>
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

                  {paymentMethod === 'cash' && (
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Efectivo recibido</label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={activeInvoice.cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className="input-neon w-full"
                          placeholder="0"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-dark-700 rounded-lg p-3">
                          <p className="text-xs text-gray-400">Recibido</p>
                          <p className="font-bold">${cashReceived.toLocaleString()}</p>
                        </div>
                        <div className="bg-dark-700 rounded-lg p-3">
                          <p className="text-xs text-gray-400">Cambio</p>
                          <p className={`font-bold ${cashReceived < total ? 'text-neon-pink' : 'text-neon-green'}`}>
                            ${changeAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSale}
                  disabled={!shift || (paymentMethod === 'cash' && cashReceived < total)}
                  className="btn-neon-cyan w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Venta
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showInvoice && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-black rounded-xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Venta Exitosa</h2>
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
              {lastSale.paymentMethod === 'cash' && (
                <div className="mt-3 text-sm text-gray-700">
                  <p className="flex justify-between">
                    <span>Recibido:</span>
                    <strong>${lastSale.cashReceived.toLocaleString()}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Cambio:</span>
                    <strong>${lastSale.changeAmount.toLocaleString()}</strong>
                  </p>
                </div>
              )}
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
