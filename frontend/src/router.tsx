/*
 * The route table: which screen (page component) each address shows. The
 * full map of the app's routes is in docs/01-ui-design.md 1.3; only the
 * built ones are here, and each feature adds its own (comments below mark
 * where). Routing explained: docs/04-frontend.md 4.5.
 *
 * Routes nest: AppLayout is the parent of the pages, so it is drawn around
 * every one of them, and the page itself appears where AppLayout puts
 * <Outlet />. A child with `index: true` is the parent's own address ('/').
 * A `path` without a leading '/' is relative to the parent: 'plans' → /plans.
 */
import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { ExercisesPage } from '@/pages/ExercisesPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlansPage } from '@/pages/PlansPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ProgressPage } from '@/pages/ProgressPage'
import { RouteErrorPage } from '@/pages/RouteErrorPage'

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
  // Public routes, without the app's frame, go here: /login, /register,
  // /forgot-password (FEAT-1), the shared plan /s/:token (phase 2).

  {
    // The signed-in app: every page inside the frame (navigation + content).
    // A route with no `path` only adds its layout around its children.
    // Sign-in will guard this branch (FEAT-1).
    element: <AppLayout />,
    // Drawn instead of a page that crashes while rendering
    errorElement: <RouteErrorPage />,
    // The pages drawn inside AppLayout's <Outlet />
    children: [
      { index: true, element: <HomePage /> },
      // Each section's sub-pages (/plans/:id, /plans/:id/edit…) join here
      // with their features (FEAT-2, UI-1, FEAT-4); ':id' is a parameter,
      // read in the page with React Router's useParams()
      { path: 'plans', element: <PlansPage /> },
      { path: 'exercises', element: <ExercisesPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'profile', element: <ProfilePage /> },
      // Anything else ('*' matches every address): "page not found",
      // still inside the frame
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // Workout mode (/session/:id), full screen outside the frame, goes here (FEAT-3).
])
