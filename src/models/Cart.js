import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  items: [{
    productId: {
      type: String,
      required: true
    },
    productName: String,
    price: Number,
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],

  tebexBasketId: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: ['active', 'checked_out', 'completed', 'abandoned'],
    default: 'active'
  },

  totalPrice: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate total price before saving
cartSchema.pre('save', function(next) {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
