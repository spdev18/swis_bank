import api from './api';

export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch profile'
      };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/users/password', passwordData);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change password'
      };
    }
  },

  // Get all users (admin only)
  getUsers: async (page = 1, limit = 20) => {
    try {
      const response = await api.get(`/users?page=${page}&limit=${limit}`);
      return {
        success: true,
        users: response.data.users,
        pagination: response.data.pagination
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch users'
      };
    }
  }
};
