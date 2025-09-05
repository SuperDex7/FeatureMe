import "./ProfilePosts2.css"
import { useState, useEffect } from "react";
import AudioPlayer from "./AudioPlayer"
import { addView } from "../services/PostsService";
import { getCurrentUser } from "../services/AuthService";

function ProfilePosts2({id, title, author, time, music, likes, genre, features, description}){
    const { userName, profilePic, banner } = author ?? {};
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Get current user on component mount
    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser();
            setCurrentUser(user);
        };
        fetchUser();
    }, []);

    const handlePlayClick = async (e) => {
        e.stopPropagation();
        
        // Check cooldown before adding view
        const cooldownKey = `view_${id}_${currentUser?.userName}`;
        const lastViewTime = localStorage.getItem(cooldownKey);
        const now = Date.now();
        const oneMinute = 60 * 1000; // 1 minute in milliseconds
        
        let shouldAddView = true;
        if (lastViewTime) {
            const timeSinceLastView = now - parseInt(lastViewTime);
            if (timeSinceLastView < oneMinute) {
                shouldAddView = false;
                console.log(`View cooldown active. ${Math.ceil((oneMinute - timeSinceLastView) / 1000)}s remaining`);
            }
        }
        
        if (shouldAddView && currentUser) {
            try {
                await addView(id);
                localStorage.setItem(cooldownKey, now.toString());
                console.log("View added for post:", id);
            } catch (error) {
                console.error("Error adding view:", error);
            }
        }
        
        setShowAudioPlayer(true);
    };
    return(
        <div id="profile-posts-container2">
            <img id="ppb" src={banner} alt="" />
            <div id="ppName-section">
                <img id="ppp" src={profilePic} alt="" />
                <a href={userName}><h3 id="ppUsername">{userName}</h3></a>
            </div>
            <h3>{title}</h3>
            <span id="ppFeatures">
                <span>Feat: </span>
                {features.map((feature, index) => (
                    <a key={index} href={`/profile/${feature}`}>
                        {feature}
                        {index < features.length - 1 && ", "}
                    </a>
                ))}
            </span>

          <h5 id="ppGenre2">
            {genre.join(", ")}
            </h5>
          <div id="ppLastSection">
          <h5>Likes: {likes.length}</h5>
            <h6 id="ppTime">{new Date(time).toLocaleDateString()}</h6>
            </div>
            {!showAudioPlayer && (
                <button id="pp-play-btn2" onClick={handlePlayClick} title="Play">
                  <span>&#9654;</span>
                </button>
            )}
            {showAudioPlayer && (
            <div onClick={e => e.stopPropagation()}>
              <AudioPlayer src={music} onClose={() => setShowAudioPlayer(false)} title={title} />
            </div>
          )}

        </div>
    )
}
export default ProfilePosts2