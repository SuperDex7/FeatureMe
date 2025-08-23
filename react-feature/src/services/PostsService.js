import axios from "axios"; 
const REST_API_GET_URL = "http://localhost:8080/api/posts/get"

export const getAuthHeaders = () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.warn('No JWT token found in localStorage');
      return {};
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };
  
  

export const listPosts = () => {
    return axios.get(REST_API_GET_URL, { 
        headers: getAuthHeaders() 
      }).catch(error => {
        if (error.response && error.response.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('jwtToken');
          window.location.href = '/login';
        }
        throw error;
      });
}
export function listPostsDesc(){
    return axios.get("http://localhost:8080/api/posts/get/likesdesc", { 
        headers: getAuthHeaders() 
      }).catch(error => {
        if (error.response && error.response.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('jwtToken');
          window.location.href = '/login';
        }
        throw error;
      });
}

//export const listPosts = () => axios.get(REST_API_GET_URL);