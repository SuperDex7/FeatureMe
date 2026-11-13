import Icon from "./ui/Icon";
import "./Notifications.css";

function when(timestamp) {
  if (!timestamp) return "";
  const hours = Math.floor((Date.now() - new Date(timestamp)) / 36e5);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h`;
  if (hours < 24 * 7) return `${Math.floor(hours / 24)}d`;
  return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
}

// A list of notifications. With onDelete, each row gets a dismiss button.
function Notifications({ notifications = [], className = "", onDelete }) {
  return (
    <ul className={`notifications-list ${className}`}>
      {notifications.map((n, index) => {
        const isSystem = !n.userName || n.userName === "System";
        let text = n.noti;
        if (n.notiType === "POST" && n.id) text = <a href={`/post/${n.id}`}>{n.noti}</a>;
        else if (n.notiType === "CHAT") text = <a href="/messages">{n.noti}</a>;
        return (
          <li key={n.notificationId || `${n.time}-${index}`} className="notification-item">
            <span className="notification-text">
              {!isSystem && (
                <a href={`/profile/${n.userName}`} className="notification-user"><strong>{n.userName}</strong></a>
              )}
              {text}
            </span>
            <span className="notification-meta">
              <time className="notification-time" dateTime={n.time} title={n.time ? new Date(n.time).toLocaleString() : undefined}>{when(n.time)}</time>
              {onDelete && n.notificationId && (
                <button
                  type="button"
                  className="notification-dismiss"
                  onClick={() => onDelete(n.notificationId)}
                  aria-label="Dismiss notification"
                  title="Dismiss"
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default Notifications;
