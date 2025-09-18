import api from './api';

export const transactionService = {
  // Get user transactions
  getTransactions: async (page = 1, limit = 20) => {
    try {
      const response = await api.get(`/transactions?page=${page}&limit=${limit}`);
      return {
        success: true,
        transactions: response.data.transactions,
        pagination: response.data.pagination
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch transactions'
      };
    }
  },

  // Get single transaction
  getTransaction: async (id) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      return { success: true, transaction: response.data.transaction };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch transaction'
      };
    }
  },

  // Create transfer
  createTransfer: async (transferData) => {
    try {
      const response = await api.post('/transactions/transfer', transferData);
      return {
        success: true,
        message: response.data.message,
        transaction: response.data.transaction
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Transfer failed'
      };
    }
  },

  // Get spending analytics
  getSpendingAnalytics: async (year, month) => {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);

      const response = await api.get(`/transactions/analytics/spending?${params}`);
      return { success: true, spending: response.data.spending };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch analytics'
      };
    }
  }
};
