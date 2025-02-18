import { useState } from 'react';
import ProgressBar from '../HomepageF/ProgressBar';
import Header from '../Components/Header';
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
    <div>
        <Header />

      {loggedIn && <div id='profileS' >
        <section id='profileSi'>
        <h2>SuperDex</h2>
        <h3>Followers: 0</h3>
        <h3>Following: 0</h3>
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
          
          <section className='upload'>
            <h3><a href="/upload"></a>Upload a song/beat</h3>
          </section>
         
        </div>}
        <div>

        </div>
    </div>
  );
}
export default Homepage