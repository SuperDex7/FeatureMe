import axios from "axios"; 
const REST_API_GET_URL = "http://localhost:8080/api/user/get"

export function listUsers(){
    return axios.get(REST_API_GET_URL);
}
export function GetUserById(){
    return axios.get("http://localhost:8080/api/user/get/id/{id}")
}
