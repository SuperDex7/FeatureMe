import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";
function Que() {
    const [data, setData] = useState()
    const query = useQuery({
    queryKey: ['users'],
    })
    const getUsers = () => {
        
        setData(axios.get('https://jsonplaceholder.typicode.com/users/1'))
    }
    
  return (
    <div>
        <button onClick={getUsers}>CLick</button>
        <h1>{data}</h1>
        <p>hi</p>
    </div>
    
    
  );
}
export default Que;