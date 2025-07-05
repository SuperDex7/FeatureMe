import './Notifications.css';
// Dummy notifications array
export const dummyNotifications = [
  { id: 1, user: 'StrongBoy123', action: 'followed you', time: '2m ago' },
  { id: 2, user: 'AK2003', action: 'liked your post', time: '5m ago' },
  { id: 3, user: 'Over9000', action: 'commented on your post', time: '10m ago' },
  { id: 4, user: 'SynthMaster', action: 'shared your track', time: '15m ago' },
  { id: 5, user: 'LoFiCat', action: 'mentioned you', time: '20m ago' },
  { id: 6, user: '808King', action: 'sent you a message', time: '30m ago' },
];

function Notifications({ notifications = dummyNotifications, className = '' }) {
  return (
    <ul className={`notifications-list ${className}`}>
      {notifications.map(n => (
        <li key={n.id} className="notification-item">
          <span className="notification-text">
            <span className="notification-user"><strong>{n.user}</strong></span> {n.action}
          </span>
          <span className="notification-time">{n.time}</span>
        </li>
      ))}
    </ul>
  );
}
export default Notifications;