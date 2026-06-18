import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import saleRoutes from './routes/sales.js';
import inventoryRoutes from './routes/inventory.js';
import movementRoutes from './routes/movements.js';
import userRoutes from './routes/users.js';
import reportRoutes from './routes/reports.js';
import shiftRoutes from './routes/shifts.js';

dotenv.config();

const app = express();
const uploadsDir = path.resolve(
  process.cwd(),
  path.basename(process.cwd()) === 'backend' ? 'uploads' : 'backend/uploads'
);
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/shifts', shiftRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mykonos API funcionando correctamente' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

export default app;
