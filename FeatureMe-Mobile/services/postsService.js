import api from './api';

export const listPosts = () => {
  return api.get('/posts/get');
};

export const listPostsDesc = () => {
  return api.get('/posts/get/likesdesc');
};

export const getPostById = (id) => {
  return api.get(`/posts/get/id/${id}`);
};

export const getPostsByUser = (userId, page = 0, size = 10) => {
  return api.get(`/posts/get/all/id/${userId}/sorted?page=${page}&size=${size}`);
};

export const getFeaturedPosts = (userId, page = 0, size = 10) => {
  return api.get(`/posts/get/all/featuredOn/${userId}/sorted?page=${page}&size=${size}`);
};

export const deleteComment = (commentId) => {
  return api.delete(`/posts/delete/comment/${commentId}`);
};

export const deletePost = (postId) => {
  return api.delete(`/posts/delete/${postId}`);
};

export const addView = (id, userName = null) => {
  const url = userName ? `/posts/view/${id}?userName=${encodeURIComponent(userName)}` : `/posts/view/${id}`;
  return api.post(url);
};

export const downloadPost = (id) => {
  return api.get(`/posts/get/id/${id}`);
};

export const trackDownload = (id, userName = null) => {
  const url = userName ? `/posts/download/${id}?userName=${encodeURIComponent(userName)}` : `/posts/download/${id}`;
  return api.post(url);
};

export const getPostDownloads = (id) => {
  return api.get(`/posts/downloads/${id}`);
};

export const getPostDownloadCount = (id) => {
  return api.get(`/posts/downloads/${id}/count`);
};

export const addLike = (postId) => {
  return api.post(`/posts/add/like/${postId}`);
};

export const getLikesSummary = (postId) => {
  return api.get(`/posts/likes/${postId}/summary`);
};

export const getLikesPaginated = (postId, page = 0, size = 24) => {
  return api.get(`/posts/likes/${postId}/paginated?page=${page}&size=${size}`);
};

export const getCommentsPaginated = (postId, page = 0, size = 10) => {
  return api.get(`/posts/comments/${postId}/paginated?page=${page}&size=${size}`);
};

export const addComment = (postId, comment) => {
  return api.post(`/posts/add/comment/${postId}`, comment, {
    headers: {
      'Content-Type': 'text/plain'
    }
  });
};

export const getViewsSummary = (postId) => {
  return api.get(`/posts/views/${postId}/summary`);
};

export const getViewsPaginated = (postId, page = 0, size = 10) => {
  return api.get(`/posts/views/${postId}/paginated`, {
    params: {
      page,
      size
    }
  });
};

export const getDownloadsPaginated = (postId, page = 0, size = 10) => {
  return api.get(`/posts/downloads/${postId}/paginated`, {
    params: {
      page,
      size
    }
  });
};
