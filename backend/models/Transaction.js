const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['credit', 'debit', 'transfer']
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    default: 'CHF',
    enum: ['CHF', 'EUR', 'USD', 'GBP']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  category: {
    type: String,
    required: true,
    enum: ['shopping', 'dining', 'transfer', 'income', 'interest', 'other'],
    default: 'other'
  },
  recipientIBAN: {
    type: String,
    trim: true
  },
  recipientName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  senderIBAN: {
    type: String,
    trim: true
  },
  senderName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  status: {
    type: String,
    default: 'completed',
    enum: ['pending', 'completed', 'failed', 'cancelled']
  },
  reference: {
    type: String,
    unique: true,
    sparse: true
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  fees: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  metadata: {
    location: String,
    device: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ recipientIBAN: 1 });
transactionSchema.index({ senderIBAN: 1 });

// Generate unique reference
transactionSchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return `${this.type === 'credit' ? '+' : '-'}${this.amount.toFixed(2)} ${this.currency}`;
});

// Static method to get user transactions
transactionSchema.statics.getUserTransactions = function(userId, limit = 50, skip = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'firstName lastName iban');
};

// Static method to get monthly spending
transactionSchema.statics.getMonthlySpending = function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        type: 'debit',
        createdAt: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);
