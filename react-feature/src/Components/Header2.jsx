import React from 'react';
import './Header.css';
function Header2(){

    return (
        <nav id="nav" >
            <ul id="head">
              <h1 id="title"><a href="/">FeatureMe</a></h1>
                <li className="click"><a href="/feed">Feed</a></li>
                
              
           <li><a href="/home">Login</a></li> 
           <li><a href="/signup">Signup</a></li> 
              
              <li></li>
            </ul>
            
          </nav>
      );
    }
    
    export default Header2;
    
