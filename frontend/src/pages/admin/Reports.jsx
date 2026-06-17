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

  const getDateParam = (date) => date?.toISOString().split('T')[0];

  const handleMonthlyExport = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', getDateParam(startDate));
      if (endDate) params.append('endDate', getDateParam(endDate));

      const { data, headers } = await api.get(
        `/reports/export-monthly?${params.toString()}`,
        { responseType: 'blob' }
      );

      const contentDisposition = headers['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || 'mykonos-export-mensual.xls';
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Exportacion descargada');
    } catch (error) {
      toast.error('Error al exportar datos');
    }
  };

  if (!dashboard) return <div className="text-center py-12">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

  <h1 className="text-2xl sm:text-3xl font-bold neon-text-gold">
    Reportes
  </h1>

  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:items-end xl:gap-4">

    <div className="flex min-w-0 flex-col">
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
        className="input-neon w-full"
        placeholderText="Fecha inicial"
      />
    </div>

    <div className="flex min-w-0 flex-col">
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
        className="input-neon w-full"
        placeholderText="Fecha final"
      />
    </div>

    <button
      onClick={handleMonthlyExport}
      className="btn-neon-gold sm:col-span-2 xl:col-span-1"
    >
      Exportar Excel
    </button>

  </div>

</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="card-neon">
          <p className="text-gray-400 mb-2">Ventas Totales</p>
          <p className="text-2xl sm:text-3xl font-bold neon-text-cyan break-words">${dashboard.sales?.totalSales?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500">{dashboard.sales?.salesCount || 0} transacciones</p>
        </div>
        <div className="card-neon">
          <p className="text-gray-400 mb-2">Efectivo</p>
          <p className="text-2xl sm:text-3xl font-bold neon-text-green break-words">${dashboard.sales?.cashSales?.toLocaleString() || 0}</p>
        </div>
        <div className="card-neon">
          <p className="text-gray-400 mb-2">Transferencias</p>
          <p className="text-2xl sm:text-3xl font-bold neon-text-purple break-words">${dashboard.sales?.transferSales?.toLocaleString() || 0}</p>
        </div>
        <div className="card-neon">
          <p className="text-gray-400 mb-2">Ingreso Neto</p>
          <p className="text-2xl sm:text-3xl font-bold neon-text-pink break-words">${dashboard.netIncome?.toLocaleString() || 0}</p>
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
