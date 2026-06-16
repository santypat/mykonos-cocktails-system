import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
function AdminReports() {

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

  if (!dashboard) return <div className="text-center py-12">Cargando...</div>;

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
          <p className="text-gray-400 mb-2">Ventas Totales</p>
          <p className="text-3xl font-bold neon-text-cyan">${dashboard.sales?.totalSales?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500">{dashboard.sales?.salesCount || 0} transacciones</p>
        </div>
        <div className="card-neon">
          <p className="text-gray-400 mb-2">Efectivo</p>
          <p className="text-3xl font-bold neon-text-green">${dashboard.sales?.cashSales?.toLocaleString() || 0}</p>
        </div>
        <div className="card-neon">
          <p className="text-gray-400 mb-2">Transferencias</p>
          <p className="text-3xl font-bold neon-text-purple">${dashboard.sales?.transferSales?.toLocaleString() || 0}</p>
        </div>
        <div className="card-neon">
          <p className="text-gray-400 mb-2">Ingreso Neto</p>
          <p className="text-3xl font-bold neon-text-pink">${dashboard.netIncome?.toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-neon">
          <h2 className="text-xl font-bold neon-text-cyan mb-4">Productos Más Vendidos</h2>
          {dashboard.topProducts?.map((p, i) => (
            <div key={i} className="flex justify-between p-3 bg-dark-700 rounded mb-2">
              <span>{p._id}</span>
              <span className="text-neon-green font-bold">${p.revenue?.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="card-neon">
          <h2 className="text-xl font-bold neon-text-purple mb-4">Desempeño Vendedores</h2>
          {dashboard.sellerPerformance?.map((s, i) => (
            <div key={i} className="flex justify-between p-3 bg-dark-700 rounded mb-2">
              <div>
                <p>{s._id}</p>
                <p className="text-sm text-gray-400">{s.sales} ventas</p>
              </div>
              <span className="text-neon-green font-bold">${s.revenue?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminReports;
