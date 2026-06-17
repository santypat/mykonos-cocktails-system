import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { supabase, mapInventory, mapProduct, requireRow } from '../lib/supabase.js';

const router = express.Router();
const uploadsDir = path.resolve(
  process.cwd(),
  path.basename(process.cwd()) === 'backend' ? 'uploads' : 'backend/uploads'
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) return cb(null, true);
    cb(new Error('Solo se permiten imagenes'));
  }
});

async function populatePreparation(preparation = []) {
  const ids = [...new Set(preparation.map((prep) => prep.ingredient).filter(Boolean))];
  if (!ids.length) return preparation;

  const inventory = requireRow(await supabase
    .from('inventory')
    .select('*')
    .in('id', ids));

  const byId = new Map(inventory.map((item) => [item.id, mapInventory(item)]));
  return preparation.map((prep) => ({
    ...prep,
    ingredient: byId.get(prep.ingredient) || prep.ingredient
  }));
}

async function mapProductWithPreparation(row) {
  return mapProduct(row, await populatePreparation(row.preparation || []));
}

function getProductStockStatus(product) {
  const ingredients = product.preparation || [];

  if (!ingredients.length) {
    return {
      canSell: true,
      status: 'ok',
      availableUnits: null,
      warnings: []
    };
  }

  const availableUnits = ingredients.map((prep) => {
    const ingredient = prep.ingredient;
    const required = Number(prep.quantity || 0);
    if (!ingredient || !required) return Infinity;
    return Math.floor(Number(ingredient.quantity || 0) / required);
  });

  const minAvailable = Math.min(...availableUnits);
  const warnings = ingredients
    .filter((prep) => prep.ingredient && Number(prep.ingredient.quantity) <= Number(prep.ingredient.minStock))
    .map((prep) => ({
      ingredientId: prep.ingredient._id,
      ingredientName: prep.ingredient.name,
      quantity: prep.ingredient.quantity,
      minStock: prep.ingredient.minStock,
      unit: prep.ingredient.unit
    }));

  return {
    canSell: minAvailable > 0,
    status: minAvailable <= 0 ? 'out' : warnings.length ? 'low' : 'ok',
    availableUnits: Number.isFinite(minAvailable) ? minAvailable : null,
    warnings
  };
}

router.get('/', protect, async (req, res) => {
  try {
    const rows = requireRow(await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false }));
    res.json(await Promise.all(rows.map(mapProductWithPreparation)));
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/active', protect, async (req, res) => {
  try {
    const products = requireRow(await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true }));
    const mapped = await Promise.all(products.map(mapProductWithPreparation));
    res.json(mapped.map((product) => ({
      ...product,
      stock: getProductStockStatus(product)
    })));
  } catch (error) {
    console.error('Error obteniendo productos activos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { name, price, preparation, category } = req.body;
    const parsedPreparation = preparation ? JSON.parse(preparation) : [];

    const productData = {
      name,
      price: Number(price),
      category: category || 'Granizados',
      preparation: parsedPreparation,
      is_active: true
    };

    if (req.file) {
      productData.image = `/uploads/${req.file.filename}`;
    }

    const product = requireRow(await supabase
      .from('products')
      .insert(productData)
      .select('*')
      .single());

    res.status(201).json(await mapProductWithPreparation(product));
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { name, price, preparation, isActive, category } = req.body;
    const update = {};

    if (name) update.name = name;
    if (price !== undefined) update.price = Number(price);
    if (category) update.category = category;
    if (preparation) update.preparation = JSON.parse(preparation);
    if (isActive !== undefined) update.is_active = isActive === true || isActive === 'true';
    if (req.file) update.image = `/uploads/${req.file.filename}`;

    const product = requireRow(await supabase
      .from('products')
      .update(update)
      .eq('id', req.params.id)
      .select('*')
      .single());

    res.json(await mapProductWithPreparation(product));
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .throwOnError();

    res.json({ message: 'Producto desactivado exitosamente' });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
