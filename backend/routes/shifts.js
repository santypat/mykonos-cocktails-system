import express from 'express';
import Shift from '../models/Shift.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Iniciar turno
router.post('/start', protect, async (req, res) => {
  try {
    // Verificar si ya tiene un turno activo
    const activeShift = await Shift.findOne({ 
      user: req.user._id, 
      isActive: true 
    });

    if (activeShift) {
      return res.status(400).json({ message: 'Ya tienes un turno activo' });
    }

    const shift = await Shift.create({
      user: req.user._id,
      userName: req.user.fullName,
      startTime: new Date(),
      isActive: true
    });

    res.status(201).json(shift);
  } catch (error) {
    console.error('Error iniciando turno:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Finalizar turno
router.post('/end', protect, async (req, res) => {
  try {
    const shift = await Shift.findOne({ 
      user: req.user._id, 
      isActive: true 
    });

    if (!shift) {
      return res.status(404).json({ message: 'No tienes un turno activo' });
    }

    shift.endTime = new Date();
    shift.isActive = false;
    await shift.save();

    res.json(shift);
  } catch (error) {
    console.error('Error finalizando turno:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener turno activo del usuario
router.get('/active', protect, async (req, res) => {
  try {
    const shift = await Shift.findOne({ 
      user: req.user._id, 
      isActive: true 
    });

    res.json(shift);
  } catch (error) {
    console.error('Error obteniendo turno activo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener todos los turnos activos (admin)
router.get('/active/all', protect, adminOnly, async (req, res) => {
  try {
    const shifts = await Shift.find({ isActive: true })
      .populate('user', 'fullName username')
      .sort('-startTime');

    res.json(shifts);
  } catch (error) {
    console.error('Error obteniendo turnos activos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener historial de turnos
router.get('/history', protect, async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const filter = {};
    
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.startTime.$lte = end;
      }
    }

    if (userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
    }

    if (userId) {
      filter.user = userId;
    } else if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    }

    const shifts = await Shift.find(filter)
      .populate('user', 'fullName username')
      .sort('-startTime');

    res.json(shifts);
  } catch (error) {
    console.error('Error obteniendo historial de turnos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
