import axios from "axios"; 
const REST_API_GET_URL = "http://localhost:8080/api/posts/get"

export const listPosts = () => {
     return axios.get(REST_API_GET_URL);
}
export function listPostsDesc(){
    return axios.get("http://localhost:8080/api/posts/get/likesdesc")
}

//export const listPosts = () => axios.get(REST_API_GET_URL);