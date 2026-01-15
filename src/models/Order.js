import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  tebexTransactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  products: [{
    productId: String,
    productName: String,
    price: Number,
    quantity: Number
  }],

  totalPrice: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: 'USD'
  },

  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'failed'],
    default: 'pending',
    index: true
  },

  paymentMethod: String,

  customerEmail: String,

  // Tebex webhook data
  webhookData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: Date
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
