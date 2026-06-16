import express from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import { supabase, mapUser, requireRow } from '../lib/supabase.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contrasena son requeridos' });
    }

    const user = requireRow(await supabase
      .from('app_users')
      .select('*')
      .eq('username', username)
      .maybeSingle());

    if (!user) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'Usuario inactivo' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const token = generateToken(user.id);
    const apiUser = mapUser(user);

    res.json({
      token,
      user: {
        id: apiUser.id,
        username: apiUser.username,
        fullName: apiUser.fullName,
        role: apiUser.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/init-admin', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_INIT_ADMIN !== 'true') {
      return res.status(404).json({ message: 'Ruta no disponible' });
    }

    const adminExists = requireRow(await supabase
      .from('app_users')
      .select('id')
      .eq('role', 'admin')
      .maybeSingle());

    if (adminExists) {
      return res.status(400).json({ message: 'Ya existe un administrador' });
    }

    const username = process.env.INIT_ADMIN_USERNAME || 'admin';
    const password = process.env.INIT_ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    await supabase.from('app_users').insert({
      username,
      password_hash: passwordHash,
      full_name: process.env.INIT_ADMIN_NAME || 'Administrador Principal',
      role: 'admin',
      is_principal: true,
      is_active: true
    }).throwOnError();

    res.json({
      message: 'Administrador creado exitosamente',
      username
    });
  } catch (error) {
    console.error('Error creando admin:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
