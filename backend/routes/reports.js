import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { supabase, mapInventory, mapMovement, mapProduct, mapSale, mapShift, mapUser, requireRow } from '../lib/supabase.js';

const router = express.Router();

function parseDateRange({ startDate, endDate }) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);
  return { start, end };
}

function inRange(dateValue, start, end) {
  const date = new Date(dateValue);
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function getPeriodStart(period) {
  const now = new Date();
  switch (period) {
    case 'week':
      now.setDate(now.getDate() - 7);
      return now;
    case 'month':
      now.setMonth(now.getMonth() - 1);
      return now;
    case 'year':
      now.setFullYear(now.getFullYear() - 1);
      return now;
    case 'today':
    default:
      now.setHours(0, 0, 0, 0);
      return now;
  }
}

function getGroupKey(dateValue, groupBy) {
  const date = new Date(dateValue);
  switch (groupBy) {
    case 'hour':
      return date.getHours();
    case 'week':
      return Math.ceil(date.getDate() / 7);
    case 'month':
      return date.getMonth() + 1;
    case 'day':
    default:
      return date.getDate();
  }
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function excelCell(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function excelSheet(name, columns, rows) {
  const header = columns.map((column) => excelCell(column.label)).join('');
  const body = rows.map((row) => (
    `<Row>${columns.map((column) => excelCell(column.value(row))).join('')}</Row>`
  )).join('');

  return `
    <Worksheet ss:Name="${escapeXml(name).slice(0, 31)}">
      <Table>
        <Row>${header}</Row>
        ${body}
      </Table>
    </Worksheet>
  `;
}

function buildWorkbook(sheets) {
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${sheets.join('')}
</Workbook>`;
}

router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const sales = requireRow(await supabase.from('sales').select('*')).map(mapSale).filter((sale) => inRange(sale.date, start, end));
    const movements = requireRow(await supabase.from('movements').select('*')).map(mapMovement).filter((movement) => inRange(movement.date, start, end));
    const inventory = requireRow(await supabase.from('inventory').select('*')).map(mapInventory);

    const salesSummary = {
      totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
      salesCount: sales.length,
      cashSales: sales.filter((sale) => sale.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0),
      transferSales: sales.filter((sale) => sale.paymentMethod === 'transfer').reduce((sum, sale) => sum + sale.total, 0)
    };

    const movementSummary = {
      income: movements.filter((movement) => movement.type === 'income').reduce((sum, movement) => sum + movement.amount, 0),
      expense: movements.filter((movement) => movement.type === 'expense').reduce((sum, movement) => sum + movement.amount, 0)
    };

    const productMap = new Map();
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const current = productMap.get(item.productName) || { _id: item.productName, quantity: 0, revenue: 0 };
        current.quantity += Number(item.quantity);
        current.revenue += Number(item.subtotal);
        productMap.set(item.productName, current);
      });
    });

    const sellerMap = new Map();
    sales.forEach((sale) => {
      const current = sellerMap.get(sale.sellerName) || { _id: sale.sellerName, sales: 0, revenue: 0 };
      current.sales += 1;
      current.revenue += sale.total;
      sellerMap.set(sale.sellerName, current);
    });

    res.json({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sales: salesSummary,
      movements: movementSummary,
      topProducts: [...productMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
      sellerPerformance: [...sellerMap.values()].sort((a, b) => b.revenue - a.revenue),
      lowStock: inventory.filter((item) => item.quantity <= item.minStock).slice(0, 5),
      netIncome: salesSummary.totalSales + movementSummary.income - movementSummary.expense
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/seller-summary', protect, async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const sales = requireRow(await supabase.from('sales').select('*'))
      .map(mapSale)
      .filter((sale) => sale.seller === req.user._id)
      .filter((sale) => inRange(sale.date, start, end));

    const productMap = new Map();
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const current = productMap.get(item.productName) || { name: item.productName, quantity: 0, revenue: 0 };
        current.quantity += Number(item.quantity);
        current.revenue += Number(item.subtotal);
        productMap.set(item.productName, current);
      });
    });

    const summary = {
      totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
      salesCount: sales.length,
      cashSales: sales.filter((sale) => sale.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0),
      transferSales: sales.filter((sale) => sale.paymentMethod === 'transfer').reduce((sum, sale) => sum + sale.total, 0),
      productsSold: [...productMap.values()].sort((a, b) => b.quantity - a.quantity),
      latestSales: sales
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8)
    };

    res.json(summary);
  } catch (error) {
    console.error('Error en reporte de vendedor:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/sales', protect, adminOnly, async (req, res) => {
  try {
    const { period = 'month', groupBy = 'day' } = req.query;
    const start = getPeriodStart(period);
    const sales = requireRow(await supabase.from('sales').select('*')).map(mapSale).filter((sale) => inRange(sale.date, start, null));

    const periodMap = new Map();
    sales.forEach((sale) => {
      const key = getGroupKey(sale.date, groupBy);
      const current = periodMap.get(key) || { _id: key, totalSales: 0, count: 0, avgSale: 0 };
      current.totalSales += sale.total;
      current.count += 1;
      current.avgSale = current.totalSales / current.count;
      periodMap.set(key, current);
    });

    const paymentMap = new Map();
    sales.forEach((sale) => {
      const current = paymentMap.get(sale.paymentMethod) || { _id: sale.paymentMethod, total: 0, count: 0 };
      current.total += sale.total;
      current.count += 1;
      paymentMap.set(sale.paymentMethod, current);
    });

    const productsMap = new Map();
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const current = productsMap.get(item.productName) || { _id: item.productName, quantity: 0, revenue: 0 };
        current.quantity += Number(item.quantity);
        current.revenue += Number(item.subtotal);
        productsMap.set(item.productName, current);
      });
    });

    res.json({
      salesByPeriod: [...periodMap.values()].sort((a, b) => a._id - b._id),
      paymentMethods: [...paymentMap.values()],
      productsSold: [...productsMap.values()].sort((a, b) => b.revenue - a.revenue)
    });
  } catch (error) {
    console.error('Error en reporte de ventas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/export-monthly', protect, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = req.query.startDate || defaultStart.toISOString().slice(0, 10);
    const endDate = req.query.endDate || now.toISOString().slice(0, 10);
    const { start, end } = parseDateRange({ startDate, endDate });

    const sales = requireRow(await supabase.from('sales').select('*')).map(mapSale).filter((sale) => inRange(sale.date, start, end));
    const movements = requireRow(await supabase.from('movements').select('*')).map(mapMovement).filter((movement) => inRange(movement.date, start, end));
    const shifts = requireRow(await supabase.from('shifts').select('*')).map(mapShift).filter((shift) => inRange(shift.startTime, start, end));
    const inventory = requireRow(await supabase.from('inventory').select('*')).map(mapInventory);
    const products = requireRow(await supabase.from('products').select('*')).map(mapProduct);
    const users = requireRow(await supabase.from('app_users').select('*')).map(mapUser);

    const saleItems = sales.flatMap((sale) => sale.items.map((item) => ({
      invoiceNumber: sale.invoiceNumber,
      date: sale.date,
      sellerName: sale.sellerName,
      paymentMethod: sale.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia',
      productName: item.productName,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      subtotal: Number(item.subtotal || 0),
      saleTotal: sale.total,
      cashReceived: sale.cashReceived,
      changeAmount: sale.changeAmount
    })));

    const summary = [
      { metric: 'Fecha inicial', value: startDate },
      { metric: 'Fecha final', value: endDate },
      { metric: 'Cantidad de ventas', value: sales.length },
      { metric: 'Total vendido', value: sales.reduce((sum, sale) => sum + sale.total, 0) },
      { metric: 'Ventas en efectivo', value: sales.filter((sale) => sale.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0) },
      { metric: 'Ventas por transferencia', value: sales.filter((sale) => sale.paymentMethod === 'transfer').reduce((sum, sale) => sum + sale.total, 0) },
      { metric: 'Ingresos manuales', value: movements.filter((movement) => movement.type === 'income').reduce((sum, movement) => sum + movement.amount, 0) },
      { metric: 'Egresos manuales', value: movements.filter((movement) => movement.type === 'expense').reduce((sum, movement) => sum + movement.amount, 0) }
    ];

    const workbook = buildWorkbook([
      excelSheet('Resumen', [
        { label: 'Metrica', value: (row) => row.metric },
        { label: 'Valor', value: (row) => row.value }
      ], summary),
      excelSheet('Ventas', [
        { label: 'Factura', value: (row) => row.invoiceNumber },
        { label: 'Fecha', value: (row) => row.date },
        { label: 'Vendedor', value: (row) => row.sellerName },
        { label: 'Pago', value: (row) => row.paymentMethod },
        { label: 'Producto', value: (row) => row.productName },
        { label: 'Cantidad', value: (row) => row.quantity },
        { label: 'Precio unitario', value: (row) => row.unitPrice },
        { label: 'Subtotal', value: (row) => row.subtotal },
        { label: 'Total factura', value: (row) => row.saleTotal },
        { label: 'Recibido efectivo', value: (row) => row.cashReceived },
        { label: 'Cambio devuelto', value: (row) => row.changeAmount }
      ], saleItems),
      excelSheet('Movimientos', [
        { label: 'Fecha', value: (row) => row.date },
        { label: 'Tipo', value: (row) => row.type === 'income' ? 'Ingreso' : 'Egreso' },
        { label: 'Monto', value: (row) => row.amount },
        { label: 'Metodo de pago', value: (row) => row.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia' },
        { label: 'Recibido efectivo', value: (row) => row.cashReceived },
        { label: 'Cambio devuelto', value: (row) => row.changeAmount },
        { label: 'Categoria', value: (row) => row.category },
        { label: 'Descripcion', value: (row) => row.description },
        { label: 'Usuario', value: (row) => row.userName }
      ], movements),
      excelSheet('Inventario', [
        { label: 'Insumo', value: (row) => row.name },
        { label: 'Cantidad', value: (row) => row.quantity },
        { label: 'Unidad', value: (row) => row.unit },
        { label: 'Stock minimo', value: (row) => row.minStock },
        { label: 'Ultima actualizacion', value: (row) => row.lastUpdate }
      ], inventory),
      excelSheet('Productos', [
        { label: 'Producto', value: (row) => row.name },
        { label: 'Precio', value: (row) => row.price },
        { label: 'Categoria', value: (row) => row.category },
        { label: 'Activo', value: (row) => row.isActive ? 'Si' : 'No' }
      ], products),
      excelSheet('Turnos', [
        { label: 'Usuario', value: (row) => row.userName },
        { label: 'Inicio', value: (row) => row.startTime },
        { label: 'Fin', value: (row) => row.endTime || '' },
        { label: 'Activo', value: (row) => row.isActive ? 'Si' : 'No' },
        { label: 'Total ventas', value: (row) => row.totalSales },
        { label: 'Cantidad ventas', value: (row) => row.salesCount }
      ], shifts),
      excelSheet('Usuarios', [
        { label: 'Usuario', value: (row) => row.username },
        { label: 'Nombre', value: (row) => row.fullName },
        { label: 'Rol', value: (row) => row.role },
        { label: 'Cuenta activa', value: (row) => row.isActive ? 'Si' : 'No' },
        { label: 'Creado', value: (row) => row.createdAt }
      ], users)
    ]);

    const filename = `mykonos-export-${startDate}-a-${endDate}.xls`;
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(workbook);
  } catch (error) {
    console.error('Error exportando reporte mensual:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/financial', protect, adminOnly, async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const sales = requireRow(await supabase.from('sales').select('*')).map(mapSale).filter((sale) => inRange(sale.date, start, end));
    const movements = requireRow(await supabase.from('movements').select('*')).map(mapMovement).filter((movement) => inRange(movement.date, start, end));

    const financial = {
      sales: {
        total: sales.reduce((sum, sale) => sum + sale.total, 0),
        cash: sales.filter((sale) => sale.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0),
        transfer: sales.filter((sale) => sale.paymentMethod === 'transfer').reduce((sum, sale) => sum + sale.total, 0)
      },
      movements: {
        income: { cash: 0, transfer: 0, total: 0 },
        expense: { cash: 0, transfer: 0, total: 0 }
      },
      balance: { cash: 0, transfer: 0, total: 0 }
    };

    movements.forEach((movement) => {
      financial.movements[movement.type][movement.paymentMethod] += movement.amount;
      financial.movements[movement.type].total += movement.amount;
    });

    financial.balance.cash = financial.sales.cash + financial.movements.income.cash - financial.movements.expense.cash;
    financial.balance.transfer = financial.sales.transfer + financial.movements.income.transfer - financial.movements.expense.transfer;
    financial.balance.total = financial.balance.cash + financial.balance.transfer;

    res.json(financial);
  } catch (error) {
    console.error('Error en reporte financiero:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/inventory', protect, adminOnly, async (req, res) => {
  try {
    const inventory = requireRow(await supabase.from('inventory').select('*')).map(mapInventory);
    res.json({
      totalItems: inventory.length,
      lowStock: inventory.filter((item) => item.quantity <= item.minStock).length,
      outOfStock: inventory.filter((item) => item.quantity === 0).length,
      items: inventory.sort((a, b) => a.quantity - b.quantity)
    });
  } catch (error) {
    console.error('Error en reporte de inventario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/employees', protect, adminOnly, async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const sales = requireRow(await supabase.from('sales').select('*')).map(mapSale).filter((sale) => inRange(sale.date, start, end));
    const shifts = requireRow(await supabase.from('shifts').select('*')).map(mapShift).filter((shift) => inRange(shift.startTime, start, end));

    const salesMap = new Map();
    sales.forEach((sale) => {
      const current = salesMap.get(sale.sellerName) || { _id: { seller: sale.seller, name: sale.sellerName }, totalSales: 0, salesCount: 0, avgSale: 0 };
      current.totalSales += sale.total;
      current.salesCount += 1;
      current.avgSale = current.totalSales / current.salesCount;
      salesMap.set(sale.sellerName, current);
    });

    const shiftMap = new Map();
    shifts.forEach((shift) => {
      const current = shiftMap.get(shift.userName) || { _id: shift.userName, totalShifts: 0, totalHours: 0 };
      current.totalShifts += 1;
      if (shift.endTime) {
        current.totalHours += (new Date(shift.endTime) - new Date(shift.startTime)) / (1000 * 60 * 60);
      }
      shiftMap.set(shift.userName, current);
    });

    res.json({
      salesByEmployee: [...salesMap.values()].sort((a, b) => b.totalSales - a.totalSales),
      shiftsByEmployee: [...shiftMap.values()]
    });
  } catch (error) {
    console.error('Error en reporte de empleados:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
