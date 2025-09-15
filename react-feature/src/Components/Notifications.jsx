import './Notifications.css';


function Notifications({ notifications = {id, userName, noti, time, notiType},  className = ''}) {
  const handleNotificationClick = (notification) => {
    if (notification.notiType === 'CHAT' && notification.id) {
      // Redirect to messages page for chat notifications
      window.location.href = '/messages';
    }
  };

  return (
    <ul className={`notifications-list ${className}`}>
      {notifications.map(n => (
        <li 
          key={n.time} 
          className={`notification-item ${n.notiType === 'CHAT' ? 'chat-notification' : ''}`}
          onClick={() => handleNotificationClick(n)}
          style={{ cursor: n.notiType === 'CHAT' ? 'pointer' : 'default' }}
        >
          <span className="notification-text">
            <a href={`/profile/${n.userName}`}><span className="notification-user"><strong>{n.userName}</strong></span></a> 
            {n.notiType === 'POST' && n.id !== null ? (
              <a href={`/post/${n.id}`}>{n.noti}</a>
            ) : n.notiType === 'CHAT' ? (
              <span className="chat-notification-text">{n.noti}</span>
            ) : n.noti}
            
          </span>
          <span className="notification-time">{new Date(n.time).toLocaleDateString()}</span>
        </li>
      ))}
    </ul>
  );
}
export default Notifications;