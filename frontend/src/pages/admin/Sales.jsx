import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function AdminSales() {
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

export default AdminSales;

