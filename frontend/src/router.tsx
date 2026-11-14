/*
 * The app's routes. Each branch sits behind a guard (src/routes/).
 */
import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { ExerciseDetailPage } from '@/pages/ExerciseDetailPage'
import { ExerciseEditorPage } from '@/pages/ExerciseEditorPage'
import { ExercisesPage } from '@/pages/ExercisesPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { HistoryDetailPage } from '@/pages/HistoryDetailPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlanDetailPage } from '@/pages/PlanDetailPage'
import { PlanEditorPage } from '@/pages/PlanEditorPage'
import { PlansPage } from '@/pages/PlansPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ProgressPage } from '@/pages/ProgressPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import { SummaryPage } from '@/pages/SummaryPage'
import { WorkoutPage } from '@/pages/WorkoutPage'
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireGuest } from '@/routes/RequireGuest'

export const router = createBrowserRouter([
  // The shared plan /s/:token (phase 2), public for everyone, goes here.

  {
    // Visitors only, full screen, without the app's frame
    element: <RequireGuest />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },

  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'plans', element: <PlansPage /> },
          { path: 'plans/new', element: <PlanEditorPage /> },
          { path: 'plans/:id', element: <PlanDetailPage /> },
          { path: 'plans/:id/edit', element: <PlanEditorPage /> },
          // A fixed segment outranks a parameter, so /exercises/new never
          // reaches the details page
          { path: 'exercises', element: <ExercisesPage /> },
          { path: 'exercises/new', element: <ExerciseEditorPage /> },
          { path: 'exercises/:id', element: <ExerciseDetailPage /> },
          { path: 'exercises/:id/edit', element: <ExerciseEditorPage /> },
          // History under /progress, so the Progress tab stays lit
          { path: 'progress', element: <ProgressPage /> },
          { path: 'progress/history', element: <HistoryPage /> },
          { path: 'progress/history/:id', element: <HistoryDetailPage /> },
          // The summary inside the frame, since the workout is over
          { path: 'session/:id/summary', element: <SummaryPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      // Workout mode: full screen, outside the frame
      { path: 'session/:id', element: <WorkoutPage /> },
    ],
  },

])
