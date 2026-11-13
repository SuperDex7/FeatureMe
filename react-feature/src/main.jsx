import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './Styling/tokens.css'
import './Styling/utilities.css'
import './Styling/components.css'
import './index.css'
import App from './App.jsx'
import Feed from './Pages/Feed.jsx'
import Profile from './Pages/Profile.jsx'
import Homepage2 from './Pages/Homepage2.jsx'
import CreatePost from './Pages/CreatePost.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {createBrowserRouter, RouterProvider} from 'react-router-dom'
import SignupPage from './Pages/SignupPage.jsx'
import LoginPage from './Pages/LoginPage.jsx'
import ForgotPasswordPage from './Pages/ForgotPasswordPage.jsx'
import ProtectedRoute from './Components/ProtectedRoute.jsx'
import SessionExpiredDialog from './Components/SessionExpiredDialog.jsx'
import AppShell from './Components/AppShell.jsx'
import Trending from './Pages/Trending.jsx'
import Post from './Pages/Post.jsx'
import PendingFeatures from './Components/PendingFeatures.jsx'
import MessagesPage from './Pages/MessagesPage.jsx'
import SubscriptionPage from './Pages/SubscriptionPage.jsx'
import UserSearch from './Pages/UserSearch.jsx'
import PrivacyPage from './Pages/PrivacyPage.jsx'

const router = createBrowserRouter([
  {
    // Shared wrapper: in-app link navigation, fresh page per address, scroll reset
    element: <AppShell />,
    children: [
      {path: '/', element: <App />},
      {path: 'home', element: <ProtectedRoute><Homepage2 /></ProtectedRoute>},
      {path: 'feed', element: <ProtectedRoute><Feed /></ProtectedRoute>},
      {path: 'trending', element: <ProtectedRoute><Trending /></ProtectedRoute>},
      {path: "/profile/:username", element: <ProtectedRoute><Profile/></ProtectedRoute>},
      {path: 'signup', element: <SignupPage />},
      {path: 'login', element: <LoginPage />},
      {path: 'forgot-password', element: <ForgotPasswordPage />},
      {path: 'privacy-policy', element: <PrivacyPage />},
      {path: 'create-post', element: <ProtectedRoute><CreatePost /></ProtectedRoute>},
      {path: "/post/:id", element: <Post/>},
      {path: 'pending-features', element: <ProtectedRoute><PendingFeatures /></ProtectedRoute>},
      {path: 'messages', element: <ProtectedRoute><MessagesPage /></ProtectedRoute>},
      {path: 'subscription', element: <ProtectedRoute><SubscriptionPage /></ProtectedRoute>},
      {path: 'user-search', element: <ProtectedRoute><UserSearch /></ProtectedRoute>},
      {path: '*', element: <h1>404</h1>}
    ],
  },
])
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}/>
        <SessionExpiredDialog router={router}/>
    </QueryClientProvider>
  </StrictMode>,
);
