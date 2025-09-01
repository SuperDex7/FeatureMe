import './Notifications.css';


function Notifications({ notifications = {id, userName, noti, time},  className = ''}) {
  return (
    <ul className={`notifications-list ${className}`}>
      {notifications.map(n => (
        <li key={n.time} className="notification-item">
          <span className="notification-text">
            <a href={`/profile/${n.userName}`}><span className="notification-user"><strong>{n.userName}</strong></span></a> 
            {n.id  !== null ? (
              <a href={`/post/${n.id}`}>{n.noti}</a>
            ): n.noti}
            
          </span>
          <span className="notification-time">{new Date(n.time).toLocaleDateString()}</span>
        </li>
      ))}
    </ul>
  );
}
export default Notifications;