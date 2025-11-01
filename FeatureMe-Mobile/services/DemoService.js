import api from './api';

// Mobile DemoService for React Native (Expo)
// Mirrors the web DemoService behavior for creating and fetching demos

const DemoService = {
  // Get all demos for a user
  async getUserDemos(userId) {
    const response = await api.get(`/demos/get/user/${userId}`);
    return response.data;
  },

  // Alias used by existing mobile code
  async getAllUserDemos(userId) {
    return this.getUserDemos(userId);
  },

  // Create a new demo with multipart/form-data
  // demoData: { title: string, features: string|string[] }
  // file: { uri: string, name?: string, type?: string }
  async createDemo(demoData, file) {
    const inferMimeFromName = (name) => {
      if (!name) return undefined;
      const lower = name.toLowerCase();
      if (lower.endsWith('.mp3')) return 'audio/mpeg';
      if (lower.endsWith('.wav')) return 'audio/wav';
      if (lower.endsWith('.m4a')) return 'audio/mp4';
      if (lower.endsWith('.aac')) return 'audio/aac';
      if (lower.endsWith('.flac')) return 'audio/flac';
      if (lower.endsWith('.ogg')) return 'audio/ogg';
      return undefined;
    };

    // Normalize features to array
    const featuresArray = Array.isArray(demoData.features)
      ? demoData.features
      : (typeof demoData.features === 'string'
          ? demoData.features.split(',').map(f => f.trim()).filter(Boolean)
          : []);

    const demoPayload = {
      title: String(demoData.title || '').trim(),
      features: featuresArray,
    };

    const formData = new FormData();

    // RN FormData supports string values; backend now parses @RequestPart("demo") as String
    formData.append('demo', JSON.stringify(demoPayload));

    // Ensure file has name and type
    const resolvedName = file.name || `demo-${Date.now()}.mp3`;
    const resolvedType = file.type || inferMimeFromName(resolvedName) || 'audio/mpeg';
    const filePart = {
      uri: file.uri,
      name: resolvedName,
      type: resolvedType,
    };

    formData.append('file', filePart);

    const response = await api.post('/demos/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async deleteDemo(demoId) {
    const response = await api.delete(`/demos/delete/${demoId}`);
    return response.data;
  },
};

export default DemoService;


