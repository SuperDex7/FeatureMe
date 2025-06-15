import { use, useState } from "react";
import ProfileBanner from "../ProfileComp/ProfileBanner";
import ProfileDetails2 from "../SignupComp/ProfileDetails2";
import ProfileTabs from "../ProfileComp/ProfileTabs";
import Header2 from "../Components/Header2";
import "../SignupComp/SignupPage.css"
import { useRef } from "react";
import axios from 'axios'
import ProfileContent2 from "../SignupComp/ProfileContent2";
function SignupPage( props){
    const [activeTab, setActiveTab] = useState("about");
    const [abouts, setAbout] = useState("")
    const [word, changeword] = useState("")
    const [bio, setBio] = useState("")
    const [hover, setHover] = useState(false)
    const [banner, setBanner] = useState("pb.jpg")
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [post, setPost] = useState({
      userName: "",
      password: "",
      email: "",
      bio: "",
      about: "",
      profilePic: "",
      banner: "",
    })
  const fileInputRef = useRef(null);
  


    function displayText(){
    setHover(!hover);
  }
    
  
  const handleContainerClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
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

    const handleBannerChange = (e) => {
    e.preventDefault()
    const file = e.target.files[0];
    if(file){
      const bannerUrl = URL.createObjectURL(file)
      setBanner(bannerUrl)
      setBannerFile(file);
    
  }
}

    const handleSubmit = (e) =>{
        e.preventDefault();
        console.log(post)
        const formData = new FormData();
    
    formData.append("user",new Blob([JSON.stringify(post)], { type: "application/json" }));
    
    if (profilePicFile) {formData.append("pp", profilePicFile);}
    // If you plan to support banner file upload, append it similarly:
    if(banner){ formData.append("banner", bannerFile); }

        axios.post("http://localhost:8080/api/user/create", formData, {
          headers:{"Content-Type": "multipart/form-data"}
        })
        .then(res => console.log(res))
        .catch(err => console.log(err))
        
    }
    const handleProfilePicUpdate = (file, newPic) => {
    setProfilePicFile(file)
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
        <div >
          <div onMouseEnter={displayText} onMouseLeave={displayText}  onClick={handleContainerClick}>
        {hover && <div><p id="cpp">Change Profile Picture</p> 
        <input type="file" onChange={handleBannerChange} ref={fileInputRef} style={{display:"none"}}/>
          </div>} 
        <div className="profile-banner">
      {/* Example cover image */}
      <img
        className="profile-banner__image"
        src={banner}
        alt="Profile Cover"
      />
    </div>
        
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