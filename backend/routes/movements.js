import express from 'express';
import Movement from '../models/Movement.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Obtener todos los movimientos
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate, type, paymentMethod } = req.query;

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

    if (type) filter.type = type;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const movements = await Movement.find(filter)
      .populate('user', 'fullName')
      .sort('-date');

    res.json(movements);
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Crear movimiento
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { type, amount, paymentMethod, description, category } = req.body;

    if (!type || !amount || !paymentMethod || !description) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const movement = await Movement.create({
      type,
      amount,
      paymentMethod,
      description,
      category: category || 'Otros',
      user: req.user._id,
      userName: req.user.fullName
    });

    res.status(201).json(movement);
  } catch (error) {
    console.error('Error creando movimiento:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener balance de caja
router.get('/balance', protect, adminOnly, async (req, res) => {
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

    const movements = await Movement.find(filter);

    const balance = {
      cash: { income: 0, expense: 0, total: 0 },
      transfer: { income: 0, expense: 0, total: 0 },
      total: { income: 0, expense: 0, total: 0 }
    };

    movements.forEach(movement => {
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

// Eliminar movimiento
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const movement = await Movement.findById(req.params.id);
    if (!movement) {
      return res.status(404).json({ message: 'Movimiento no encontrado' });
    }

    await movement.deleteOne();
    res.json({ message: 'Movimiento eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando movimiento:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
