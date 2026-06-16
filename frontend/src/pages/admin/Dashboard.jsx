import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  Users,
  Calendar
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function AdminDashboard() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);


  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  

  

  useEffect(() => {
  fetchDashboard();
}, [startDate, endDate]);


  const fetchDashboard = async () => {

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

    console.error('Error:', error);

    toast.error('Error al cargar el dashboard');

  } finally {

    setLoading(false);

  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Ventas Totales',
      value: `$${dashboard?.sales?.totalSales?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'cyan',
      subtext: `${dashboard?.sales?.salesCount || 0} ventas`
    },
    {
      label: 'Efectivo',
      value: `$${dashboard?.sales?.cashSales?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'green',
      subtext: 'En caja'
    },
    {
      label: 'Transferencias',
      value: `$${dashboard?.sales?.transferSales?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'purple',
      subtext: 'Digital'
    },
    {
      label: 'Ingreso Neto',
      value: `$${dashboard?.netIncome?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'pink',
      subtext: 'Ganancias'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold neon-text-gold mb-2">Dashboard</h1>
          <p className="text-gray-400">Resumen general del negocio</p>
        </div>

        {/* Selector de período */}
  <div className="flex items-center gap-4">
  
    <div className="flex flex-col">
      <label className="text-sm text-gray-400 mb-1">
        Fecha inicial
      </label>

      <DatePicker
        selected={startDate}
        onChange={(date) => setStartDate(date)}
        selectsStart
        startDate={startDate}
        endDate={endDate}
        dateFormat="yyyy-MM-dd"
        className="input-neon"
        placeholderText="Selecciona fecha"
      />
    </div>

    <div className="flex flex-col">
      <label className="text-sm text-gray-400 mb-1">
        Fecha final
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
        placeholderText="Selecciona fecha"
      />
    </div>
</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card-neon hover:scale-105 transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold neon-text-${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{stat.subtext}</p>
                </div>
                <div className={`p-3 bg-neon-${stat.color} bg-opacity-20 rounded-lg`}>
                  <Icon className={`text-neon-${stat.color}`} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Productos */}
        <div className="card-neon">
          <div className="flex items-center gap-2 mb-4">
            <Package className="text-neon-cyan" />
            <h2 className="text-xl font-bold neon-text-cyan">Top Productos</h2>
          </div>
          <div className="space-y-3">
            {dashboard?.topProducts?.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neon-pink bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-neon-pink font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{product._id}</p>
                    <p className="text-sm text-gray-400">{product.quantity} vendidos</p>
                  </div>
                </div>
                <p className="text-neon-green font-bold">${product.revenue?.toLocaleString()}</p>
              </div>
            ))}
            {!dashboard?.topProducts?.length && (
              <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
            )}
          </div>
        </div>

        {/* Desempeño Vendedores */}
        <div className="card-neon">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-neon-purple" />
            <h2 className="text-xl font-bold neon-text-purple">Desempeño Vendedores</h2>
          </div>
          <div className="space-y-3">
            {dashboard?.sellerPerformance?.map((seller, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <div>
                  <p className="font-medium">{seller._id}</p>
                  <p className="text-sm text-gray-400">{seller.sales} ventas</p>
                </div>
                <p className="text-neon-green font-bold">${seller.revenue?.toLocaleString()}</p>
              </div>
            ))}
            {!dashboard?.sellerPerformance?.length && (
              <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
            )}
          </div>
        </div>
      </div>

      {/* Alertas de Stock Bajo */}
      {dashboard?.lowStock?.length > 0 && (
        <div className="card-neon border-2 border-neon-pink">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-neon-pink" />
            <h2 className="text-xl font-bold neon-text-pink">Alertas de Inventario</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dashboard.lowStock.map((item, index) => (
              <div key={index} className="p-3 bg-dark-700 rounded-lg border border-neon-pink border-opacity-30">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-neon-pink">
                  Stock: {item.quantity} {item.unit}
                </p>
                <p className="text-xs text-gray-500">Mínimo: {item.minStock}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
