import express from 'express';
import bcrypt from 'bcryptjs';
import { protect, adminOnly } from '../middleware/auth.js';
import { supabase, mapUser, requireRow } from '../lib/supabase.js';

const router = express.Router();

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = requireRow(await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false }));
    res.json(users.map(mapUser));
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const existingUser = requireRow(await supabase
      .from('app_users')
      .select('id')
      .eq('username', username)
      .maybeSingle());

    if (existingUser) {
      return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = requireRow(await supabase
      .from('app_users')
      .insert({
        username,
        password_hash: passwordHash,
        full_name: fullName,
        role: role || 'seller',
        is_active: true
      })
      .select('*')
      .single());

    res.status(201).json(mapUser(user));
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { fullName, role, isActive, password } = req.body;

    const user = requireRow(await supabase
      .from('app_users')
      .select('*')
      .eq('id', req.params.id)
      .single());

    if (user.is_principal && req.user._id !== user.id) {
      return res.status(403).json({ message: 'No se puede modificar al administrador principal' });
    }

    const update = {};
    if (fullName) update.full_name = fullName;
    if (role) update.role = role;
    if (isActive !== undefined) update.is_active = isActive;
    if (password) update.password_hash = await bcrypt.hash(password, 10);

    const updated = requireRow(await supabase
      .from('app_users')
      .update(update)
      .eq('id', req.params.id)
      .select('*')
      .single());

    res.json(mapUser(updated));
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = requireRow(await supabase
      .from('app_users')
      .select('*')
      .eq('id', req.params.id)
      .single());

    if (user.is_principal) {
      return res.status(403).json({ message: 'No se puede eliminar al administrador principal' });
    }

    await supabase.from('app_users').delete().eq('id', req.params.id).throwOnError();
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
