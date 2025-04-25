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


const router = createBrowserRouter([
  {path: '/', element: <App />},
  {path: 'home', element: <Homepage />},
  {path: 'feed', element: <Feed />},
  {path: 'profile/:id', element: <Profile />},
  {path: 'signup', element: <h1>Signup</h1>},
  {path: 'login', element: <h1>Login</h1>},
  {path: 'create-post', element: <CreatePost />},
  {path: 'profiles', element: <ProfilesPage />},
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
