import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Discord Info
  discordId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  discordUsername: {
    type: String,
    required: true
  },
  discordAvatar: String,
  email: {
    type: String,
    required: true
  },

  // FiveM Info
  fivemLicense: {
    type: String,
    default: null,
    index: true
  },
  fivemIdentifier: String,

  // User Status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },

  // Metadata
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

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
