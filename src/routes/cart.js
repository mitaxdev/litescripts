import express from 'express';
import axios from 'axios';
import Cart from '../models/Cart.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/cart/add
// @desc    Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { productId, productName, price, quantity = 1 } = req.body;

    // Find or create cart for user
    let cart = await Cart.findOne({ userId: req.user.userId, status: 'active' });

    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
    }

    // Check if item already in cart
    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, productName, price, quantity });
    }

    await cart.save();

    res.json({
      message: 'Item added to cart',
      cart: {
        items: cart.items,
        totalPrice: cart.totalPrice
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// @route   GET /api/cart
// @desc    Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId, status: 'active' });

    if (!cart) {
      return res.json({ items: [], totalPrice: 0 });
    }

    res.json({
      items: cart.items,
      totalPrice: cart.totalPrice
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// @route   DELETE /api/cart/item/:productId
// @desc    Remove item from cart
router.delete('/item/:productId', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId, status: 'active' });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.productId !== req.params.productId);
    await cart.save();

    res.json({
      message: 'Item removed',
      cart: {
        items: cart.items,
        totalPrice: cart.totalPrice
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// @route   POST /api/cart/checkout
// @desc    Create Tebex basket and get checkout URL
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId, status: 'active' });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Create Tebex basket
    const tebexResponse = await axios.post(
      'https://plugin.tebex.io/baskets',
      {
        packages: cart.items.map(item => ({
          package_id: parseInt(item.productId),
          quantity: item.quantity
        }))
      },
      {
        headers: {
          'X-Tebex-Secret': process.env.TEBEX_SECRET
        }
      }
    );

    const basketData = tebexResponse.data.data;
    
    // Save basket ID to cart
    cart.tebexBasketId = basketData.ident;
    cart.status = 'checked_out';
    await cart.save();

    res.json({
      checkoutUrl: basketData.links.checkout,
      basketId: basketData.ident
    });
  } catch (error) {
    console.error('Checkout error:', error.response?.data || error);
    res.status(500).json({ 
      error: 'Failed to create checkout',
      details: error.response?.data
    });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId, status: 'active' });

    if (!cart) {
      return res.json({ message: 'Cart already empty' });
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
