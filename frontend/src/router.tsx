/*
 * The route table: which screen (page component) each address shows. The
 * full map of the app's routes is in docs/design/D1-ui.md D1.3; only the
 * built ones are here, and each feature adds its own (comments below mark
 * where). Routing explained: docs/concepts/C1-frontend.md C1.5.
 *
 * Routes nest: AppLayout is the parent of the pages, so it is drawn around
 * every one of them, and the page itself appears where AppLayout puts
 * <Outlet />. A child with `index: true` is the parent's own address ('/').
 * A `path` without a leading '/' is relative to the parent: 'plans' → /plans.
 *
 * The two branches are each wrapped in a guard, a parent route that decides
 * whether its children may open (src/routes/, docs/concepts/C1-frontend.md C1.13).
 */
import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { ExerciseDetailPage } from '@/pages/ExerciseDetailPage'
import { ExerciseEditorPage } from '@/pages/ExerciseEditorPage'
import { ExercisesPage } from '@/pages/ExercisesPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
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
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireGuest } from '@/routes/RequireGuest'

/**
 * The router: reads the address bar, picks the matching route, and changes
 * the screen when a link is followed, without reloading the page (the
 * browser's History API). Given to <RouterProvider> in src/App.tsx.
 *
 * It is built from an array (`[ … ]`) of route objects (`{ key: value }`).
 * `element: <AppLayout />` is JSX stored in a property: the component to
 * draw for that route. That is why this file is .tsx, not .ts.
 * `export const`: a constant (never reassigned) that other files can import.
 */
export const router = createBrowserRouter([
  // The shared plan /s/:token (phase 2), public for everyone, goes here.

  {
    // The sign-in screens: only for visitors, full screen, without the app's
    // frame. A route with no `path` only adds its element around its children
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
    // The signed-in app: only for signed-in users. Nesting decides the order:
    // the guard first, then the frame (navigation + content), then the page
    element: <RequireAuth />,
    // Drawn instead of a page that crashes while rendering
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppLayout />,
        // The pages drawn inside AppLayout's <Outlet />
        children: [
          { index: true, element: <HomePage /> },
          // The plans (D1.4.6–D1.4.8). ':id' is a parameter, read in the
          // page with React Router's useParams(); 'plans/new' wins over
          // ':id' by itself, as for the exercises
          { path: 'plans', element: <PlansPage /> },
          { path: 'plans/new', element: <PlanEditorPage /> },
          { path: 'plans/:id', element: <PlanDetailPage /> },
          { path: 'plans/:id/edit', element: <PlanEditorPage /> },
          // The exercise library (D1.4.3–D1.4.5). 'exercises/new' is listed
          // before ':id' only for the reader: React Router ranks a fixed
          // segment above a parameter by itself, so /exercises/new never
          // reaches the details page with id "new"
          { path: 'exercises', element: <ExercisesPage /> },
          { path: 'exercises/new', element: <ExerciseEditorPage /> },
          { path: 'exercises/:id', element: <ExerciseDetailPage /> },
          { path: 'exercises/:id/edit', element: <ExerciseEditorPage /> },
          { path: 'progress', element: <ProgressPage /> },
          { path: 'profile', element: <ProfilePage /> },
          // Anything else ('*' matches every address): "page not found",
          // still inside the frame
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },

  // Workout mode (/session/:id), full screen outside the frame, goes here (FEAT-3).
])
