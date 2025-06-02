import { use, useState } from "react";
import ProfileBanner from "../ProfileComp/ProfileBanner";
import ProfileDetails2 from "../SignupComp/ProfileDetails2";
import ProfileTabs from "../ProfileComp/ProfileTabs";
import Header2 from "../Components/Header2";
import "../SignupComp/SignupPage.css"
import axios from 'axios'
import ProfileContent2 from "../SignupComp/ProfileContent2";
function SignupPage( props){
    const [activeTab, setActiveTab] = useState("about");
    const [abouts, setAbout] = useState("")
    const [word, changeword] = useState("")
    const [bio, setBio] = useState("")
    const [post, setPost] = useState({
      userName: "",
      password: "",
      email: "",
      bio: "",
      about: "",
      profilePic: "",
      banner: "",
    })
    
    const handleInput = (e) => {
     
      setPost({...post, [e.target.name]: e.target.value})
       if (e.target.name === 'userName') {

        changeword(e.target.value);
       
    }
      if(e.target.name === "about"){
        setAbout(e.target.value);
      }
      if(e.target.name === "bio"){
        setBio(e.target.value);
      }
    }
    const handleSubmit = (e) =>{
        e.preventDefault();
        console.log(post)
        axios.post("http://localhost:8080/api/user/create", {...post})
        .then(res => console.log(res))
        .catch(err => console.log(err.response.data))
        
    }
    const handleProfilePicUpdate = (newPic) => {
    setPost({ ...post, profilePic: newPic });
    console.log(post.profilePic)
  };
    
 return(
    <div>
        <Header2 />
        <div id="signupform">
        <form  onSubmit={handleSubmit}>
            
        <label> Enter Username</label>
        <input type="text" name="userName"  onChange={handleInput}/>
        
        <label htmlFor="password" >Enter Password</label>
        <input type="password" name ="password" onChange={handleInput} />
        <label htmlFor="email">Enter Email</label>
            <input type="email" name="email" onChange={handleInput}/>

            <label htmlFor="bio">Enter Bio</label>
            <input type="text" name="bio" onChange={handleInput}/>

            <label htmlFor="about">Enter About</label>
            <input type="text" name="about" onChange={handleInput}/>
           
        <input type="submit"/>
    </form>
   </div>
        <div className="profile-page">
      
      <div className="profile-banner">
      {/* Example cover image */}
      <img
        className="profile-banner__image"
        src="pb.jpg"
        alt="Profile Cover"
      />
    </div>
      <div className="profile-main">
        <ProfileDetails2 username={word} bio={bio} onProfilePicChange={handleProfilePicUpdate} />
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <ProfileContent2  activeTab={activeTab} about={abouts} />
      </div>
    </div>
    
    </div>
 )
}
export default SignupPage