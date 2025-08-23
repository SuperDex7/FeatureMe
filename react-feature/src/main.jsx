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
import ProtectedRoute from './Components/ProtectedRoute.jsx'

const router = createBrowserRouter([
  {path: '/', element: <App />},
  {path: 'home', element: <ProtectedRoute><Homepage /></ProtectedRoute>},
  {path: 'feed', element: <ProtectedRoute><Feed /></ProtectedRoute>},
  {path: 'profile', element: <ProtectedRoute><Profile /></ProtectedRoute>},
  {path: 'signup', element: <SignupPage />},
  {path: 'login', element: <LoginPage />},
  {path: 'create-post', element: <ProtectedRoute><CreatePost /></ProtectedRoute>},
  {path: 'profiles', element: <ProtectedRoute><ProfilesPage /></ProtectedRoute>},
  {path: "/profile/:username", element: <ProtectedRoute><Profile /></ProtectedRoute>},
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
