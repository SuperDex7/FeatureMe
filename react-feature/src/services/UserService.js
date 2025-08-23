import api from './AuthService';

const REST_API_GET_URL = "/user/get"

export function listUsers(){
    return api.get(REST_API_GET_URL);
}

export function GetUserById(){
    return api.get("/user/get/id/{id}")
}

export function getUserInfo(){
    return api.get("/user/get/{username}");
}