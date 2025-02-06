function Appy(){
    const axios = require('axios');
    const [data, setData] = useState();
    const getSomething = () => {
      axios.get('http://localhost:3000/hi')
    .then(response => {
      setData(response.data);
      console.log(response.data);
    });
    }
    return (
      <>
        <button onClick={getSomething}>Get something</button>
        <h1>{data}</h1>
      </>
    )
}
export default Appy