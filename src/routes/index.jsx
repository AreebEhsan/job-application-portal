import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Home from '@/pages/Home'
import SignIn from '@/pages/auth/SignIn'
import SignUp from '@/pages/auth/SignUp'
import JobList from '@/pages/jobs/JobList'
import JobDetail from '@/pages/jobs/JobDetail'
import PostJob from '@/pages/jobs/PostJob'
import ApplicantDashboard from '@/pages/applicant/ApplicantDashboard'
import EditProfile from '@/pages/applicant/EditProfile'
import CompanyDashboard from '@/pages/company/CompanyDashboard'
import Analytics from '@/pages/company/Analytics'
import ProtectedRoute from '@/routes/ProtectedRoute'

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/signin', element: <SignIn /> },
      { path: '/signup', element: <SignUp /> },
      { path: '/jobs', element: <JobList /> },
      { path: '/jobs/:id', element: <JobDetail /> },
      {
        path: '/applicant',
        element: (
          <ProtectedRoute>
            <ApplicantDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/applicant/profile',
        element: (
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/company',
        element: (
          <ProtectedRoute>
            <CompanyDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/company/post',
        element: (
          <ProtectedRoute>
            <PostJob />
          </ProtectedRoute>
        ),
      },
      {
        path: '/company/analytics',
        element: (
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        ),
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
