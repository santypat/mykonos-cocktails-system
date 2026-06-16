import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import Shift from '../models/Shift.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Crear venta
router.post('/', protect, async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Debe incluir al menos un producto' });
    }

    if (!['cash', 'transfer'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Metodo de pago invalido' });
    }

    const activeShift = await Shift.findOne({
      user: req.user._id,
      isActive: true
    });

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

      const product = await Product.findById(item.product).populate('preparation.ingredient');

      if (!product) {
        return res.status(404).json({ message: `Producto ${item.product} no encontrado` });
      }

      if (!product.isActive) {
        return res.status(400).json({ message: `Producto ${product.name} no esta disponible` });
      }

      for (const prep of product.preparation) {
        const ingredientId = prep.ingredient?._id?.toString();

        if (!ingredientId) {
          return res.status(400).json({ message: `Insumo no encontrado para ${product.name}` });
        }

        const previous = inventoryRequirements.get(ingredientId) || {
          quantity: 0,
          productNames: new Set()
        };

        previous.quantity += prep.quantity * quantity;
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
      const ingredient = await Inventory.findById(ingredientId);

      if (!ingredient) {
        return res.status(400).json({ message: 'Insumo no encontrado' });
      }

      if (ingredient.quantity < requirement.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente de ${ingredient.name} para ${[...requirement.productNames].join(', ')}`
        });
      }
    }

    for (const [ingredientId, requirement] of inventoryRequirements) {
      await Inventory.findByIdAndUpdate(ingredientId, {
        $inc: { quantity: -requirement.quantity },
        $set: { lastUpdate: new Date() }
      });
    }

    const sale = await Sale.create({
      items: saleItems,
      total,
      paymentMethod,
      seller: req.user._id,
      sellerName: req.user.fullName
    });

    activeShift.totalSales += total;
    activeShift.salesCount += 1;
    await activeShift.save();

    await sale.populate('items.product');

    res.status(201).json(sale);
  } catch (error) {
    console.error('Error creando venta:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener ventas
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate, seller } = req.query;

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

    if (req.user.role !== 'admin') {
      filter.seller = req.user._id;
    } else if (seller) {
      filter.seller = seller;
    }

    const sales = await Sale.find(filter)
      .populate('seller', 'fullName')
      .populate('items.product')
      .sort('-date');

    res.json(sales);
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener venta por ID
router.get('/:id', protect, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('seller', 'fullName')
      .populate('items.product');

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    if (req.user.role !== 'admin' && sale.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Error obteniendo venta:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
