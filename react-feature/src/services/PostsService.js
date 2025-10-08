import api from './AuthService';

export const listPosts = () => {
    return api.get('/posts/get');
}

export function listPostsDesc(){
    return api.get('/posts/get/likesdesc');
}

export const getPostById = (id) => {
  return api.get(`/posts/get/id/${id}`);
}

export const getPostsByUser = (userId, page = 0, size = 10) => {
  return api.get(`/posts/get/all/id/${userId}/sorted?page=${page}&size=${size}`);
}

export const getFeaturedPosts = (userId, page = 0, size = 10) => {
  return api.get(`/posts/get/all/featuredOn/${userId}/sorted?page=${page}&size=${size}`);
}

export const deleteComment = (commentId) => {
  return api.delete(`/posts/delete/comment/${commentId}`);
}

export const deletePost = (postId) => {
  return api.delete(`/posts/delete/${postId}`);
}

export const addView = (id, userName = null) => {
  const url = userName ? `/posts/view/${id}?userName=${encodeURIComponent(userName)}` : `/posts/view/${id}`;
  return api.post(url);
}

export const downloadPost = (id) => {
  return api.get(`/posts/get/id/${id}`);
}

export const trackDownload = (id, userName = null) => {
  const url = userName ? `/posts/download/${id}?userName=${encodeURIComponent(userName)}` : `/posts/download/${id}`;
  return api.post(url);
}

export const getPostDownloads = (id) => {
  return api.get(`/posts/downloads/${id}`);
}

export const getPostDownloadCount = (id) => {
  return api.get(`/posts/downloads/${id}/count`);
}