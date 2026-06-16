import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { supabase, mapMovement, requireRow } from '../lib/supabase.js';

const router = express.Router();

function applyDateFilters(query, startDate, endDate) {
  let next = query;
  if (startDate) next = next.gte('date', new Date(startDate).toISOString());
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    next = next.lte('date', end.toISOString());
  }
  return next;
}

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate, type, paymentMethod } = req.query;
    let query = supabase.from('movements').select('*');

    query = applyDateFilters(query, startDate, endDate);
    if (type) query = query.eq('type', type);
    if (paymentMethod) query = query.eq('payment_method', paymentMethod);

    const movements = requireRow(await query.order('date', { ascending: false }));
    res.json(movements.map(mapMovement));
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { type, amount, paymentMethod, description, category } = req.body;

    if (!type || !amount || !paymentMethod || !description) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const movement = requireRow(await supabase
      .from('movements')
      .insert({
        type,
        amount,
        payment_method: paymentMethod,
        description,
        category: category || 'Otros',
        user_id: req.user._id,
        user_name: req.user.fullName
      })
      .select('*')
      .single());

    res.status(201).json(mapMovement(movement));
  } catch (error) {
    console.error('Error creando movimiento:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/balance', protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const movements = requireRow(await applyDateFilters(
      supabase.from('movements').select('*'),
      startDate,
      endDate
    ));

    const balance = {
      cash: { income: 0, expense: 0, total: 0 },
      transfer: { income: 0, expense: 0, total: 0 },
      total: { income: 0, expense: 0, total: 0 }
    };

    movements.map(mapMovement).forEach((movement) => {
      const amount = movement.amount;

      if (movement.type === 'income') {
        balance[movement.paymentMethod].income += amount;
        balance.total.income += amount;
      } else {
        balance[movement.paymentMethod].expense += amount;
        balance.total.expense += amount;
      }
    });

    balance.cash.total = balance.cash.income - balance.cash.expense;
    balance.transfer.total = balance.transfer.income - balance.transfer.expense;
    balance.total.total = balance.total.income - balance.total.expense;

    res.json(balance);
  } catch (error) {
    console.error('Error calculando balance:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await supabase.from('movements').delete().eq('id', req.params.id).throwOnError();
    res.json({ message: 'Movimiento eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando movimiento:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
