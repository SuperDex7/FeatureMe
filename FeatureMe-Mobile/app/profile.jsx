// Redirect to main app with profile tab for current user
import MainApp from './main-app';

export default function ProfileScreen() {
  return <MainApp initialTab="profile" />;
}
