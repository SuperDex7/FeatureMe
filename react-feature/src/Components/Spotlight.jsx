import "./Spotlight.css";
import SpotlightItem from "./SpotlightItem";
function Spotlight() {
  const spotlightData = [
    {
      id: 3,
      author: "Juice WRLD",
      content: "This song was for my dead dog",
      timestamp: "2 hours ago",
      songname: "Lucid Dreams",
      features: ["Trippie Redd", "Lil Uzi Vert"],
      comments:["This Trash dood", "Grow up kid!!", "Dookieeee"],
      genre: "Hiphop",
      likes:["ggwoah", "oopsieeeepie", "Graaaaa123"]
    },
    {
      id: 2,
      author: "XXXTentacion",
      content: "100$ to hop on this.",
      timestamp: "3 hours ago",
      songname: "SAD",
      features: [],
      comments:["FIREEEE!!"],
      genre: "RNB",
      likes:["doooeeaa23","boiwhattt23556","noudidnt665","getoutdood1","Icantbveliece1111"]
    },
    {
      id: 1,
      author: "oksurf",
      content: "This my song hmu for feats",
      timestamp: "4 hours ago",
      songname: "Surf",
      features: ["SuperDex", "RezzyPhil"],
      comments:[],
      genre: "Punk",
      likes:[]
    },
    {
      id: 4,
      author: "DaddyDex",
      content: "Listen to this track",
      timestamp: "15 hours ago",
      songname: "Gungnam Style",
      features: ["Guru"],
      comments:["This Trash dood", "Grow up kid!!", "Dookieeee"],
      genre: "Soul",
      likes:["ggwoah", "oopsieeeepie", "Graaaaa123"]
    },
  ];
  return (
    
    <div id="spotlight">
      {spotlightData.map((item) => (
              <SpotlightItem key={item.id} {...item} />
            ))}
    </div>
   
  );
}
export default Spotlight