import express from 'express';
import bcrypt from 'bcryptjs';
import { protect, adminOnly } from '../middleware/auth.js';
import { withTransaction } from '../lib/supabase.js';

const router = express.Router();

router.post('/reset-production-data', protect, adminOnly, async (req, res) => {
  try {
    const result = await withTransaction(async (client) => {
      const tableNames = ['sales', 'movements', 'shifts', 'products', 'inventory', 'app_users'];
      const countsBefore = {};

      for (const tableName of tableNames) {
        const { rows } = await client.query(`select count(*)::int as count from ${tableName}`);
        countsBefore[tableName] = rows[0].count;
      }

      const adminPasswordHash = await bcrypt.hash('admin123', 10);

      await client.query('delete from movements');
      await client.query('delete from sales');
      await client.query('delete from shifts');
      await client.query('delete from products');
      await client.query('delete from inventory');
      await client.query('delete from app_users where is_principal is not true');

      const principal = await client.query(
        'select id from app_users where is_principal = true order by created_at asc limit 1'
      );

      if (principal.rows[0]) {
        await client.query(
          `update app_users
           set username = $1,
               password_hash = $2,
               full_name = $3,
               role = $4,
               is_active = true,
               is_principal = true
           where id = $5`,
          ['admin', adminPasswordHash, 'Administrador Principal', 'admin', principal.rows[0].id]
        );
      } else {
        await client.query(
          `insert into app_users (username, password_hash, full_name, role, is_active, is_principal)
           values ($1, $2, $3, $4, true, true)`,
          ['admin', adminPasswordHash, 'Administrador Principal', 'admin']
        );
      }

      const countsAfter = {};
      for (const tableName of tableNames) {
        const { rows } = await client.query(`select count(*)::int as count from ${tableName}`);
        countsAfter[tableName] = rows[0].count;
      }

      return { countsBefore, countsAfter };
    });

    res.json(result);
  } catch (error) {
    console.error('Error limpiando datos de produccion:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
