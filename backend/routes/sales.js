import express from 'express';
import { protect } from '../middleware/auth.js';
import { supabase, mapInventory, mapProduct, mapSale, requireRow } from '../lib/supabase.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Debe incluir al menos un producto' });
    }

    if (!['cash', 'transfer'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Metodo de pago invalido' });
    }

    const activeShift = requireRow(await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', req.user._id)
      .eq('is_active', true)
      .maybeSingle());

    if (!activeShift) {
      return res.status(400).json({ message: 'Debes iniciar turno primero' });
    }

    const saleItems = [];
    const inventoryRequirements = new Map();
    let total = 0;

    for (const item of items) {
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Cantidad invalida' });
      }

      const productRow = requireRow(await supabase
        .from('products')
        .select('*')
        .eq('id', item.product)
        .single());

      const product = mapProduct(productRow);

      if (!product.isActive) {
        return res.status(400).json({ message: `Producto ${product.name} no esta disponible` });
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

    for (const [ingredientId, requirement] of inventoryRequirements) {
      const ingredient = mapInventory(requireRow(await supabase
        .from('inventory')
        .select('*')
        .eq('id', ingredientId)
        .single()));

      if (ingredient.quantity < requirement.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente de ${ingredient.name} para ${[...requirement.productNames].join(', ')}`
        });
      }
    }

    for (const [ingredientId, requirement] of inventoryRequirements) {
      const ingredient = mapInventory(requireRow(await supabase
        .from('inventory')
        .select('*')
        .eq('id', ingredientId)
        .single()));

      await supabase
        .from('inventory')
        .update({
          quantity: ingredient.quantity - requirement.quantity,
          last_update: new Date().toISOString()
        })
        .eq('id', ingredientId)
        .throwOnError();
    }

    const invoiceNumber = `MYK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const sale = requireRow(await supabase
      .from('sales')
      .insert({
        items: saleItems,
        total,
        payment_method: paymentMethod,
        seller_id: req.user._id,
        seller_name: req.user.fullName,
        invoice_number: invoiceNumber
      })
      .select('*')
      .single());

    await supabase
      .from('shifts')
      .update({
        total_sales: Number(activeShift.total_sales) + total,
        sales_count: Number(activeShift.sales_count) + 1
      })
      .eq('id', activeShift.id)
      .throwOnError();

    res.status(201).json(mapSale(sale));
  } catch (error) {
    console.error('Error creando venta:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
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
