import express from 'express';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Usuario inactivo' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Crear usuario administrador inicial (solo para desarrollo)
router.post('/init-admin', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_INIT_ADMIN !== 'true') {
      return res.status(404).json({ message: 'Ruta no disponible' });
    }

    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      return res.status(400).json({ message: 'Ya existe un administrador' });
    }

    const username = process.env.INIT_ADMIN_USERNAME || 'admin';
    const password = process.env.INIT_ADMIN_PASSWORD || 'admin123';

    await User.create({
      username,
      password,
      fullName: process.env.INIT_ADMIN_NAME || 'Administrador Principal',
      role: 'admin',
      isPrincipal: true,
      isActive: true
    });

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
