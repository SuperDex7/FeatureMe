import { useEffect, useState } from 'react';
import { UserRelationsService } from '../services/UserService';
import './FriendSuggestions.css';

const DEFAULT_AVATAR = '/dpp.jpg';

// "Artists to follow" card on the home page. Hidden when there's nothing to suggest.
function FriendSuggestions({ limit = 5 }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    let cancelled = false;
    UserRelationsService.getFriendSuggestions(limit)
      .then((response) => { if (!cancelled) setSuggestions(response.data || []); })
      .catch((err) => console.error('Error loading friend suggestions:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [limit]);

  const follow = async (userName) => {
    setPending(userName);
    try {
      await UserRelationsService.toggleFollow(userName);
      setSuggestions((prev) => prev.filter((user) => user.userName !== userName));
    } catch (err) {
      console.error('Error following user:', err);
    } finally {
      setPending(null);
    }
  };

  if (!loading && suggestions.length === 0) return null;

  return (
    <section className="fm-card fm-suggestions" aria-labelledby="fm-suggestions-title">
      <h2 id="fm-suggestions-title" className="fm-suggestions__title">Artists to follow</h2>
      {loading ? (
        <p className="fm-suggestions__muted" role="status">Loading suggestions…</p>
      ) : (
        <ul className="fm-suggestions__list">
          {suggestions.map((user) => (
            <li key={user.id || user.userName} className="fm-suggestions__row">
              <a href={`/profile/${user.userName}`} className="fm-suggestions__user">
                <img
                  src={user.profilePic || DEFAULT_AVATAR}
                  alt=""
                  onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                />
                <span>{user.userName}</span>
              </a>
              <button
                type="button"
                className="fm-btn fm-btn--secondary fm-suggestions__follow"
                onClick={() => follow(user.userName)}
                disabled={pending === user.userName}
                aria-label={`Follow ${user.userName}`}
              >
                Follow
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default FriendSuggestions;
