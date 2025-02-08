import { useState } from 'react';
import ProgressBar from '../HomepageF/ProgressBar';
function Homepage() {
  
    const [loggedIn, setLoggedIn] = useState(false);
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
    <div>
      <nav id="nav" >
        <ul id="head">
            <h1 id="title">FeatureMe</h1>
            <li className="click"><a href="/feed">Feed</a></li>
          {loggedIn ?  "": <li onClick={login}><a onClick={preventD} href="/login">Login</a></li>}
          { loggedIn ? <li><a href="/profile">Profile</a></li> : <li><a href="/signup">Signup</a></li>}
          
          <li></li>
        </ul>
      </nav>

       <div id='profileS'>
        <section id='profileSi'>
        <h2>SuperDex</h2>
        <h3>Followers: 0</h3>
        <h3>Following: 0</h3>
         </section>
         <section>
          <img id='pp' src="dpp.jpg" alt="" />
          </section>
          {progCheck && 
          <section id='progress'>
            <h2 id='complete'>Complete Profile</h2>
            <ProgressBar value={progress} max={100} />
      <button onClick={simulateProgress}>Increase Progress</button>
          </section>
          
          }
          
          <section className='upload'>
            <h3><a href="/upload"></a>Upload a song/beat</h3>
          </section>
         
        </div>
    </div>
  );
}
export default Homepage