import { useEffect, useRef, useState } from "react";
import { UserRelationsService } from "../services/UserService";
import Dialog from "./ui/Dialog";
import Icon from "./ui/Icon";
import "./ShowFollow.css";

const PAGE_SIZE = 20;
const DEFAULT_AVATAR = "/dpp.jpg";

// Followers / following list for a profile, in a dialog.
function ShowFollow({ userName, isOpen, onClose, type }) {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [query, setQuery] = useState("");
  const requestRef = useRef(0);

  const title = type === "followers" ? "Followers" : "Following";

  const load = async (pageNum) => {
    const requestId = ++requestRef.current;
    setStatus("loading");
    try {
      const response = type === "followers"
        ? await UserRelationsService.getFollowers(userName, pageNum, PAGE_SIZE)
        : await UserRelationsService.getFollowing(userName, pageNum, PAGE_SIZE);
      if (requestId !== requestRef.current) return;
      const data = response.data || {};
      const list = data.content || data.page?.content || [];
      setTotalPages(data.page?.totalPages ?? data.totalPages ?? 0);
      setUsers((prev) => (pageNum === 0 ? list : [...prev, ...list]));
      setPage(pageNum);
      setStatus("ready");
    } catch (err) {
      console.error(`Error loading ${type}:`, err);
      if (requestId === requestRef.current) setStatus("error");
    }
  };

  useEffect(() => {
    if (!isOpen || !userName) return;
    setUsers([]);
    setQuery("");
    load(0);
    // Reload whenever the dialog opens or switches list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, type, userName]);

  const term = query.trim().toLowerCase();
  const shown = term ? users.filter((u) => u.userName?.toLowerCase().includes(term)) : users;
  const hasMore = page < totalPages - 1;

  return (
    <Dialog open={isOpen} onClose={onClose} title={title} size="sm">
      <div className="fm-follows">
        {users.length > 0 && (
          <div className="fm-search-field">
            <Icon name="search" size={18} />
            <input
              type="search"
              className="fm-input"
              placeholder={`Search ${title.toLowerCase()}`}
              aria-label={`Search ${title.toLowerCase()}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-autofocus
            />
          </div>
        )}

        {status === "loading" && users.length === 0 && (
          <div className="fm-state" role="status"><div className="fm-spinner" /></div>
        )}
        {status === "error" && users.length === 0 && (
          <p className="fm-follows__empty">Couldn&apos;t load this list. Try again in a moment.</p>
        )}
        {status === "ready" && users.length === 0 && (
          <p className="fm-follows__empty">
            {type === "followers" ? `No followers yet.` : `Not following anyone yet.`}
          </p>
        )}

        {shown.length > 0 && (
          <ul className="fm-people fm-follows__list">
            {shown.map((user) => (
              <li key={user.id || user.userName}>
                <a href={`/profile/${user.userName}`} className="fm-person" onClick={onClose}>
                  <img src={user.profilePic || DEFAULT_AVATAR} alt="" onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} />
                  <span className="fm-person__text">
                    <span className="fm-person__name">{user.userName}</span>
                    {user.createdAt && (
                      <span className="fm-person__bio">
                        {type === "followers" ? "Followed" : "Following since"} {new Date(user.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                  </span>
                  <Icon name="chevronRight" size={18} className="fm-follows__chevron" />
                </a>
              </li>
            ))}
          </ul>
        )}

        {term && shown.length === 0 && users.length > 0 && (
          <p className="fm-follows__empty">Nobody here matches &ldquo;{query.trim()}&rdquo;{hasMore ? " yet. Load more to search further." : "."}</p>
        )}

        {hasMore && (
          <button type="button" className="fm-btn fm-btn--secondary fm-follows__more" onClick={() => load(page + 1)} disabled={status === "loading"}>
            {status === "loading" ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </Dialog>
  );
}

export default ShowFollow;
