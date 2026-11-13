import { useEffect, useId, useState } from 'react';
import Icon from './Icon';
import api from '../../services/AuthService';

const DEFAULT_AVATAR = '/dpp.jpg';

const showDefaultAvatar = (event) => {
  if (!event.currentTarget.src.endsWith(DEFAULT_AVATAR)) event.currentTarget.src = DEFAULT_AVATAR;
};

// Search artists by username and pick them. With `selected`, results toggle
// (checkmark when picked); without it, each result shows `actionLabel` and
// calls onPick once. Styles: .fm-search-field, .fm-people, .fm-person in components.css.
function UserPicker({ label, exclude, selected, onPick, actionLabel }) {
  const inputId = useId();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = term.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/user/get/search/${encodeURIComponent(q)}?page=0&size=20`);
        if (!cancelled) setResults(data.content || []);
      } catch (err) {
        console.error('Error searching users:', err);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  const visible = results.filter((user) => !exclude.includes(user.userName));

  return (
    <div className="fm-field">
      <label className="fm-field__label" htmlFor={inputId}>{label}</label>
      <div className="fm-search-field">
        <Icon name="search" size={18} />
        <input
          id={inputId}
          type="search"
          className="fm-input"
          placeholder="Search by username"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoComplete="off"
          data-autofocus
        />
        {searching && <span className="fm-mini-spinner fm-search-field__spinner" aria-label="Searching" />}
      </div>
      {term.trim() && !searching && visible.length === 0 && (
        <p className="fm-field__hint">No artists found for &ldquo;{term.trim()}&rdquo;.</p>
      )}
      {visible.length > 0 && (
        <ul className="fm-people">
          {visible.map((user) => {
            const isSelected = selected?.includes(user.userName);
            return (
              <li key={user.userName}>
                <button
                  type="button"
                  className={`fm-person${isSelected ? ' is-selected' : ''}`}
                  onClick={() => onPick(user)}
                  aria-pressed={selected ? isSelected : undefined}
                >
                  <img src={user.profilePic || DEFAULT_AVATAR} alt="" onError={showDefaultAvatar} />
                  <span className="fm-person__text">
                    <span className="fm-person__name">{user.userName}</span>
                    {user.bio && <span className="fm-person__bio">{user.bio}</span>}
                  </span>
                  <span className="fm-person__action" aria-hidden="true">
                    {selected
                      ? (isSelected ? <Icon name="check" size={18} strokeWidth={2.4} /> : <Icon name="plus" size={18} />)
                      : actionLabel}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default UserPicker;
