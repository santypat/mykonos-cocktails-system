import express from 'express';
import { protect } from '../middleware/auth.js';
import { supabase, mapInventory, mapProduct, mapSale, requireRow, withTransaction } from '../lib/supabase.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { items, paymentMethod, cashReceived = 0 } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Debe incluir al menos un producto' });
    }

    if (!['cash', 'transfer'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Metodo de pago invalido' });
    }

    const receivedAmount = paymentMethod === 'cash' ? Number(cashReceived) : 0;

    if (paymentMethod === 'cash' && (!Number.isFinite(receivedAmount) || receivedAmount < 0)) {
      return res.status(400).json({ message: 'Efectivo recibido invalido' });
    }

    const sale = await withTransaction(async (client) => {
      const activeShiftResult = await client.query(
        'select * from shifts where user_id = $1 and is_active = true limit 1 for update',
        [req.user._id]
      );
      const activeShift = activeShiftResult.rows[0];

      if (!activeShift) {
        const error = new Error('Debes iniciar turno primero');
        error.statusCode = 400;
        throw error;
      }

      const saleItems = [];
      const inventoryRequirements = new Map();
      let total = 0;

      for (const item of items) {
        const quantity = Number(item.quantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
          const error = new Error('Cantidad invalida');
          error.statusCode = 400;
          throw error;
        }

        const productResult = await client.query('select * from products where id = $1', [item.product]);
        const product = mapProduct(productResult.rows[0]);

        if (!product) {
          const error = new Error('Producto no encontrado');
          error.statusCode = 400;
          throw error;
        }

        if (!product.isActive) {
          const error = new Error(`Producto ${product.name} no esta disponible`);
          error.statusCode = 400;
          throw error;
        }

        for (const prep of product.preparation || []) {
          const ingredientId = prep.ingredient;
          const previous = inventoryRequirements.get(ingredientId) || {
            quantity: 0,
            productNames: new Set()
          };

          previous.quantity += Number(prep.quantity) * quantity;
          previous.productNames.add(product.name);
          inventoryRequirements.set(ingredientId, previous);
        }

        const subtotal = product.price * quantity;
        total += subtotal;

        saleItems.push({
          product: product._id,
          productName: product.name,
          quantity,
          price: product.price,
          subtotal
        });
      }

      if (paymentMethod === 'cash' && receivedAmount < total) {
        const error = new Error('El efectivo recibido no alcanza para pagar la venta');
        error.statusCode = 400;
        throw error;
      }

      for (const [ingredientId, requirement] of inventoryRequirements) {
        const updatedInventory = await client.query(
          `update inventory
           set quantity = quantity - $1, last_update = now()
           where id = $2 and quantity >= $1
           returning *`,
          [requirement.quantity, ingredientId]
        );

        if (!updatedInventory.rows.length) {
          const ingredientResult = await client.query('select * from inventory where id = $1', [ingredientId]);
          const ingredient = mapInventory(ingredientResult.rows[0]);
          const ingredientName = ingredient?.name || 'insumo';
          const error = new Error(`Stock insuficiente de ${ingredientName} para ${[...requirement.productNames].join(', ')}`);
          error.statusCode = 400;
          throw error;
        }
      }

      const changeAmount = paymentMethod === 'cash' ? receivedAmount - total : 0;
      const invoiceNumber = `MYK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const saleResult = await client.query(
        `insert into sales (
          items,
          total,
          payment_method,
          cash_received,
          change_amount,
          seller_id,
          seller_name,
          invoice_number
        ) values ($1, $2, $3, $4, $5, $6, $7, $8)
        returning *`,
        [
          JSON.stringify(saleItems),
          total,
          paymentMethod,
          receivedAmount,
          changeAmount,
          req.user._id,
          req.user.fullName,
          invoiceNumber
        ]
      );

      await client.query(
        `update shifts
         set total_sales = total_sales + $1,
             sales_count = sales_count + 1
         where id = $2`,
        [total, activeShift.id]
      );

      await client.query(
        `insert into movements (
          type,
          amount,
          payment_method,
          cash_received,
          change_amount,
          description,
          category,
          user_id,
          user_name
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          'income',
          total,
          paymentMethod,
          receivedAmount,
          changeAmount,
          paymentMethod === 'cash'
            ? `Venta ${invoiceNumber}. Recibido: ${receivedAmount}. Cambio: ${changeAmount}.`
            : `Venta ${invoiceNumber}`,
          'Ventas',
          req.user._id,
          req.user.fullName
        ]
      );

      return saleResult.rows[0];
    });

    res.status(201).json(mapSale(sale));
  } catch (error) {
    console.error('Error creando venta:', error);
    res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Error del servidor',
      error: error.message
    });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate, seller } = req.query;
    let query = supabase.from('sales').select('*');

    if (startDate) query = query.gte('date', new Date(startDate).toISOString());
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('date', end.toISOString());
    }

    if (req.user.role !== 'admin') query = query.eq('seller_id', req.user._id);
    else if (seller) query = query.eq('seller_id', seller);

    const sales = requireRow(await query.order('date', { ascending: false }));
    res.json(sales.map(mapSale));
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const sale = requireRow(await supabase
      .from('sales')
      .select('*')
      .eq('id', req.params.id)
      .single());

    if (req.user.role !== 'admin' && sale.seller_id !== req.user._id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    res.json(mapSale(sale));
  } catch (error) {
    console.error('Error obteniendo venta:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
