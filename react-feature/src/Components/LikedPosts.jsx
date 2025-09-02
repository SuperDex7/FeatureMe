import { useState, useEffect } from "react"
import api, {getCurrentUser} from "../services/AuthService"
import SpotlightItem from "./SpotlightItem"
function LikedPosts(){
    const [user, setUser] = useState(null)
    const [likedPosts,setLikedPosts] = useState(null)
        useEffect(()=>{
            getCurrentUser().then(res=>{
                setUser(res)
                console.log(res)
                api.get(`/posts/get/all/id/${res.likedPosts}`).then(res=>{
                    setLikedPosts(res.data)
                console.log(res)
                })
            })
        }, [])

    return(
        <div className="spotlight-cards-grid">
              {likedPosts?.map((item) => (
                <SpotlightItem key={item} {...item} />
              ))|| "No Liked Posts Yet"}
            </div>
    )
}
export default LikedPosts