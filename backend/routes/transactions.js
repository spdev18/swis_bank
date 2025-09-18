const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user transactions
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'firstName lastName iban');

    const total = await Transaction.countDocuments({ userId: req.user.userId });

    res.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single transaction
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new transaction (transfer)
router.post('/transfer', [
  auth,
  body('amount').isFloat({ min: 0.01 }),
  body('recipientIBAN').notEmpty().trim(),
  body('recipientName').notEmpty().trim(),
  body('description').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { amount, recipientIBAN, recipientName, description } = req.body;

  try {
    const sender = await User.findById(req.user.userId);
    if (!sender) {
      return res.status(404).json({ success: false, message: 'Sender not found' });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Check if recipient exists (simplified - in real app, you'd verify IBAN)
    const recipient = await User.findOne({ iban: recipientIBAN });
    if (!recipient) {
      return res.status(400).json({ success: false, message: 'Invalid recipient IBAN' });
    }

    // Create debit transaction for sender
    const debitTransaction = new Transaction({
      userId: sender._id,
      type: 'debit',
      amount,
      description,
      category: 'transfer',
      recipientIBAN,
      recipientName,
      senderIBAN: sender.iban,
      senderName: `${sender.firstName} ${sender.lastName}`,
      balanceAfter: sender.balance - amount
    });

    // Create credit transaction for recipient
    const creditTransaction = new Transaction({
      userId: recipient._id,
      type: 'credit',
      amount,
      description,
      category: 'transfer',
      senderIBAN: sender.iban,
      senderName: `${sender.firstName} ${sender.lastName}`,
      recipientIBAN,
      recipientName,
      balanceAfter: recipient.balance + amount
    });

    // Update balances
    sender.balance -= amount;
    recipient.balance += amount;

    await Promise.all([
      debitTransaction.save(),
      creditTransaction.save(),
      sender.save(),
      recipient.save()
    ]);

    res.json({
      success: true,
      message: 'Transfer completed successfully',
      transaction: debitTransaction
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get spending analytics
router.get('/analytics/spending', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentDate = new Date();
    const queryYear = year || currentDate.getFullYear();
    const queryMonth = month || currentDate.getMonth() + 1;

    const spending = await Transaction.aggregate([
      {
        $match: {
          userId: req.user.userId,
          type: 'debit',
          createdAt: {
            $gte: new Date(queryYear, queryMonth - 1, 1),
            $lt: new Date(queryYear, queryMonth, 1)
          }
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

    res.json({ success: true, spending });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
