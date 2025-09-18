const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  iban: {
    type: String,
    unique: true,
    sparse: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'CHF',
    enum: ['CHF', 'EUR', 'USD', 'GBP']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  },
  preferences: {
    darkMode: { type: Boolean, default: false },
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true }
  },
  lastLogin: {
    type: Date
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ iban: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate IBAN method
userSchema.methods.generateIBAN = function() {
  const countryCode = 'CH';
  const checkDigits = Math.floor(Math.random() * 90) + 10;
  const bankCode = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
  const accountNumber = String(Math.floor(Math.random() * 100000000000)).padStart(12, '0');
  this.iban = `${countryCode}${checkDigits} ${bankCode} ${accountNumber.slice(0,4)} ${accountNumber.slice(4,8)} ${accountNumber.slice(8,12)}`;
};

// Transform output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.twoFactorSecret;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
