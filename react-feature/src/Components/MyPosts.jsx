import { useState, useEffect } from "react"
import api, {getCurrentUser} from "../services/AuthService"
import FeedItem from "./FeedItem"
function MyPosts(){
const [user, setUser] = useState(null)
const [posts,setPosts] = useState(null)
const [size, setSize] = useState(6)
const [page, setPage] = useState(0)
const [totalPages, setTotalPages] = useState(0)
    useEffect(()=>{
        getCurrentUser().then(res=>{
            setUser(res)
            
            api.get(`/posts/get/all/id/${res.posts}?page=${page}&size=${size}`).then(res=>{
                setPosts(res.data.content)
                setTotalPages(res.data.page.totalPages)
            })
        })
    }, [])
    const nextPage = () =>{
        setPage(page+1)
      }
      const prevPage = () =>{
        setPage(page-1)
      }

    return(
        <div>
        <div className="feed-cards-grid">
          {posts?.map((item) => (
            <FeedItem key={item.id} {...item} />
          ))|| "No Posts Yet"}
        </div>
        <div id="pageButtons">
        <button className="section-more-btn" onClick={prevPage} disabled={page == 0 || page == null? true: false}>Previous Page</button>
        <button className="section-more-btn" onClick={nextPage} disabled={page == totalPages-1 || page == null? true: false}>Next Page</button>
        </div>
        </div>
    )
}
export default MyPosts