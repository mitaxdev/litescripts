import express from 'express';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/auth/discord
// @desc    Initiate Discord OAuth
router.get('/discord', passport.authenticate('discord'));

// @route   GET /api/auth/discord/callback
// @desc    Discord OAuth callback
router.get('/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { userId: req.user._id, discordId: req.user.discordId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// @route   POST /api/auth/fivem
// @desc    Link FiveM account
router.post('/fivem', authenticateToken, async (req, res) => {
  try {
    const { fivemLicense, fivemIdentifier } = req.body;

    if (!fivemLicense) {
      return res.status(400).json({ error: 'FiveM license is required' });
    }

    // Update user with FiveM info
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        fivemLicense,
        fivemIdentifier: fivemIdentifier || null
      },
      { new: true }
    );

    res.json({
      message: 'FiveM account linked successfully',
      user: {
        id: user._id,
        discordUsername: user.discordUsername,
        fivemLicense: user.fivemLicense
      }
    });
  } catch (error) {
    console.error('FiveM link error:', error);
    res.status(500).json({ error: 'Failed to link FiveM account' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-__v');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      discordAvatar: user.discordAvatar,
      email: user.email,
      fivemLicense: user.fivemLicense,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;
