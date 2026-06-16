import jwt from 'jsonwebtoken';
import { supabase, mapUser, requireRow } from '../lib/supabase.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'No autorizado, token no encontrado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = requireRow(await supabase
      .from('app_users')
      .select('*')
      .eq('id', decoded.id)
      .single());

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'Usuario inactivo' });
    }

    req.user = mapUser(user);
    next();
  } catch (error) {
    console.error('Error en autenticacion:', error);
    res.status(401).json({ message: 'No autorizado, token invalido' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
  }
};

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};
