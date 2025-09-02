import { useState, useEffect } from "react"
import api, {getCurrentUser} from "../services/AuthService"
import FeedItem from "./FeedItem"
function MyPosts(){
const [user, setUser] = useState(null)
const [posts,setPosts] = useState(null)
    useEffect(()=>{
        getCurrentUser().then(res=>{
            setUser(res)
            
            api.get(`/posts/get/all/id/${res.posts}`).then(res=>{
                setPosts(res.data)
            
            })
        })
    }, [])

    return(
        <div className="feed-cards-grid">
          {posts?.map((item) => (
            <FeedItem key={item.id} {...item} />
          ))|| "No Posts Yet"}
        </div>
    )
}
export default MyPosts