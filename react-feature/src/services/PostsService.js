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

export const deleteComment = (postId, commentText) => {
  return api.delete(`/posts/delete/comment/${postId}`, {
    data: commentText,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}

export const deletePost = (postId) => {
  return api.delete(`/posts/delete/${postId}`);
}

export const addView = (id) => {
  return api.post(`/posts/view/${id}`);
}