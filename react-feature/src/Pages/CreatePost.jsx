import "../Styling/CreatePost.css"
import React, { useState, useRef } from "react";
import Header from "../Components/Header";
const GENRES = [
    'Hip Hop', 'Pop', 'Rock', 'Jazz', 'R&B', 'Electronic', 'Classical',
    'Reggae', 'Metal', 'Country', 'Indie', 'Folk', 'Blues'
  ];
function CreatePost(){

  const [songName, setSongName] = useState('');
  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  const [genres, setGenres]   = useState([]);
  const [ddOpen, setDdOpen]   = useState(false);
  const ddRef = useRef(null); 

  const handleFeatureKeyDown = (e) => {
    if (e.key === 'Enter' && featureInput.trim()) {
      e.preventDefault();
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const removeFeature = (name) =>
    setFeatures(features.filter((f) => f !== name));

  const toggleGenre = (g) =>
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );

  const genreLabel =
    genres.length === 0 ? 'Select genres…' : genres.join(', ');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Build multipart/form-data payload
    const formData = new FormData();
    formData.append('songName',   songName);
    formData.append('features',   JSON.stringify(features));
    formData.append('description',description);
    formData.append('genres',     JSON.stringify(genres));
    if (file) formData.append('file', file);

    // TODO: Axios / fetch POST
    console.log('Posting…', Object.fromEntries(formData));
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
          type="text"
          className="text-input"
          value={songName}
          onChange={(e) => setSongName(e.target.value)}
        />

        {/* Features */}
        <label className="input-label">Features</label>
        <input
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
          rows={4}
          className="text-area"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
            {GENRES.map((g) => (
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