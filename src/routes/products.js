import express from 'express';
import axios from 'axios';

const router = express.Router();

// Tebex products (from your existing data)
const products = [
  {
    id: "7206533",
    name: "Lite Scripts Premium Membership",
    description: "Unlock exclusive access to all scripts, premium support, advanced features",
    price: 12.00,
    image: "https://dunb17ur4ymx4.cloudfront.net/packages/images/61cb7778b665d466240d250c351ba752bb390781.jpeg",
    frameworks: ["ESX", "QBCore", "Standalone"],
    category: "memberships",
    featured: true,
  },
  // ... rest of products from products.ts
];

// @route   GET /api/products
// @desc    Get all products
router.get('/', async (req, res) => {
  try {
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;
