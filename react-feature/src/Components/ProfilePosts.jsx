import "./ProfilePosts.css"
function ProfilePosts({title, author, time, music, likes, genre, features, description}){
    const { userName, profilePic, banner } = author ?? {};
    return(
        <div id="profile-posts-container">
            <img id="ppb" src={banner} alt="" />
            <div id="ppName-section">
                <img id="ppp" src={profilePic} alt="" />
                <h3 id="ppUsername">{userName}</h3>
            </div>
            <h3>{title}</h3>
            <span id="ppFeatures">
                {features.map((feature, index) => (
                    <a key={index} href={`/profile/${feature}`}>
                        {feature}
                        {index < features.length - 1 && ", "}
                    </a>
                ))}
            </span>
            <h6>{new Date(time).toLocaleDateString()}</h6>
            
        </div>
    )
}
export default ProfilePosts