import { useEffect, useState } from "react"
import { listUsers } from "../services/UserService"
import ProfileList from "../Components/ProfileList"
import Footer from "../Components/Footer"

function ProfilesPage(){
    const [users, setUsers] = useState([])
    useEffect(() => {
        listUsers().then((response) => {
          setUsers(response.data);
          console.log(response.data)
        }).catch(error => {
          console.error(error);
        })
      }, [])
      return(
        <div>
            {users.map((item) =>(
                <ProfileList key={item.id} {...item} />
            ))}
            <Footer />
        </div>
      )
}
export default ProfilesPage