import api from './api';

// User Relations API methods - matching React web service
export const UserRelationsService = {
  // Follow/Unfollow a user
  toggleFollow: (targetUserName) => {
    return api.post(`/user-relations/follow/${targetUserName}`);
  },

  // Check if current user follows target user
  isFollowing: (targetUserName) => {
    return api.get(`/user-relations/is-following/${targetUserName}`);
  },

  // Get paginated followers
  getFollowers: (userName, page = 0, size = 20) => {
    return api.get(`/user-relations/${userName}/followers?page=${page}&size=${size}`);
  },

  // Get paginated following
  getFollowing: (userName, page = 0, size = 20) => {
    return api.get(`/user-relations/${userName}/following?page=${page}&size=${size}`);
  },

  // Get relationship summary
  getRelationshipSummary: (userName) => {
    return api.get(`/user-relations/${userName}/summary`);
  },

  // Get friend suggestions
  getFriendSuggestions: (limit = 10) => {
    return api.get(`/user-relations/suggestions?limit=${limit}`);
  },

  // Backward compatibility - get follower usernames only
  getFollowerUserNames: (userName) => {
    return api.get(`/user-relations/${userName}/followers/usernames`);
  },

  // Backward compatibility - get following usernames only
  getFollowingUserNames: (userName) => {
    return api.get(`/user-relations/${userName}/following/usernames`);
  }
};

// Basic user methods
export function listUsers() {
  return api.get("/user/get");
}

export function getUserById(id) {
  return api.get(`/user/get/id/${id}`);
}

export function getUserInfo(username) {
  return api.get(`/user/get/${username}`);
}

// Profile update method
export const updateProfile = (profileData, isFormData = false) => {
  const config = isFormData ? {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  } : {};
  
  return api.patch('/user/update', profileData, config);
};

// Clear current user's notifications - matching React web service
export const clearMyNotifications = () => {
  return api.post('/user/notifications/clear');
};

// Change password
export const changePassword = (passwordData) => {
  return api.post('/user/change-password', passwordData);
};

// Delete account
export const deleteAccount = (userId) => {
  return api.delete(`/user/delete/${userId}`);
};

// Get current user - matching React web service
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/user/me');
    return response.data;
  } catch (error) {
    return null;
  }
};
