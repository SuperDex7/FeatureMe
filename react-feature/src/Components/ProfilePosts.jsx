import "./ProfilePosts.css"
import { useState } from "react";
import AudioPlayer from "./AudioPlayer"
function ProfilePosts({title, author, time, music, likes, genre, features, description}){
    const { userName, profilePic, banner } = author ?? {};
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);
    return(
        <div id="profile-posts-container">
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
            
            
            <button id="pp-play-btn" onClick={e => { e.stopPropagation(); setShowAudioPlayer(true); }} title="Play">
              <span>&#9654;</span>
            </button>
            {showAudioPlayer && (
            <div onClick={e => e.stopPropagation()}>
              <AudioPlayer src={music} onClose={() => setShowAudioPlayer(false)} title={title} />
            </div>
          )}
          <h5 id="ppGenre">
            {genre.join(", ")}
            </h5>
          <div id="ppLastSection">
          <h5>Likes: {likes.length}</h5>
            <h6 id="ppTime">{new Date(time).toLocaleDateString()}</h6>
            </div>
        </div>
    )
}
export default ProfilePosts