import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { supabase, requireRow } from '../lib/supabase.js';

const router = express.Router();

const BACKUP_TABLES = [
  'app_users',
  'inventory',
  'products',
  'sales',
  'movements',
  'shifts'
];

router.get('/database', protect, adminOnly, async (req, res) => {
  try {
    const tables = {};
    const counts = {};

    for (const table of BACKUP_TABLES) {
      const rows = requireRow(await supabase.from(table).select('*'));
      tables[table] = rows;
      counts[table] = rows.length;
    }

    const backup = {
      metadata: {
        app: 'mykonos-cocktails-system',
        generatedAt: new Date().toISOString(),
        generatedBy: {
          id: req.user._id,
          username: req.user.username,
          fullName: req.user.fullName
        },
        tables: BACKUP_TABLES,
        counts
      },
      tables
    };

    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mykonos-database-backup-${date}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (error) {
    console.error('Error generando respaldo de base de datos:', error);
    res.status(500).json({ message: 'Error generando respaldo de base de datos' });
  }
});

export default router;
