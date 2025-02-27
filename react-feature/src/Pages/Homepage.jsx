import { useState } from 'react';
import ProgressBar from '../HomepageF/ProgressBar';
import Header from '../Components/Header';
import Notifications from '../Components/Notifications';
import Footer from '../Components/Footer';
import "../App.css"
function Homepage() {
  
    const [loggedIn, setLoggedIn] = useState(true);
    const [progress, setProgress] = useState(0);
    const [progCheck, setProgCheck] = useState(true);

    const simulateProgress = () => {
      setProgress(progress + 10);
      if(progress >= 100){
        maxProgress();
      }
    };
    const maxProgress = () => {
      setProgress(100);
      setProgCheck(false);
    }
    const login = () => {
        setLoggedIn(true);
    }
    const checkLogin = () => {
        if(loggedIn){
            setLoggedIn(true);
        }
    }
    const preventD = (e) => {
        e.preventDefault();
    }
    return (
    <div id='home-body'>
        <Header />

      {loggedIn && <div id='profileS' >
        <section id='profileSi'>
        <h2>SuperDex</h2>
        <h3>Followers: 0</h3>
        <h3>Following: 0</h3>
        <button id='ppEdit'>Edit Profile Page</button>
         </section>
         <section>
          <a href="/profile"><img id='pp' src="dpp.jpg" alt="" />  </a>
          </section>
          {progCheck && 
          <section id='progress'>
            <h2 id='complete'>Complete Profile</h2>
            <ProgressBar value={progress} max={100} />
      <button onClick={simulateProgress}>Increase Progress</button>
          </section>
          
          }
      
         
        </div>}
        <div id='homeWidgets'>
          <div className='homeSection' id='recent-activity'>
            <h3 className='sectionTitle' id='recentTitle'>Recent Activity</h3>
            <Notifications />
          </div>
          <div className='homeSection' id='uploadTab'>
            <h3 className='sectionTitle' id='uploadTitle'>Upload</h3>
            <div id='uploadButtons'> 
              <button className='uploadButton'>Song</button>
            <button className='uploadButton'>Beat</button>
            <button className='uploadButton'>Loop</button>
            <button className='uploadButton'>Instrument</button>
            </div>
            
          </div>
          <div className='homeSection' id='latestPost'>
            <h3 className='sectionTitle' id='latestTitle'>Latest Post</h3>
          </div>
        </div>
        <Footer />
    </div>
  );
}
export default Homepage