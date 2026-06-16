import express from 'express';
import Product from '../models/Product.js';
import { protect, adminOnly } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configurar multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes'));
  }
});

// Obtener todos los productos
router.get('/', protect, async (req, res) => {
  try {
    const products = await Product.find().populate('preparation.ingredient').sort('-createdAt');
    res.json(products);
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener productos activos (para vendedores)
router.get('/active', protect, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort('name');
    res.json(products);
  } catch (error) {
    console.error('Error obteniendo productos activos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Crear producto
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { name, price, preparation, category } = req.body;

    const productData = {
      name,
      price: parseFloat(price),
      category: category || 'Granizados',
      preparation: preparation ? JSON.parse(preparation) : [],
      isActive: true
    };

    if (req.file) {
      productData.image = `/uploads/${req.file.filename}`;
    }

    const product = await Product.create(productData);
    await product.populate('preparation.ingredient');

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Actualizar producto
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { name, price, preparation, isActive, category } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    product.name = name || product.name;
    product.price = price ? parseFloat(price) : product.price;
    product.category = category || product.category;
    
    if (preparation) {
      product.preparation = JSON.parse(preparation);
    }
    
    if (isActive !== undefined) {
      product.isActive = isActive;
    }

    if (req.file) {
      product.image = `/uploads/${req.file.filename}`;
    }

    await product.save();
    await product.populate('preparation.ingredient');

    res.json(product);
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar producto
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await product.deleteOne();
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
