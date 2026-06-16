import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del insumo es requerido'],
    trim: true,
    unique: true
  },
  quantity: {
    type: Number,
    required: [true, 'La cantidad es requerida'],
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    default: 'unidades'
  },
  minStock: {
    type: Number,
    default: 5,
    min: 0
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Actualizar lastUpdate cuando cambie la cantidad
inventorySchema.pre('save', function(next) {
  if (this.isModified('quantity')) {
    this.lastUpdate = Date.now();
  }
  next();
});

export default mongoose.model('Inventory', inventorySchema);
