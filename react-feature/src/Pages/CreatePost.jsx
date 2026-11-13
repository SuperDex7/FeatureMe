import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import Icon from "../Components/ui/Icon";
import PlusBadge from "../Components/ui/PlusBadge";
import UserPicker from "../Components/ui/UserPicker";
import api, { getCurrentUser } from "../services/AuthService";
import { POST_TYPES, MUSIC_GENRES } from "../constants/genres";
import { bannerStyle } from "../utils/banner";
import "../Styling/CreatePostPage.css";

const DEFAULT_AVATAR = "/dpp.jpg";
const TITLE_MAX = 50;
const DESCRIPTION_MAX = 300;

// What each plan can upload. The server checks this too.
const UPLOAD_RULES = {
  USERPLUS: { extensions: ["mp3", "wav"], maxMB: 90, accept: ".mp3,.wav,audio/mpeg,audio/wav", label: "MP3 or WAV, up to 90 MB" },
  USER: { extensions: ["mp3"], maxMB: 15, accept: ".mp3,audio/mpeg", label: "MP3, up to 15 MB" },
};

function formatSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function checkFile(file, rules) {
  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
  if (!rules.extensions.includes(extension)) {
    return rules.extensions.length > 1
      ? "That file type isn't supported. Upload an MP3 or WAV."
      : "Free accounts can upload MP3 files. Get Plus to upload WAV.";
  }
  if (file.size > rules.maxMB * 1024 * 1024) {
    return `That file is ${formatSize(file.size)}. The limit on your plan is ${rules.maxMB} MB.`;
  }
  return null;
}

function CreatePost() {
  const [currentUser, setCurrentUser] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [features, setFeatures] = useState([]);
  const [freeDownload, setFreeDownload] = useState(false);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState(null);

  const fileInputRef = useRef(null);
  const titleRef = useRef(null);
  const trackRef = useRef(null);
  const tagsRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  const rules = UPLOAD_RULES[currentUser?.role] || UPLOAD_RULES.USER;
  const isPlus = currentUser?.role === "USERPLUS";
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // Warn before leaving with unsaved work
  const dirty = Boolean(file || title.trim() || description.trim() || tags.length || features.length);
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      if (doneRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const clearError = (key) => setErrors((prev) => (prev[key] ? { ...prev, [key]: null } : prev));

  const chooseFile = (picked) => {
    if (!picked) return;
    const problem = checkFile(picked, rules);
    if (problem) {
      setErrors((prev) => ({ ...prev, file: problem }));
      return;
    }
    setFile(picked);
    clearError("file");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const toggleTag = (tag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    clearError("tags");
  };

  const toggleFeature = (user) => {
    setFeatures((prev) => (
      prev.some((u) => u.userName === user.userName)
        ? prev.filter((u) => u.userName !== user.userName)
        : [...prev, user]
    ));
  };

  const missing = [];
  if (!file) missing.push("Add your track");
  if (!title.trim()) missing.push("Give it a title");
  if (tags.length === 0) missing.push("Pick at least one tag");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = {};
    if (!file) nextErrors.file = "Add an audio file to post.";
    if (!title.trim()) nextErrors.title = "Give your track a title.";
    if (tags.length === 0) nextErrors.tags = "Pick at least one tag so people can find it.";
    setErrors(nextErrors);
    if (nextErrors.file) { trackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (nextErrors.title) { titleRef.current?.focus(); return; }
    if (nextErrors.tags) { tagsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }

    const formData = new FormData();
    formData.append("post", JSON.stringify({
      title: title.trim(),
      description: description.trim(),
      features: features.map((u) => u.userName),
      genre: tags,
      music: "",
      freeDownload,
    }));
    formData.append("file", file);

    setSubmitting(true);
    setSubmitError(null);
    setProgress(0);
    try {
      const { data } = await api.post("/posts/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 0, // big WAVs on slow connections can take a while
        onUploadProgress: (e) => { if (e.total) setProgress(Math.round((e.loaded / e.total) * 100)); },
      });
      doneRef.current = true;
      window.location.href = data?.id ? `/post/${data.id}` : "/feed";
    } catch (err) {
      console.error("Upload failed:", err);
      const message = typeof err.response?.data === "string" && err.response.data.length < 200 ? err.response.data : null;
      setSubmitError(message || (err.response ? "The upload failed. Try again." : "Couldn't reach the server. Check your connection and try again."));
      setSubmitting(false);
    }
  };

  const typeTags = tags.filter((t) => POST_TYPES.includes(t));
  const genreTags = tags.filter((t) => !POST_TYPES.includes(t));

  return (
    <div className="fm-page">
      <Header />

      <main className="fm-page__main">
        <form className="fm-create" onSubmit={handleSubmit} noValidate>
          <div className="fm-create__intro">
            <h1 className="fm-create__title">New post</h1>
            <p className="fm-create__subtitle">Share a track, beat or loop, and invite other artists to feature on it.</p>
          </div>

          <div className="fm-create__layout">
            <div className="fm-create__main">
              {/* Track */}
              <section className="fm-card fm-create__section" aria-labelledby="fm-create-track" ref={trackRef}>
                <h2 id="fm-create-track" className="fm-create__section-title"><span>1</span>Your track</h2>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={rules.accept}
                  hidden
                  onChange={(e) => { chooseFile(e.target.files?.[0]); e.target.value = ""; }}
                />
                {file ? (
                  <div className="fm-create__file">
                    <span className="fm-create__file-icon"><Icon name="music" /></span>
                    <span className="fm-create__file-meta">
                      <span className="fm-create__file-name">{file.name}</span>
                      <span className="fm-create__muted">{formatSize(file.size)}</span>
                    </span>
                    <button type="button" className="fm-btn fm-btn--secondary" onClick={() => fileInputRef.current?.click()} disabled={submitting}>Replace</button>
                    <button type="button" className="fm-icon-btn" onClick={() => setFile(null)} disabled={submitting} aria-label="Remove file">
                      <Icon name="close" />
                    </button>
                    {previewUrl && <audio className="fm-create__audio" controls preload="metadata" src={previewUrl} aria-label="Preview your track" />}
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`fm-create__drop${dragging ? " is-dragging" : ""}${errors.file ? " has-error" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    aria-describedby={errors.file ? "fm-create-file-error" : undefined}
                  >
                    <span className="fm-create__drop-icon"><Icon name="music" size={28} /></span>
                    <span className="fm-create__drop-title">Drop your audio file here, or click to choose</span>
                    <span className="fm-create__muted">{rules.label}</span>
                  </button>
                )}
                {errors.file && <p id="fm-create-file-error" className="fm-field__error" role="alert">{errors.file}</p>}
                {currentUser && !isPlus && (
                  <p className="fm-create__upsell">
                    <PlusBadge size={16} />
                    <span>Want WAV uploads and files up to 90 MB? <a href="/subscription">Get Plus</a></span>
                  </p>
                )}
              </section>

              {/* Details */}
              <section className="fm-card fm-create__section" aria-labelledby="fm-create-details">
                <h2 id="fm-create-details" className="fm-create__section-title"><span>2</span>Details</h2>

                <div className="fm-field">
                  <label className="fm-field__label" htmlFor="fm-create-title">Title</label>
                  <input
                    ref={titleRef}
                    id="fm-create-title"
                    className={`fm-input${errors.title ? " has-error" : ""}`}
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); clearError("title"); }}
                    maxLength={TITLE_MAX}
                    placeholder="Song name, or instrument and BPM"
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby="fm-create-title-hint"
                  />
                  <span id="fm-create-title-hint" className="fm-create__field-foot">
                    {errors.title ? <span className="fm-field__error">{errors.title}</span> : <span />}
                    <span className="fm-field__hint">{title.length}/{TITLE_MAX}</span>
                  </span>
                </div>

                <div className="fm-field">
                  <label className="fm-field__label" htmlFor="fm-create-description">Description <span className="fm-create__optional">Optional</span></label>
                  <textarea
                    id="fm-create-description"
                    className="fm-input"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={DESCRIPTION_MAX}
                    placeholder="What's the vibe? What are you looking for from a feature?"
                  />
                  <span className="fm-create__field-foot">
                    <span />
                    <span className="fm-field__hint">{description.length}/{DESCRIPTION_MAX}</span>
                  </span>
                </div>

                <fieldset className="fm-create__tags" ref={tagsRef} aria-describedby={errors.tags ? "fm-create-tags-error" : undefined}>
                  <legend className="fm-field__label">What is it?</legend>
                  <div className="fm-create__chips">
                    {POST_TYPES.map((tag) => (
                      <button key={tag} type="button" className="fm-chip" aria-pressed={tags.includes(tag)} onClick={() => toggleTag(tag)}>
                        {tags.includes(tag) && <Icon name="check" size={14} strokeWidth={2.4} />}
                        {tag}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="fm-create__tags">
                  <legend className="fm-field__label">Genres</legend>
                  <div className="fm-create__chips">
                    {MUSIC_GENRES.map((tag) => (
                      <button key={tag} type="button" className="fm-chip" aria-pressed={tags.includes(tag)} onClick={() => toggleTag(tag)}>
                        {tags.includes(tag) && <Icon name="check" size={14} strokeWidth={2.4} />}
                        {tag}
                      </button>
                    ))}
                  </div>
                </fieldset>
                {errors.tags
                  ? <p id="fm-create-tags-error" className="fm-field__error" role="alert">{errors.tags}</p>
                  : <p className="fm-field__hint">Pick at least one. Tags decide where your post shows up in the feed filters.</p>}
              </section>

              {/* Features */}
              <section className="fm-card fm-create__section" aria-labelledby="fm-create-features">
                <h2 id="fm-create-features" className="fm-create__section-title"><span>3</span>Features <span className="fm-create__optional">Optional</span></h2>
                <p className="fm-create__note">
                  <Icon name="info" size={18} />
                  <span>Everyone you add gets a request. The post goes live once they&apos;ve all accepted.</span>
                </p>
                <UserPicker
                  label="Who's on this track?"
                  exclude={currentUser ? [currentUser.userName] : []}
                  selected={features.map((u) => u.userName)}
                  onPick={toggleFeature}
                />
                {features.length > 0 && (
                  <ul className="fm-person-chips" aria-label="Featured artists">
                    {features.map((user) => (
                      <li key={user.userName} className="fm-person-chip">
                        <img src={user.profilePic || DEFAULT_AVATAR} alt="" />
                        {user.userName}
                        <button type="button" onClick={() => toggleFeature(user)} aria-label={`Remove ${user.userName}`}>
                          <Icon name="close" size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Downloads */}
              <section className="fm-card fm-create__section" aria-labelledby="fm-create-downloads">
                <h2 id="fm-create-downloads" className="fm-create__section-title"><span>4</span>Downloads</h2>
                <label className="fm-create__switch">
                  <input type="checkbox" role="switch" checked={freeDownload} onChange={(e) => setFreeDownload(e.target.checked)} />
                  <span className="fm-create__switch-track" aria-hidden="true" />
                  <span className="fm-create__switch-text">
                    <span className="fm-create__switch-title">Free download</span>
                    <span className="fm-create__muted">Let anyone download this track from the player.</span>
                  </span>
                </label>
              </section>
            </div>

            {/* Preview + publish */}
            <aside className="fm-create__rail" aria-label="Preview and publish">
              <div className="fm-create__sticky">
                <p className="fm-create__rail-label">Preview</p>
                <article className="fm-card fm-create__preview" aria-label="How your post will look">
                  <div className="fm-create__preview-cover" style={bannerStyle(currentUser || {})}>
                    {freeDownload && <span className="fm-pill fm-pill--accent">Free download</span>}
                  </div>
                  <div className="fm-create__preview-body">
                    <div className="fm-create__preview-by">
                      <img src={currentUser?.profilePic || DEFAULT_AVATAR} alt="" />
                      <span>{currentUser?.userName || "You"}</span>
                      {isPlus && <PlusBadge size={16} />}
                      <span className="fm-create__muted">· Just now</span>
                    </div>
                    <h3 className={`fm-create__preview-title${title.trim() ? "" : " is-placeholder"}`}>{title.trim() || "Your track title"}</h3>
                    {features.length > 0 && (
                      <p className="fm-create__preview-feat">feat. {features.map((u) => u.userName).join(", ")}</p>
                    )}
                    {description.trim() && <p className="fm-create__preview-desc">{description.trim()}</p>}
                    {tags.length > 0 && (
                      <div className="fm-create__preview-tags">
                        {[...typeTags, ...genreTags].map((tag) => <span key={tag} className="fm-tag">{tag}</span>)}
                      </div>
                    )}
                  </div>
                </article>

                <div className="fm-create__publish">
                  {missing.length > 0 && !submitting && (
                    <ul className="fm-create__todo" aria-label="Still needed">
                      {missing.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  )}
                  {features.length > 0 && missing.length === 0 && !submitting && (
                    <p className="fm-create__muted">
                      This goes live after {features.length === 1 ? features[0].userName : `all ${features.length} featured artists`} accept{features.length === 1 ? "s" : ""}.
                    </p>
                  )}
                  {submitError && <p className="fm-field__error" role="alert">{submitError}</p>}
                  <button type="submit" className="fm-btn fm-btn--primary fm-create__submit" disabled={submitting}>
                    {submitting
                      ? (progress < 100 ? `Uploading… ${progress}%` : "Finishing up…")
                      : (features.length > 0 ? "Post and send requests" : "Publish")}
                  </button>
                  {submitting && (
                    <div className="fm-create__progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Upload progress">
                      <span style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

export default CreatePost;
