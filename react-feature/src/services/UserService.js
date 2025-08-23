import axios from "axios"; 
const REST_API_GET_URL = "http://localhost:8080/api/user/get"

export function listUsers(){
    return axios.get(REST_API_GET_URL);
}
export function GetUserById(){
    return axios.get("http://localhost:8080/api/user/get/id/{id}")
}
export function getUserInfo(){
    return axios.get("http://localhost:8080/api/user/userInfo");
}
const getAuthHeaders = () => {
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