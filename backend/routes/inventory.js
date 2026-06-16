import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { supabase, mapInventory, requireRow } from '../lib/supabase.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const inventory = requireRow(await supabase
      .from('inventory')
      .select('*')
      .order('name', { ascending: true }));
    res.json(inventory.map(mapInventory));
  } catch (error) {
    console.error('Error obteniendo inventario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, quantity, unit, minStock } = req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({ message: 'Nombre y cantidad son requeridos' });
    }

    const item = requireRow(await supabase
      .from('inventory')
      .insert({
        name: name.trim(),
        quantity,
        unit: unit || 'unidades',
        min_stock: minStock ?? 5
      })
      .select('*')
      .single());

    res.status(201).json(mapInventory(item));
  } catch (error) {
    console.error('Error creando insumo:', error);
    res.status(500).json({ message: error.code === '23505' ? 'El insumo ya existe' : 'Error del servidor' });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, quantity, unit, minStock } = req.body;
    const update = {};

    if (name) update.name = name.trim();
    if (quantity !== undefined) update.quantity = quantity;
    if (unit) update.unit = unit;
    if (minStock !== undefined) update.min_stock = minStock;
    if (quantity !== undefined) update.last_update = new Date().toISOString();

    const item = requireRow(await supabase
      .from('inventory')
      .update(update)
      .eq('id', req.params.id)
      .select('*')
      .single());

    res.json(mapInventory(item));
  } catch (error) {
    console.error('Error actualizando insumo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.patch('/:id/adjust', protect, adminOnly, async (req, res) => {
  try {
    const { adjustment } = req.body;

    if (adjustment === undefined || adjustment === 0) {
      return res.status(400).json({ message: 'Ajuste invalido' });
    }

    const item = requireRow(await supabase
      .from('inventory')
      .select('*')
      .eq('id', req.params.id)
      .single());

    const newQuantity = Number(item.quantity) + Number(adjustment);

    if (newQuantity < 0) {
      return res.status(400).json({ message: 'La cantidad no puede ser negativa' });
    }

    const updated = requireRow(await supabase
      .from('inventory')
      .update({ quantity: newQuantity, last_update: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*')
      .single());

    res.json(mapInventory(updated));
  } catch (error) {
    console.error('Error ajustando inventario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await supabase.from('inventory').delete().eq('id', req.params.id).throwOnError();
    res.json({ message: 'Insumo eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando insumo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/alerts/low-stock', protect, async (req, res) => {
  try {
    const inventory = requireRow(await supabase.from('inventory').select('*'));
    res.json(inventory.map(mapInventory).filter((item) => item.quantity <= item.minStock));
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
