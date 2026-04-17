import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Home from '@/pages/Home'
import SignIn from '@/pages/auth/SignIn'
import SignUp from '@/pages/auth/SignUp'
import SelectRole from '@/pages/auth/SelectRole'
import JobList from '@/pages/jobs/JobList'
import JobDetail from '@/pages/jobs/JobDetail'
import PostJob from '@/pages/jobs/PostJob'
import ApplicantDashboard from '@/pages/applicant/ApplicantDashboard'
import EditProfile from '@/pages/applicant/EditProfile'
import ApplicantProfileSetup from '@/pages/applicant/ApplicantProfileSetup'
import CompanyDashboard from '@/pages/company/CompanyDashboard'
import Analytics from '@/pages/company/Analytics'
import JobApplicants from '@/pages/company/JobApplicants'
import ProtectedRoute from '@/routes/ProtectedRoute'
import RoleGuard from '@/routes/RoleGuard'
import ApplicantProfileGuard from '@/routes/ApplicantProfileGuard'

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-800 to-slate-900 text-gray-100">
      <Navbar />
      <main className="flex-1 pt-24 pb-8">
        <Outlet />
      </main>
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
      {
        path: '/select-role',
        element: (
          <ProtectedRoute>
            <SelectRole />
          </ProtectedRoute>
        ),
      },

      // Public jobs
      { path: '/jobs', element: <JobList /> },
      { path: '/jobs/:id', element: <JobDetail /> },

      // Applicant area
      { path: '/applicant', element: <Navigate to="/applicant/dashboard" replace /> },
      {
        path: '/applicant/dashboard',
        element: (
          <RoleGuard allow={['applicant']}>
            <ApplicantProfileGuard>
              <ApplicantDashboard />
            </ApplicantProfileGuard>
          </RoleGuard>
        ),
      },
      {
        path: '/applicant/profile',
        element: (
          <RoleGuard allow={['applicant']}>
            <ApplicantProfileGuard>
              <EditProfile />
            </ApplicantProfileGuard>
          </RoleGuard>
        ),
      },
      {
        path: '/applicant/profile-setup',
        element: (
          <RoleGuard allow={['applicant']}>
            <ApplicantProfileSetup />
          </RoleGuard>
        ),
      },

      // Recruiter area
      { path: '/company', element: <Navigate to="/company/dashboard" replace /> },
      {
        path: '/company/dashboard',
        element: (
          <RoleGuard allow={['recruiter']}>
            <CompanyDashboard />
          </RoleGuard>
        ),
      },
      {
        path: '/company/post',
        element: (
          <RoleGuard allow={['recruiter']}>
            <PostJob />
          </RoleGuard>
        ),
      },
      {
        path: '/company/analytics',
        element: (
          <RoleGuard allow={['recruiter']}>
            <Analytics />
          </RoleGuard>
        ),
      },
      {
        path: '/company/jobs/:jobId/applicants',
        element: (
          <RoleGuard allow={['recruiter']}>
            <JobApplicants />
          </RoleGuard>
        ),
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
