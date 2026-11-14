/*
 * The side margins of workout mode, shared by its four parts: the top bar, the
 * exercise, the rest timer, Previous and Next. One list of classes, so the four
 * parts line up.
 *
 * - `px-5 sm:px-8 lg:px-12`: the side margins of the app's other pages
 *   (AppLayout): 20 px on a phone, 32 px from 640 px, 48 px from 1024 px;
 * - no maximum width: on a laptop the screen uses the whole window, wide and
 *   easy to tap, as a full-screen app does. (A centred column of 672 px was
 *   tried, and made the laptop view cramped.)
 */

export const WORKOUT_COLUMN = 'w-full px-5 sm:px-8 lg:px-12'
