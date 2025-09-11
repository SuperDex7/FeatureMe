import api from "./AuthService";

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

  // Get demo by ID
  getDemoById: async (demoId) => {
    try {
      const response = await api.get(`/demos/get/${demoId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching demo:", error);
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
  }
};

export default DemoService;
