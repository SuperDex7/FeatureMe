import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Feed from './Pages/Feed.jsx'
import Profile from './Pages/Profile.jsx'
import Homepage from './Pages/Homepage.jsx'
import CreatePost from './Pages/CreatePost.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {createBrowserRouter, RouterProvider} from 'react-router-dom'
import ProfilesPage from './Pages/ProfilesPage.jsx'
import SignupPage from './Pages/SignupPage.jsx'
import LoginPage from './Pages/LoginPage.jsx'
import ForgotPasswordPage from './Pages/ForgotPasswordPage.jsx'
import ProtectedRoute from './Components/ProtectedRoute.jsx'
import Post from './Pages/Post.jsx'
import PendingFeatures from './Components/PendingFeatures.jsx'
import MessagesPage from './Pages/MessagesPage.jsx'
import SubscriptionPage from './Pages/SubscriptionPage.jsx'
import UserSearch from './Pages/UserSearch.jsx'

const router = createBrowserRouter([
  {path: '/', element: <App />},
  {path: 'home', element: <ProtectedRoute><Homepage /></ProtectedRoute>},
  {path: 'feed', element: <ProtectedRoute><Feed /></ProtectedRoute>},
  {path: 'profile', element: <ProtectedRoute><Profile /></ProtectedRoute>},
  {path: 'signup', element: <SignupPage />},
  {path: 'login', element: <LoginPage />},
  {path: 'forgot-password', element: <ForgotPasswordPage />},
  {path: 'create-post', element: <ProtectedRoute><CreatePost /></ProtectedRoute>},
  {path: 'profiles', element: <ProtectedRoute><ProfilesPage /></ProtectedRoute>},
  {path: "/profile/:username", element: <ProtectedRoute><Profile /></ProtectedRoute>},
  {path: "/post/:id", element: <Post/>},
  {path: 'pending-features', element: <ProtectedRoute><PendingFeatures /></ProtectedRoute>},
  {path: 'messages', element: <ProtectedRoute><MessagesPage /></ProtectedRoute>},
  {path: 'subscription', element: <ProtectedRoute><SubscriptionPage /></ProtectedRoute>},
  {path: 'user-search', element: <ProtectedRoute><UserSearch /></ProtectedRoute>},
  {path: '*', element: <h1>404</h1>}
])
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}/>
    </QueryClientProvider>
  </StrictMode>,
);
