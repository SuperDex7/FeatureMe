import axios from "axios"; 
const REST_API_GET_URL = "http://localhost:8080/api/user/get"

function UserServices(){
    axios.get(REST_API_GET_URL);
}
export default UserServices