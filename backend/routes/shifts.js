import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { supabase, mapShift, requireRow } from '../lib/supabase.js';

const router = express.Router();

router.post('/start', protect, async (req, res) => {
  try {
    const activeShift = requireRow(await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', req.user._id)
      .eq('is_active', true)
      .maybeSingle());

    if (activeShift) {
      return res.status(400).json({ message: 'Ya tienes un turno activo' });
    }

    const shift = requireRow(await supabase
      .from('shifts')
      .insert({
        user_id: req.user._id,
        user_name: req.user.fullName,
        start_time: new Date().toISOString(),
        is_active: true
      })
      .select('*')
      .single());

    res.status(201).json(mapShift(shift));
  } catch (error) {
    console.error('Error iniciando turno:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/end', protect, async (req, res) => {
  try {
    const shift = requireRow(await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', req.user._id)
      .eq('is_active', true)
      .maybeSingle());

    if (!shift) {
      return res.status(404).json({ message: 'No tienes un turno activo' });
    }

    const updated = requireRow(await supabase
      .from('shifts')
      .update({ end_time: new Date().toISOString(), is_active: false })
      .eq('id', shift.id)
      .select('*')
      .single());

    res.json(mapShift(updated));
  } catch (error) {
    console.error('Error finalizando turno:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/active', protect, async (req, res) => {
  try {
    const shift = requireRow(await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', req.user._id)
      .eq('is_active', true)
      .maybeSingle());
    res.json(mapShift(shift));
  } catch (error) {
    console.error('Error obteniendo turno activo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/active/all', protect, adminOnly, async (req, res) => {
  try {
    const shifts = requireRow(await supabase
      .from('shifts')
      .select('*')
      .eq('is_active', true)
      .order('start_time', { ascending: false }));
    res.json(shifts.map(mapShift));
  } catch (error) {
    console.error('Error obteniendo turnos activos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/history', protect, async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    if (userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
    }

    let query = supabase.from('shifts').select('*');
    if (startDate) query = query.gte('start_time', new Date(startDate).toISOString());
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('start_time', end.toISOString());
    }
    if (userId) query = query.eq('user_id', userId);
    else if (req.user.role !== 'admin') query = query.eq('user_id', req.user._id);

    const shifts = requireRow(await query.order('start_time', { ascending: false }));
    res.json(shifts.map(mapShift));
  } catch (error) {
    console.error('Error obteniendo historial de turnos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
