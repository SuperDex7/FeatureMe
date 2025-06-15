import "../Styling/CreatePost.css"
import React, { useState, useRef, use } from "react";
import Header from "../Components/Header";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
const GENRES = [
    "Song","Beat","Loop","Instrument","Free","Paid",'Hip Hop', 'Pop', 'Rock', 'Jazz', 'R&B', 'Electronic', 'Classical',
    'Reggae', 'Metal', 'Country', 'Indie', 'Folk', 'Blues'
  ];
function CreatePost(){

  const [songName, setSongName] = useState('');
  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState('');
  const [description, setDescription] = useState('');
  const [id, setId] = useState("684ccf832a1a4e06ca828c50")
  const [file, setFile] = useState(null);
  const [genres, setGenres]   = useState([]);
  const [ddOpen, setDdOpen]   = useState(false);

  const [post, setPost] = useState({
    title: "",
    description: "",
    features: [],
    genre: [],
    music:""
  })

  const navigate = useNavigate();
  const ddRef = useRef(null); 

  const handleFeatureKeyDown = (e) => {
    if (e.key === 'Enter' && featureInput.trim()) {
      e.preventDefault();
      const newFeature = featureInput.trim();
      const newFeatures = [...features, newFeature];
      setFeatures(newFeatures);
      setFeatureInput("");
      setPost({ ...post, features: newFeatures });
    }
  };
  const handleInput = (e) => {
    setPost({...post, [e.target.name]: e.target.value})
  }
  const removeFeature = (name) =>
    setFeatures(features.filter((f) => f !== name));

  const toggleGenre = (g) => {
    const newGenres = genres.includes(g)
      ? genres.filter((x) => x !== g)
      : [...genres, g];
    setGenres(newGenres);
    // Update the post; adjust this as needed (e.g., using newGenres directly or a joined string)
    setPost({ ...post, genre: newGenres });
  };

  const genreLabel =
    genres.length === 0 ? 'Select genres…' : genres.join(', ');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Build multipart/form-data payload
    const formData = new FormData();
    formData.append("post", new Blob([JSON.stringify(post)], {type: "application/json"}) )
    if (file) {
      if (file.type !== "audio/mpeg") {
      alert("Only MP3 files are allowed.");
      return;
      } 
      formData.append('file', file);
    }

    // TODO: Axios / fetch POST
    console.log('Posting…', Object.fromEntries(formData));
    axios.post(`http://localhost:8080/api/posts/create/${id}`, formData, {
      headers:{"Content-Type": "multipart/form-date"}
    }).then(res => {
      alert("Upload successful!");
      navigate("/feed");
    })
    .catch(err=> console.log(err))
    
  };

  /* ────────────────────────────────────────────── */
  return (
    
    <div className="page-wrapper">
        <Header />
      <form className="card" onSubmit={handleSubmit}>
        <h2 className="card-heading">Upload a New Song</h2>

        {/* Song name */}
        <label className="input-label">Song Name</label>
        <input
        name="title"
          type="text"
          className="text-input"
          placeholder="Format Suggestion: Song Name or Instrument - BPM"
          onChange={handleInput}
        />

        {/* Features */}
        <label className="input-label">Features</label>
        <input
        name="features"
          type="text"
          className="text-input"
          placeholder="Press Enter to add"
          value={featureInput}
          onChange={(e) => setFeatureInput(e.target.value)}
          onKeyDown={handleFeatureKeyDown}
        />
        <div className="tag-list">
          {features.map((f) => (
            <span key={f} className="tag" onClick={() => removeFeature(f)}>
              {f}
            </span>
          ))}
        </div>

        {/* Description */}
        <label className="input-label">Description</label>
        <textarea
        name="description"
          rows={4}
          className="text-area"
          onChange={handleInput}
        />

        {/* Audio file */}
        <label className="input-label">Upload Audio File (.mp3 or .wav)</label>
        <input
          type="file"
          accept=".mp3,.wav"
          className="file-input"
          onChange={(e) => setFile(e.target.files[0])}
        />

        {/* Genre dropdown with checkboxes */}
        <label className="input-label">Genre</label>
        <div
          className={`dropdown${ddOpen ? ' open' : ''}`}
          tabIndex={0}
          onBlur={() => setDdOpen(false)}
          ref={ddRef}
        >
          <div
            className="dropdown-toggle"
            onClick={() => {
              setDdOpen((o) => !o);
                setTimeout(() => ddRef.current?.focus(), 0);
              }}
              >
              {genreLabel}
              </div>

              <div className="dropdown-menu">
              <h3>Category:</h3>
              {GENRES.slice(0, 6).map((g) => (
                <label key={g} className="dropdown-item">
                <input
                name="genre"
                  type="checkbox"
                  checked={genres.includes(g)}
                  onChange={() => toggleGenre(g)}
                />
                {g}
                </label>
              ))}
              <h3>Genres:</h3>
              {GENRES.slice(6).map((g) => (
                <label key={g} className="dropdown-item">
                <input
                  type="checkbox"
                  checked={genres.includes(g)}
                  onChange={() => toggleGenre(g)}
                />
                {g}
                </label>
              ))}
              </div>
            </div>

            {/* Submit */}
        <button type="submit" className="submit-button">
          Post
        </button>
      </form>
    </div>
  );
}
export default CreatePost