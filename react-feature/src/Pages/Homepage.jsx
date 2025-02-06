import { useState } from 'react';
function Homepage() {
  
    const [loggedIn, setLoggedIn] = useState(false);
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
        <h2>SuperDex</h2>
        </div>
    </div>
  );
}
export default Homepage