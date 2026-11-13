import { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import AudioPlayer2 from "./AudioPlayer2";
import Dialog from "./ui/Dialog";
import Icon from "./ui/Icon";
import PlusBadge from "./ui/PlusBadge";
import api, { getCurrentUser } from "../services/AuthService";
import { bannerStyle } from "../utils/banner";
import { recordView } from "../utils/views";
import "./PendingFeatures.css";

const DEFAULT_AVATAR = "/dpp.jpg";

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const hours = Math.floor((Date.now() - new Date(timestamp)) / 36e5);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (hours < 24 * 7) return `${Math.floor(hours / 24)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function PeopleLinks({ names }) {
  return names.map((name, index) => (
    <span key={name}>
      {index > 0 && ", "}
      <a href={`/profile/${name}`}>{name}</a>
    </span>
  ));
}

// Requests from other artists to be featured on their posts.
function PendingFeatures() {
  const [requests, setRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [playing, setPlaying] = useState(null);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [declining, setDeclining] = useState(null);

  useEffect(() => {
    Promise.allSettled([api.get("/posts/pending-features"), getCurrentUser()]).then(([pending, user]) => {
      if (user.status === "fulfilled") setCurrentUser(user.value || null);
      if (pending.status === "fulfilled") {
        setRequests(Array.isArray(pending.value.data) ? pending.value.data : []);
        setStatus("ready");
      } else {
        console.error("Error fetching pending requests:", pending.reason);
        setStatus("error");
      }
    });
  }, []);

  const respond = async (request, accept) => {
    setBusy(request.id);
    setNotice(null);
    try {
      await api.post(`/posts/${accept ? "approve" : "reject"}-feature/${request.id}`);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      if (playing === request.id) setPlaying(null);
      setNotice(accept
        ? { tone: "success", text: <>You&apos;re on <a href={`/post/${request.id}`}>{request.title}</a>. It goes live once everyone invited has accepted.</> }
        : { tone: "info", text: <>You declined {request.author?.userName}&apos;s request for &ldquo;{request.title}&rdquo;.</> });
    } catch (err) {
      console.error("Error answering feature request:", err);
      setNotice({ tone: "error", text: "That didn't go through. Try again." });
    } finally {
      setBusy(null);
      setDeclining(null);
    }
  };

  const play = (request) => {
    setPlaying(request.id);
    recordView(request.id, currentUser);
  };

  return (
    <div className="fm-page">
      <Header />

      <main className="fm-page__main">
        <div className="fm-requests">
          <div className="fm-requests__intro">
            <h1 className="fm-requests__title">Feature requests</h1>
            <p className="fm-requests__subtitle">Artists who want you on their tracks. Have a listen, then accept or decline.</p>
          </div>

          {notice && (
            <div className={`fm-requests__notice fm-requests__notice--${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
              <Icon name={notice.tone === "error" ? "info" : "check"} size={18} />
              <span>{notice.text}</span>
              <button type="button" className="fm-icon-btn" onClick={() => setNotice(null)} aria-label="Dismiss"><Icon name="close" size={16} /></button>
            </div>
          )}

          {status === "loading" && (
            <div className="fm-state" role="status"><div className="fm-spinner" /><p>Loading requests…</p></div>
          )}

          {status === "error" && (
            <div className="fm-state" role="alert">
              <h3>Couldn&apos;t load your requests</h3>
              <p>Check your connection and try again.</p>
              <button type="button" className="fm-btn fm-btn--secondary" onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {status === "ready" && requests.length === 0 && (
            <div className="fm-card fm-state fm-requests__empty">
              <span className="fm-requests__empty-icon"><Icon name="userPlus" size={26} /></span>
              <h3>No requests right now</h3>
              <p>When an artist tags you on a post, it shows up here for you to accept.</p>
              <a href="/trending" className="fm-btn fm-btn--secondary">See what&apos;s trending</a>
            </div>
          )}

          {requests.length > 0 && (
            <ul className="fm-requests__list">
              {requests.map((request) => {
                const author = request.author || {};
                const others = (request.pendingFeatures || []).filter((name) => name !== currentUser?.userName);
                const approved = request.features || [];
                const genres = Array.isArray(request.genre) ? request.genre : [];
                const isPlaying = playing === request.id;
                return (
                  <li key={request.id} className="fm-card fm-request">
                    <button
                      type="button"
                      className="fm-request__cover"
                      style={bannerStyle(author)}
                      onClick={() => play(request)}
                      disabled={isPlaying || !request.music}
                      aria-label={`Play ${request.title}`}
                    >
                      <span><Icon name={isPlaying ? "volume" : "play"} size={22} /></span>
                    </button>

                    <div className="fm-request__body">
                      <div className="fm-request__from">
                        <a href={`/profile/${author.userName}`} className="fm-request__author">
                          <img src={author.profilePic || DEFAULT_AVATAR} alt="" />
                          {author.userName}
                        </a>
                        {author.role === "USERPLUS" && <PlusBadge size={16} />}
                        <span className="fm-request__muted">wants you on · {timeAgo(request.time)}</span>
                      </div>

                      <h2 className="fm-request__title"><a href={`/post/${request.id}`}>{request.title}</a></h2>
                      {request.description?.trim() && <p className="fm-request__desc">{request.description}</p>}

                      {genres.length > 0 && (
                        <div className="fm-request__tags">
                          {genres.map((genre) => <span key={genre} className="fm-tag">{genre}</span>)}
                        </div>
                      )}

                      {(approved.length > 0 || others.length > 0) && (
                        <p className="fm-request__people">
                          {approved.length > 0 && <span>Already on it: <PeopleLinks names={approved} /></span>}
                          {others.length > 0 && <span>Also invited: <PeopleLinks names={others} /></span>}
                        </p>
                      )}

                      {isPlaying && (
                        <div className="fm-request__player">
                          <AudioPlayer2 key={request.id} src={request.music} title={request.title} postId={request.id} onClose={() => setPlaying(null)} />
                        </div>
                      )}

                      <div className="fm-request__actions">
                        <button type="button" className="fm-btn fm-btn--primary" onClick={() => respond(request, true)} disabled={busy === request.id}>
                          <Icon name="check" size={18} strokeWidth={2.4} />
                          {busy === request.id ? "Saving…" : "Accept"}
                        </button>
                        <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setDeclining(request)} disabled={busy === request.id}>
                          Decline
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <Footer />

      <Dialog
        open={Boolean(declining)}
        onClose={() => setDeclining(null)}
        closeDisabled={Boolean(busy)}
        title="Decline this request?"
        size="sm"
        footer={(
          <>
            <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setDeclining(null)} disabled={Boolean(busy)}>Cancel</button>
            <button type="button" className="fm-btn fm-btn--danger" onClick={() => respond(declining, false)} disabled={Boolean(busy)}>
              {busy ? "Declining…" : "Decline"}
            </button>
          </>
        )}
      >
        {declining && (
          <p className="fm-requests__dialog-text">
            You won&apos;t be featured on <strong>{declining.title}</strong> by {declining.author?.userName}.
          </p>
        )}
      </Dialog>
    </div>
  );
}

export default PendingFeatures;
