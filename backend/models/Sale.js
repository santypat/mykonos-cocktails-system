import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: Number
  }],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer'],
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerName: String,
  invoiceNumber: {
    type: String,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generar número de factura automáticamente
saleSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Sale').countDocuments();
    this.invoiceNumber = `MYK-${Date.now()}-${count + 1}`;
  }
  
  // Calcular subtotales
  this.items.forEach(item => {
    item.subtotal = item.price * item.quantity;
  });
  
  next();
});

export default mongoose.model('Sale', saleSchema);
