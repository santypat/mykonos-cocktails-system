import express from 'express';
import Sale from '../models/Sale.js';
import Movement from '../models/Movement.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import User from '../models/User.js';
import Shift from '../models/Shift.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Dashboard general con métricas clave
router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {

const { startDate, endDate } = req.query;

const dateFilter = {};

if (startDate || endDate) {

  dateFilter.date = {};

  if (startDate) {
    dateFilter.date.$gte = new Date(startDate);
  }

  if (endDate) {

    const end = new Date(endDate);

    end.setHours(23, 59, 59, 999);

    dateFilter.date.$lte = end;
  }
}



    // Ventas totales
    const salesData = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          salesCount: { $sum: 1 },
          cashSales: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$total', 0] }
          },
          transferSales: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'transfer'] }, '$total', 0] }
          }
        }
      }
    ]);

    const sales = salesData[0] || {
      totalSales: 0,
      salesCount: 0,
      cashSales: 0,
      transferSales: 0
    };

    // Movimientos
    const movementsData = await Movement.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const movements = {
      income: 0,
      expense: 0
    };

    movementsData.forEach(m => {
      movements[m._id] = m.total;
    });

    // Productos más vendidos
    const topProducts = await Sale.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 }
    ]);

    // Vendedores
    const sellerPerformance = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$sellerName',
          sales: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Inventario bajo
    const lowStock = await Inventory.find({
      $expr: { $lte: ['$quantity', '$minStock'] }
    }).limit(5);

    res.json({
      startDate,
      endDate,
      sales,
      movements,
      topProducts,
      sellerPerformance,
      lowStock,
      netIncome: sales.totalSales + movements.income - movements.expense
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Reporte de ventas detallado
router.get('/sales', protect, adminOnly, async (req, res) => {
  try {
    const { period = 'month', groupBy = 'day' } = req.query;
    
    const dateFilter = getDateFilter(period);

    let groupFormat;
    switch (groupBy) {
      case 'hour':
        groupFormat = { $hour: '$date' };
        break;
      case 'day':
        groupFormat = { $dayOfMonth: '$date' };
        break;
      case 'week':
        groupFormat = { $week: '$date' };
        break;
      case 'month':
        groupFormat = { $month: '$date' };
        break;
      default:
        groupFormat = { $dayOfMonth: '$date' };
    }

    const salesByPeriod = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: '$total' },
          count: { $sum: 1 },
          avgSale: { $avg: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Ventas por método de pago
    const paymentMethods = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Productos vendidos
    const productsSold = await Sale.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json({
      salesByPeriod,
      paymentMethods,
      productsSold
    });
  } catch (error) {
    console.error('Error en reporte de ventas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Reporte financiero
router.get('/financial', protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

const dateFilter = {};

if (startDate || endDate) {

  dateFilter.date = {};

  if (startDate) {

    const start = new Date(startDate);

    start.setHours(0, 0, 0, 0);

    dateFilter.date.$gte = start;
  }

  if (endDate) {

    const end = new Date(endDate);

    end.setHours(23, 59, 59, 999);

    dateFilter.date.$lte = end;
  }
}

    // Ingresos por ventas
    const salesIncome = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          cash: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$total', 0] }
          },
          transfer: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'transfer'] }, '$total', 0] }
          }
        }
      }
    ]);

    // Otros ingresos/egresos
    const movements = await Movement.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { type: '$type', method: '$paymentMethod' },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const financial = {
      sales: salesIncome[0] || { total: 0, cash: 0, transfer: 0 },
      movements: {
        income: { cash: 0, transfer: 0, total: 0 },
        expense: { cash: 0, transfer: 0, total: 0 }
      },
      balance: { cash: 0, transfer: 0, total: 0 }
    };

    movements.forEach(m => {
      financial.movements[m._id.type][m._id.method] += m.total;
      financial.movements[m._id.type].total += m.total;
    });

    // Calcular balance total
    financial.balance.cash = 
      financial.sales.cash + 
      financial.movements.income.cash - 
      financial.movements.expense.cash;
    
    financial.balance.transfer = 
      financial.sales.transfer + 
      financial.movements.income.transfer - 
      financial.movements.expense.transfer;
    
    financial.balance.total = financial.balance.cash + financial.balance.transfer;

    res.json(financial);
  } catch (error) {
    console.error('Error en reporte financiero:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Reporte de inventario
router.get('/inventory', protect, adminOnly, async (req, res) => {
  try {
    const inventory = await Inventory.find().sort('quantity');

    const stats = {
      totalItems: inventory.length,
      lowStock: inventory.filter(i => i.quantity <= i.minStock).length,
      outOfStock: inventory.filter(i => i.quantity === 0).length,
      items: inventory
    };

    res.json(stats);
  } catch (error) {
    console.error('Error en reporte de inventario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Reporte de desempeño de empleados
router.get('/employees', protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Ventas por empleado
    const salesByEmployee = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { seller: '$seller', name: '$sellerName' },
          totalSales: { $sum: '$total' },
          salesCount: { $sum: 1 },
          avgSale: { $avg: '$total' }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    // Turnos por empleado
    const shiftFilter = {};
    if (startDate || endDate) {
      shiftFilter.startTime = {};
      if (startDate) shiftFilter.startTime.$gte = new Date(startDate);
      if (endDate) shiftFilter.startTime.$lte = new Date(endDate);
    }

    const shiftsByEmployee = await Shift.aggregate([
      { $match: shiftFilter },
      {
        $group: {
          _id: '$userName',
          totalShifts: { $sum: 1 },
          totalHours: {
            $sum: {
              $divide: [
                { $subtract: ['$endTime', '$startTime'] },
                1000 * 60 * 60
              ]
            }
          }
        }
      }
    ]);

    res.json({
      salesByEmployee,
      shiftsByEmployee
    });
  } catch (error) {
    console.error('Error en reporte de empleados:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Función auxiliar para filtros de fecha
function getDateFilter(period) {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  return { date: { $gte: startDate } };
}

export default router;
