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

// Post lists by user name: the server looks up the ids, so they don't go in
// the URL (which breaks at a few hundred ids).
export const getPostsByUser = (userName, page = 0, size = 12) => {
  return api.get(`/posts/get/by-user/${encodeURIComponent(userName)}`, { params: { page, size } });
}

export const getFeaturedPosts = (userName, page = 0, size = 12) => {
  return api.get(`/posts/get/featuring/${encodeURIComponent(userName)}`, { params: { page, size } });
}

export const getMyLikedPosts = (page = 0, size = 12) => {
  return api.get(`/posts/liked`, { params: { page, size } });
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