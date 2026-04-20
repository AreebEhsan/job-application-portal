import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
    <div className="min-h-screen flex flex-col text-gray-100 relative overflow-x-hidden">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="blob blob-delay-0 absolute w-[700px] h-[700px] rounded-full bg-violet-600/12 blur-[130px] -top-40 -left-40" />
        <div className="blob blob-delay-3 absolute w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] bottom-[-120px] right-[-80px]" />
        <div className="blob blob-delay-6 absolute w-[450px] h-[450px] rounded-full bg-purple-700/8 blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <Navbar />

      <motion.main
        key="main"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 pt-24 pb-12 relative z-10"
      >
        <Outlet />
      </motion.main>
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
