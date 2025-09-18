import React, { useState, useEffect, useReducer, createContext, useContext, useCallback, useMemo } from "react";

// Banking Context with enhanced state management
const BankingContext = createContext();

const bankingReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { 
        ...state, 
        user: action.payload, 
        isLoggedIn: true,
        lastActivity: Date.now()
      };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        isLoggedIn: false, 
        iban: '', 
        balance: 0, 
        transactions: [],
        notifications: []
      };
    case 'UPDATE_BALANCE':
      return { ...state, balance: action.payload };
    case 'ADD_TRANSACTION':
      return { 
        ...state, 
        transactions: [action.payload, ...state.transactions],
        lastActivity: Date.now()
      };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'SET_IBAN':
      return { ...state, iban: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [...state.notifications, { id: Date.now(), ...action.payload }]
      };
    case 'REMOVE_NOTIFICATION':
      return { 
        ...state, 
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    case 'UPDATE_USER_PREFERENCES':
      return { 
        ...state, 
        user: { 
          ...state.user, 
          preferences: { 
            ...state.user?.preferences, 
            ...action.payload 
          }
        }
      };
    case 'USER_ACTIVITY':
      return { ...state, lastActivity: Date.now() };
    default:
      return state;
  }
};

export const BankingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(bankingReducer, {
    user: null,
    isLoggedIn: false,
    iban: '',
    balance: 0,
    transactions: [],
    darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
    activeTab: 'dashboard',
    notifications: [],
    lastActivity: null
  });

  return (
    <BankingContext.Provider value={{ state, dispatch }}>
      {children}
    </BankingContext.Provider>
  );
};

const useBanking = () => useContext(BankingContext);

// Enhanced Utility Functions with error handling
const bankingUtils = {
  generateMockIBAN: () => {
    try {
      const countryCode = "CH";
      const checkDigits = Math.floor(Math.random() * 90) + 10;
      const bankCode = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
      const accountNumber = String(Math.floor(Math.random() * 100000000000)).padStart(12, '0');
      return `${countryCode}${checkDigits} ${bankCode} ${accountNumber.slice(0,4)} ${accountNumber.slice(4,8)} ${accountNumber.slice(8,12)}`;
    } catch (error) {
      console.error('Error generating IBAN:', error);
      return 'CH00 0000 0000 0000 0000';
    }
  },

  formatCurrency: (amount, currency = 'CHF') => {
    return new Intl.NumberFormat('en-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  },

  formatDate: (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-CH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  },

  mockBiometricAuth: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        resolve({ 
          success, 
          method: success ? 'face-id' : null,
          error: success ? null : 'Face not recognized'
        });
      }, 1500);
    });
  },

  mockScanQRCode: async () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const success = Math.random() > 0.1;
        if (success) {
          resolve('CH93 0076 2011 6238 5295 7');
        } else {
          reject(new Error('QR Code scan failed'));
        }
      }, 2000);
    });
  },

  calculateSpendingByCategory: (transactions) => {
    const categories = {};
    transactions.forEach(transaction => {
      if (transaction.type === 'debit') {
        const category = transaction.category || 'other';
        categories[category] = (categories[category] || 0) + Math.abs(transaction.amount);
      }
    });
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      color: bankingUtils.getCategoryColor(name)
    }));
  },

  getCategoryColor: (category) => {
    const colors = {
      shopping: '#ef4444',
      dining: '#f59e0b',
      transfer: '#10b981',
      income: '#3b82f6',
      interest: '#8b5cf6',
      other: '#6366f1'
    };
    return colors[category] || '#6366f1';
  },

  generateMockData: () => {
    const mockTransactions = [];
    const categories = ['shopping', 'dining', 'transfer', 'income', 'interest'];
    
    for (let i = 0; i < 20; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      const type = Math.random() > 0.3 ? 'debit' : 'credit';
      const category = categories[Math.floor(Math.random() * categories.length)];
      const amount = type === 'credit' 
        ? Math.floor(Math.random() * 5000) + 100
        : -(Math.floor(Math.random() * 500) + 10);
      
      mockTransactions.push({
        id: Date.now() + i,
        date: date.toISOString().split('T')[0],
        description: bankingUtils.getTransactionDescription(type, category),
        amount,
        type,
        category
      });
    }
    
    return mockTransactions;
  },

  getTransactionDescription: (type, category) => {
    const descriptions = {
      shopping: ['Grocery Store', 'Online Shopping', 'Clothing Store', 'Electronics Purchase'],
      dining: ['Restaurant Dinner', 'Coffee Shop', 'Fast Food', 'Bar Tab'],
      transfer: ['Transfer to Anna', 'Transfer to John', 'Payment to Sarah', 'Money to Mike'],
      income: ['Salary Deposit', 'Freelance Payment', 'Bonus Payment', 'Refund'],
      interest: ['Interest Earned', 'Investment Return', 'Savings Interest']
    };
    
    const options = descriptions[category] || ['Miscellaneous Transaction'];
    return options[Math.floor(Math.random() * options.length)];
  }
};

// Enhanced Components

// Loading Skeleton with multiple variants
const Skeleton = ({ type = 'rectangle', className = '' }) => {
  const baseClass = "animate-pulse bg-gray-300 dark:bg-gray-600 rounded";
  
  if (type === 'circle') {
    return <div className={`${baseClass}-full ${className}`}></div>;
  }
  
  if (type === 'text') {
    return <div className={`${baseClass} ${className}`}></div>;
  }
  
  return <div className={`${baseClass} ${className}`}></div>;
};

// Enhanced Toast Notification System
const ToastContainer = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`${
            notification.type === 'success' ? 'bg-green-500' : 
            notification.type === 'error' ? 'bg-red-500' : 
            notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
          } text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between space-x-4 animate-slide-in`}
          style={{ animationDelay: `${notifications.indexOf(notification) * 0.1}s` }}
        >
          <div className="flex items-center space-x-2 flex-1">
            <span className="text-lg">
              {notification.type === 'success' ? '✅' : 
               notification.type === 'error' ? '❌' : 
               notification.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => removeNotification(notification.id)}
            className="ml-4 text-white hover:text-gray-200 text-xl font-bold"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

// Enhanced Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Enhanced Chart Component with SVG animations
const SpendingChart = ({ transactions }) => {
  const spendingData = useMemo(() => {
    return bankingUtils.calculateSpendingByCategory(transactions.filter(t => t.type === 'debit'));
  }, [transactions]);

  const totalSpending = useMemo(() => {
    return spendingData.reduce((sum, item) => sum + item.value, 0);
  }, [spendingData]);

  const budget = 5000; // Mock budget
  const budgetPercentage = Math.min((totalSpending / budget) * 100, 100);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Monthly Spending</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {bankingUtils.formatCurrency(totalSpending)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            of {bankingUtils.formatCurrency(budget)} budget
          </p>
        </div>
      </div>
      
      {/* Animated Donut Chart */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
        <div className="relative w-64 h-64">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - budgetPercentage / 100)}`}
              className="text-blue-600 dark:text-blue-400 transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {Math.round(budgetPercentage)}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Used</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex-1 space-y-3">
          {spendingData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {item.name}
                </span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {bankingUtils.formatCurrency(item.value)}
                </span>
                <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(item.value / totalSpending) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced Currency Converter with real-time rates
const CurrencyConverter = () => {
  const [amount, setAmount] = useState(1000);
  const [fromCurrency, setFromCurrency] = useState('CHF');
  const [toCurrency, setToCurrency] = useState('USD');
  const [isSwapped, setIsSwapped] = useState(false);
  
  // Mock real-time rates with slight variations
  const getRates = useCallback(() => {
    const baseRates = {
      CHF: { USD: 1.12, EUR: 1.05, GBP: 0.89, JPY: 165.23 },
      USD: { CHF: 0.89, EUR: 0.94, GBP: 0.79, JPY: 147.89 },
      EUR: { CHF: 0.95, USD: 1.06, GBP: 0.85, JPY: 157.23 },
      GBP: { CHF: 1.12, USD: 1.26, EUR: 1.18, JPY: 185.45 },
      JPY: { CHF: 0.006, USD: 0.0068, EUR: 0.0064, GBP: 0.0054 }
    };
    
    // Add small random variation for realism
    const variation = 1 + (Math.random() - 0.5) * 0.02; // ±1%
    const rates = { ...baseRates };
    
    Object.keys(rates).forEach(from => {
      Object.keys(rates[from]).forEach(to => {
        rates[from][to] *= variation;
      });
    });
    
    return rates;
  }, []);

  const rates = useMemo(() => getRates(), [getRates]);
  
  const convertedAmount = useMemo(() => {
    if (fromCurrency === toCurrency) return amount;
    return amount * (rates[fromCurrency]?.[toCurrency] || 1);
  }, [amount, fromCurrency, toCurrency, rates]);

  const handleSwap = () => {
    setIsSwapped(true);
    setFromCurrency(prev => {
      const temp = toCurrency;
      setToCurrency(prev);
      return temp;
    });
    setTimeout(() => setIsSwapped(false), 300);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl mb-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Currency Converter</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">You Send</label>
            <div className="relative">
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-4 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                placeholder="0.00"
              />
              <select 
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent border-none text-gray-700 dark:text-gray-300 font-semibold text-lg"
              >
                {Object.keys(rates).map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <button 
              onClick={handleSwap}
              className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 ${isSwapped ? 'rotate-180' : ''}`}
            >
              🔄
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">You Receive</label>
            <div className="relative">
              <input 
                type="text" 
                value={convertedAmount.toFixed(2)} 
                readOnly
                className="w-full pl-4 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold"
              />
              <select 
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent border-none text-gray-700 dark:text-gray-300 font-semibold text-lg"
              >
                {Object.keys(rates).map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Exchange Rate</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">1 {fromCurrency} =</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {(rates[fromCurrency]?.[toCurrency] || 1).toFixed(4)} {toCurrency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">1 {toCurrency} =</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {(1 / (rates[fromCurrency]?.[toCurrency] || 1)).toFixed(4)} {fromCurrency}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rates updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Admin Dashboard with real-time data simulation
const AdminDashboard = () => {
  const [systemMetrics, setSystemMetrics] = useState({
    users: 1247,
    dailyTransactions: 89,
    uptime: 99.98,
    responseTime: 124
  });

  const [recentActivity, setRecentActivity] = useState([
    { user: 'John Doe', action: 'Logged in', time: '2 min ago', status: 'success' },
    { user: 'Sarah Smith', action: 'Made transfer', time: '5 min ago', status: 'success' },
    { user: 'Mike Johnson', action: 'Changed password', time: '12 min ago', status: 'warning' },
    { user: 'Emma Wilson', action: 'Failed login attempt', time: '18 min ago', status: 'error' }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        dailyTransactions: prev.dailyTransactions + Math.floor(Math.random() * 3),
        responseTime: Math.max(50, prev.responseTime + (Math.random() - 0.5) * 20)
      }));
      
      if (Math.random() > 0.7) {
        const newActivity = {
          user: ['John Doe', 'Sarah Smith', 'Mike Johnson', 'Emma Wilson', 'Alex Brown'][Math.floor(Math.random() * 5)],
          action: ['Logged in', 'Made transfer', 'Changed password', 'Viewed statements', 'Updated profile'][Math.floor(Math.random() * 5)],
          time: 'Just now',
          status: ['success', 'success', 'warning', 'success', 'error'][Math.floor(Math.random() * 5)]
        };
        setRecentActivity(prev => [newActivity, ...prev].slice(0, 6));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Total Users</h3>
              <span className="text-green-300">↑ 2.1%</span>
            </div>
            <p className="text-3xl font-bold">{systemMetrics.users.toLocaleString()}</p>
            <p className="text-purple-200 text-sm">+26 new today</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Daily Transactions</h3>
              <span className="text-green-300">↑ 5.3%</span>
            </div>
            <p className="text-3xl font-bold">{systemMetrics.dailyTransactions.toLocaleString()}</p>
            <p className="text-purple-200 text-sm">CHF 428,500</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">System Uptime</h3>
              <span className="text-green-300">✓</span>
            </div>
            <p className="text-3xl font-bold">{systemMetrics.uptime}%</p>
            <p className="text-purple-200 text-sm">Last 30 days</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Response Time</h3>
              <span className={systemMetrics.responseTime < 200 ? 'text-green-300' : 'text-yellow-300'}>✓</span>
            </div>
            <p className="text-3xl font-bold">{Math.round(systemMetrics.responseTime)}ms</p>
            <p className="text-purple-200 text-sm">API average</p>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm">All</button>
            <button className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm">Today</button>
          </div>
        </div>
        <div className="space-y-3">
          {recentActivity.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <div className="flex items-center space-x-3 flex-1">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === 'success' ? 'bg-green-500' : 
                  item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.user}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.action}</p>
                </div>
              </div>
              <span className="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* System Alerts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">System Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-green-500">✅</span>
              <span className="text-green-800 dark:text-green-200 font-medium">All systems operational</span>
            </div>
            <span className="text-green-600 dark:text-green-400 text-sm">2 min ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-blue-500">ℹ️</span>
              <span className="text-blue-800 dark:text-blue-200 font-medium">Database backup completed</span>
            </div>
            <span className="text-blue-600 dark:text-blue-400 text-sm">1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Transaction List Component with filtering and sorting
const TransactionList = ({ transactions, onTransactionClick }) => {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('date-desc');
  
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.type === filter);
    }
    
    filtered.sort((a, b) => {
      if (sort === 'date-desc') {
        return new Date(b.date) - new Date(a.date);
      } else if (sort === 'date-asc') {
        return new Date(a.date) - new Date(b.date);
      } else if (sort === 'amount-desc') {
        return b.amount - a.amount;
      } else if (sort === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
    
    return filtered;
  }, [transactions, filter, sort]);

  const getTransactionIcon = (type, category) => {
    if (type === 'credit') {
      if (category === 'income') return '💰';
      if (category === 'interest') return '📈';
      return '📥';
    } else {
      if (category === 'shopping') return '🛒';
      if (category === 'dining') return '🍽️';
      if (category === 'transfer') return '📤';
      return '💸';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">All Transactions</option>
            <option value="credit">Credits Only</option>
            <option value="debit">Debits Only</option>
          </select>
          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="amount-asc">Amount (Low to High)</option>
          </select>
        </div>
      </div>
      
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">No transactions found</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try changing your filter settings</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredTransactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={() => onTransactionClick && onTransactionClick(transaction)}
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="text-2xl">
                  {getTransactionIcon(transaction.type, transaction.category)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{bankingUtils.formatDate(transaction.date)}</p>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 capitalize mt-1">
                    {transaction.category}
                  </span>
                </div>
              </div>
              <div className={`font-semibold text-right min-w-24 ${
                transaction.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {transaction.type === 'credit' ? '+' : ''}{bankingUtils.formatCurrency(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {filteredTransactions.length > 0 && (
        <div className="flex justify-center mt-6">
          <button className="px-4 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
            Load More Transactions
          </button>
        </div>
      )}
    </div>
  );
};

// Enhanced Login Component
const Login = ({ onLogin, darkMode, toggleDarkMode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [otp, setOtp] = useState('');
  const [showBiometric, setShowBiometric] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShow2FA(true);
    setIsLoading(false);
  };

  const handle2FA = () => {
    if (otp.length === 6) {
      setShow2FA(false);
      onLogin();
    } else {
      alert('Please enter a 6-digit code');
    }
  };

  const handleBiometric = async () => {
    setShowBiometric(true);
    const result = await bankingUtils.mockBiometricAuth();
    setShowBiometric(false);
    if (result.success) {
      onLogin();
    } else {
      alert(result.error || 'Biometric authentication failed');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900'} flex items-center justify-center p-4 transition-colors duration-300`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md transition-all duration-300">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Swiss Bank</h1>
          <p className="text-gray-600 dark:text-gray-400">Secure Banking Solutions</p>
        </div>

        <div className="absolute top-4 right-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {!show2FA ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your password"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or</span>
              </div>
            </div>

            <button
              onClick={handleBiometric}
              disabled={showBiometric}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {showBiometric ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white mr-2"></div>
                  Scanning...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="text-2xl mr-2">👤</span>
                  Face ID / Touch ID
                </div>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Two-Factor Authentication</h2>
              <p className="text-gray-600 dark:text-gray-400">Enter the 6-digit code from your authenticator app</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                maxLength="6"
              />
            </div>

            <button
              onClick={handle2FA}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300"
            >
              Verify Code
            </button>

            <button
              onClick={() => setShow2FA(false)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = ({ onLogout }) => {
  const { state, dispatch } = useBanking();
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    // Initialize mock data
    if (state.transactions.length === 0) {
      const mockTransactions = bankingUtils.generateMockData();
      dispatch({ type: 'UPDATE_BALANCE', payload: 15420.50 });
      dispatch({ type: 'SET_IBAN', payload: bankingUtils.generateMockIBAN() });
      mockTransactions.forEach(transaction => {
        dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      });
    }
  }, [state.transactions.length, dispatch]);

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleTabChange = (tab) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    onLogout();
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'transfer', label: 'Transfer', icon: '💸' },
    { id: 'converter', label: 'Currency', icon: '💱' },
    { id: 'admin', label: 'Admin', icon: '⚙️' }
  ];

  return (
    <div className={`min-h-screen ${state.darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">SB</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Swiss Bank</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {state.darkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-2xl">👤</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Welcome back!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Account Holder</p>
              </div>

              <div className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      state.activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {state.activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Balance Card */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-blue-100">Current Balance</p>
                      <p className="text-3xl font-bold">{bankingUtils.formatCurrency(state.balance)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-100 text-sm">IBAN</p>
                      <p className="text-sm font-mono">{state.iban}</p>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
                      <span>📤</span>
                      <span>Send Money</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
                      <span>📥</span>
                      <span>Receive Money</span>
                    </button>
                  </div>
                </div>

                {/* Charts and Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SpendingChart transactions={state.transactions} />
                  <CurrencyConverter />
                </div>

                {/* Recent Transactions */}
                <TransactionList
                  transactions={state.transactions.slice(0, 5)}
                  onTransactionClick={handleTransactionClick}
                />
              </div>
            )}

            {state.activeTab === 'transactions' && (
              <TransactionList
                transactions={state.transactions}
                onTransactionClick={handleTransactionClick}
              />
            )}

            {state.activeTab === 'transfer' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Transfer Money</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipient IBAN</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="CH00 0000 0000 0000 0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Payment description"
                    />
                  </div>
                  <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-colors">
                    Send Transfer
                  </button>
                </div>
              </div>
            )}

            {state.activeTab === 'converter' && <CurrencyConverter />}

            {state.activeTab === 'admin' && <AdminDashboard />}
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Transaction Details"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">
                {selectedTransaction.type === 'credit' ? '📥' : '📤'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{selectedTransaction.description}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{bankingUtils.formatDate(selectedTransaction.date)}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                  <p className={`font-semibold ${selectedTransaction.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {selectedTransaction.type === 'credit' ? '+' : ''}{bankingUtils.formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedTransaction.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedTransaction.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Transaction ID</p>
                  <p className="font-semibold text-gray-900 dark:text-white font-mono text-sm">{selectedTransaction.id}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer
        notifications={state.notifications}
        removeNotification={(id) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })}
      />
    </div>
  );
};

// Main App Component
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <BankingProvider>
      <div className={darkMode ? 'dark' : ''}>
        {isLoggedIn ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <Login
            onLogin={handleLogin}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
        )}
      </div>
    </BankingProvider>
  );
}

export default App;
