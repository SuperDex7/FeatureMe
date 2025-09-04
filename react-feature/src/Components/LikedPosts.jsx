import { useState, useEffect } from "react"
import api, {getCurrentUser} from "../services/AuthService"
import SpotlightItem from "./SpotlightItem"
function LikedPosts(){
    const [user, setUser] = useState(null)
    const [likedPosts,setLikedPosts] = useState(null)
    const [size, setSize] = useState(6)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
        useEffect(()=>{
            getCurrentUser().then(res=>{
                setUser(res)
                console.log(`/posts/get/all/id/${res.posts}?page=${page}&size=${size}`)
                api.get(`/posts/get/all/id/${res.likedPosts}?page=${page}&size=${size}`).then(res=>{
                    setLikedPosts(res.data.content)
                    setTotalPages(res.data.page.totalPages)
                console.log(res)
                })
            })
        }, [page])
        const nextPage = () =>{
            setPage(page+1)
          }
          const prevPage = () =>{
            setPage(page-1)
          }

    return(
        <div>
        <div className="spotlight-cards-grid">
              {likedPosts?.map((item) => (
                <SpotlightItem key={item.id} {...item} />
              ))|| "No Liked Posts Yet"}
            </div>
            <div id="pageButtons">
        <button className="section-more-btn" onClick={prevPage} disabled={page == 0 || page == null? true: false}>Previous Page</button>
        <button className="section-more-btn" onClick={nextPage} disabled={page == totalPages-1 || page == null? true: false}>Next Page</button>
        </div>
            </div>
    )
}
export default LikedPosts