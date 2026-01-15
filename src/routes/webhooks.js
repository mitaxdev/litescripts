import express from 'express';
import crypto from 'crypto';
import Order from '../models/Order.js';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/webhooks/tebex
// @desc    Handle Tebex payment webhooks
router.post('/tebex', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-tebex-signature'];
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('❌ Invalid webhook signature');
        return res.status(403).json({ error: 'Invalid signature' });
      }
    }

    const event = JSON.parse(req.body);
    console.log('📦 Tebex webhook received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment.completed':
        await handlePaymentCompleted(event.subject);
        break;

      case 'payment.refunded':
        await handlePaymentRefunded(event.subject);
        break;

      case 'payment.declined':
        await handlePaymentDeclined(event.subject);
        break;

      default:
        console.log('ℹ️ Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful payment
async function handlePaymentCompleted(paymentData) {
  try {
    console.log('✅ Payment completed:', paymentData.transaction_id);

    // Find user by email
    const user = await User.findOne({ email: paymentData.customer.email });

    if (!user) {
      console.warn('⚠️ User not found for email:', paymentData.customer.email);
      return;
    }

    // Create order
    const order = new Order({
      userId: user._id,
      tebexTransactionId: paymentData.transaction_id,
      products: paymentData.products.map(p => ({
        productId: p.id.toString(),
        productName: p.name,
        price: p.price,
        quantity: p.quantity
      })),
      totalPrice: paymentData.price.amount,
      currency: paymentData.price.currency,
      status: 'completed',
      paymentMethod: paymentData.payment_method,
      customerEmail: paymentData.customer.email,
      webhookData: paymentData,
      completedAt: new Date()
    });

    await order.save();

    console.log('✅ Order created:', order._id);

    // TODO: Send Discord notification to user
    // TODO: Deliver digital products
    
  } catch (error) {
    console.error('❌ Payment completed handler error:', error);
  }
}

// Handle refunded payment
async function handlePaymentRefunded(paymentData) {
  try {
    console.log('💸 Payment refunded:', paymentData.transaction_id);

    const order = await Order.findOne({ tebexTransactionId: paymentData.transaction_id });

    if (order) {
      order.status = 'refunded';
      await order.save();
      console.log('✅ Order marked as refunded');
    }
  } catch (error) {
    console.error('❌ Payment refunded handler error:', error);
  }
}

// Handle declined payment
async function handlePaymentDeclined(paymentData) {
  try {
    console.log('❌ Payment declined:', paymentData.transaction_id);

    const order = await Order.findOne({ tebexTransactionId: paymentData.transaction_id });

    if (order) {
      order.status = 'failed';
      await order.save();
    }
  } catch (error) {
    console.error('❌ Payment declined handler error:', error);
  }
}

export default router;
