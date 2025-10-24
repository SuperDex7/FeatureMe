import api from './api';

const DemoService = {
  // Get all demos for the current user
  getUserDemos: async (userId) => {
    try {
      const response = await api.get(`/demos/get/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user demos:", error);
      throw error;
    }
  },

  // Get all demos for a user (alias for getUserDemos)
  getAllUserDemos: async (userId) => {
    try {
      const response = await api.get(`/demos/get/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching all user demos:", error);
      throw error;
    }
  },

  // Get demo by ID
  getDemoById: async (demoId) => {
    try {
      const response = await api.get(`/demos/get/id/${demoId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching demo:", error);
      throw error;
    }
  },

  // Create a new demo
  createDemo: async (demoData, file) => {
    try {
      const formData = new FormData();
      
      // Convert features string to array if it's a string
      const featuresArray = typeof demoData.features === 'string' 
        ? demoData.features.split(',').map(feature => feature.trim()).filter(feature => feature.length > 0)
        : demoData.features || [];
      
      const demoPayload = {
        title: demoData.title.trim(),
        features: featuresArray
      };
      
      formData.append("demo", new Blob([JSON.stringify(demoPayload)], {type: "application/json"}));
      formData.append('file', file);
      
      const response = await api.post("/demos/create", formData, {
        headers: {"Content-Type": "multipart/form-data"}
      });
      
      return response.data;
    } catch (error) {
      console.error("Error creating demo:", error);
      throw error;
    }
  },

  // Update demo
  updateDemo: async (demoId, demoData) => {
    try {
      const response = await api.put(`/demos/update/${demoId}`, demoData);
      return response.data;
    } catch (error) {
      console.error("Error updating demo:", error);
      throw error;
    }
  },

  // Delete demo
  deleteDemo: async (demoId) => {
    try {
      const response = await api.delete(`/demos/delete/${demoId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting demo:", error);
      throw error;
    }
  },

  // Add like to demo
  addDemoLike: async (demoId) => {
    try {
      const response = await api.post(`/demos/add/like/${demoId}`);
      return response.data;
    } catch (error) {
      console.error("Error adding demo like:", error);
      throw error;
    }
  },

  // Remove like from demo
  removeDemoLike: async (demoId) => {
    try {
      const response = await api.delete(`/demos/remove/like/${demoId}`);
      return response.data;
    } catch (error) {
      console.error("Error removing demo like:", error);
      throw error;
    }
  },

  // Get demo likes
  getDemoLikes: async (demoId) => {
    try {
      const response = await api.get(`/demos/likes/${demoId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching demo likes:", error);
      throw error;
    }
  },

  // Add comment to demo
  addDemoComment: async (demoId, comment) => {
    try {
      const response = await api.post(`/demos/add/comment/${demoId}`, comment, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error adding demo comment:", error);
      throw error;
    }
  },

  // Get demo comments
  getDemoComments: async (demoId, page = 0, size = 10) => {
    try {
      const response = await api.get(`/demos/comments/${demoId}/paginated?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching demo comments:", error);
      throw error;
    }
  },

  // Add view to demo
  addDemoView: async (demoId, userName = null) => {
    try {
      const url = userName ? `/demos/view/${demoId}?userName=${encodeURIComponent(userName)}` : `/demos/view/${demoId}`;
      const response = await api.post(url);
      return response.data;
    } catch (error) {
      console.error("Error adding demo view:", error);
      throw error;
    }
  },

  // Download demo
  downloadDemo: async (demoId) => {
    try {
      const response = await api.get(`/demos/download/${demoId}`);
      return response.data;
    } catch (error) {
      console.error("Error downloading demo:", error);
      throw error;
    }
  },

  // Track demo download
  trackDemoDownload: async (demoId, userName = null) => {
    try {
      const url = userName ? `/demos/download/${demoId}?userName=${encodeURIComponent(userName)}` : `/demos/download/${demoId}`;
      const response = await api.post(url);
      return response.data;
    } catch (error) {
      console.error("Error tracking demo download:", error);
      throw error;
    }
  },

  // Get demo stats
  getDemoStats: async (demoId) => {
    try {
      const response = await api.get(`/demos/stats/${demoId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching demo stats:", error);
      throw error;
    }
  },

  // Search demos
  searchDemos: async (query, page = 0, size = 20) => {
    try {
      const response = await api.get(`/demos/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error("Error searching demos:", error);
      throw error;
    }
  },

  // Get trending demos
  getTrendingDemos: async (page = 0, size = 20) => {
    try {
      const response = await api.get(`/demos/trending?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching trending demos:", error);
      throw error;
    }
  },

  // Get recent demos
  getRecentDemos: async (page = 0, size = 20) => {
    try {
      const response = await api.get(`/demos/recent?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching recent demos:", error);
      throw error;
    }
  }
};

export default DemoService;
