import express from 'express';
import Inventory from '../models/Inventory.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Obtener todo el inventario
router.get('/', protect, async (req, res) => {
  try {
    const inventory = await Inventory.find().sort('name');
    res.json(inventory);
  } catch (error) {
    console.error('Error obteniendo inventario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Crear insumo
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, quantity, unit, minStock } = req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({ message: 'Nombre y cantidad son requeridos' });
    }

    const existingItem = await Inventory.findOne({ name: name.trim() });
    if (existingItem) {
      return res.status(400).json({ message: 'El insumo ya existe' });
    }

    const item = await Inventory.create({
      name: name.trim(),
      quantity,
      unit: unit || 'unidades',
      minStock: minStock || 5
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creando insumo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Actualizar insumo
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, quantity, unit, minStock } = req.body;

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Insumo no encontrado' });
    }

    if (name) item.name = name.trim();
    if (quantity !== undefined) item.quantity = quantity;
    if (unit) item.unit = unit;
    if (minStock !== undefined) item.minStock = minStock;

    await item.save();
    res.json(item);
  } catch (error) {
    console.error('Error actualizando insumo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Ajustar cantidad (agregar o quitar)
router.patch('/:id/adjust', protect, adminOnly, async (req, res) => {
  try {
    const { adjustment } = req.body; // Puede ser positivo (agregar) o negativo (quitar)

    if (adjustment === undefined || adjustment === 0) {
      return res.status(400).json({ message: 'Ajuste inválido' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Insumo no encontrado' });
    }

    const newQuantity = item.quantity + adjustment;
    
    if (newQuantity < 0) {
      return res.status(400).json({ message: 'La cantidad no puede ser negativa' });
    }

    item.quantity = newQuantity;
    await item.save();

    res.json(item);
  } catch (error) {
    console.error('Error ajustando inventario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar insumo
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Insumo no encontrado' });
    }

    await item.deleteOne();
    res.json({ message: 'Insumo eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando insumo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener alertas de stock bajo
router.get('/alerts/low-stock', protect, async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$quantity', '$minStock'] }
    }).sort('quantity');

    res.json(lowStockItems);
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
