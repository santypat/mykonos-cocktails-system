import express from 'express';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Obtener todos los usuarios
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Crear usuario
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    }

    const user = await User.create({
      username,
      password,
      fullName,
      role: role || 'seller',
      isActive: true
    });

    res.status(201).json({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Actualizar usuario
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { fullName, role, isActive, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.isPrincipal && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'No se puede modificar al administrador principal' });
    }

    if (fullName) user.fullName = fullName;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;

    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar usuario
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.isPrincipal) {
      return res.status(403).json({ message: 'No se puede eliminar al administrador principal' });
    }

    await user.deleteOne();
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
