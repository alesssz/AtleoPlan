# D1. UI design

How AtleoPlan looks and behaves, screen by screen. This is the reference for building the interface: a screen is built as described here, and a change to a screen's behaviour updates this page in the same commit ([P1.3](../project/P1-conventions.md#p13-documentation)). The decisions behind it (stack, languages, media limits, hosting) and their reasons are in [D2. Decisions](D2-decisions.md).

Terms used throughout: a **plan** is a workout plan (in Italian, *scheda*), made of **days** ("Day A – Push"), each holding **plan items** (an exercise with its sets, reps and rest); a **session** is one workout actually done, made of **logged sets**.

---

## D1.1 Overview

AtleoPlan builds workout plans out of a library of exercises, guides the workout while it is done, and logs weights and reps to show progress over time. It starts as a personal project but is multi-user from day one, with sharing and a possible paid version later.

**Users**

| User | What they do | When |
|---|---|---|
| **Athlete** | Trains on their own: builds plans, logs workouts, follows progress | MVP |
| **Visitor** | Opens a shared plan from a link without an account; duplicates it after signing up | Phase 2 |
| **Coach** | Builds plans for others and sees their progress | Phase 3 |
| **Admin** | Manages the public exercise library and the users, in the admin panel ([D1.4.15](#d1415-admin-panel-filament)) | MVP |

**Languages:** Italian, English, Spanish and German from the start ([D2.4](D2-decisions.md#d24-languages)). Every text of the interface comes from translation files; none is written in a component.

**Design principles**

1. **Mobile-first, one hand.** At the gym the phone is used with one hand, often sweaty or with gloves on. Main actions sit in the lower half of the screen; tap targets are at least 48 px.
2. **Workout mode is the heart of the app.** Everything else prepares a workout or looks back at one. That screen must be the fastest and clearest of all.
3. **No typing during a workout.** Last time's values are filled in; a tap confirms a set, a +/− stepper corrects it.
4. **Works offline.** Every workout action is saved on the device first and synced later. The user never waits for the network.
5. **Readable from a distance.** Weight, reps and timer are large enough to read with the phone lying on the bench. Dark theme by default.
6. **Build on desktop, train on mobile.** Editing plans and exercises is comfortable on a large screen too; the editors work well on both.

---

## D1.2 Main user journeys

Five journeys cover the MVP; the third, the workout, is the one to get right first.

**1.2.1 I add an exercise to my library**

1. Exercises → **+** → new exercise form.
2. I enter name, muscle groups, equipment, description.
3. I upload a photo or a short video, or paste a YouTube link.
4. I save: the exercise appears in the library with a **Mine** badge.

**1.2.2 I build a plan**

1. Plans → **New plan** → name and goal (e.g. "Push Pull Legs").
2. I add days ("Day A – Push").
3. In each day, **Add exercises** opens the library in multi-select mode.
4. For each exercise I set sets, reps, rest and target load, and the type of each set (normal, warm-up, drop set, to failure). Two or more exercises can be joined in a superset.
5. I reorder by dragging and save.

**1.2.3 I train following the plan**

1. Home → the active plan's card suggests the day after the last one done ("Suggested: Day 2 · last time you did Day 1"); I start it, or tap another day.
2. One exercise at a time, with last time's values filled in.
3. One tap completes a set; the rest timer starts.
4. I can skip, swap or add an exercise on the fly.
5. At the end, a summary: duration, volume, records broken.

**1.2.4 I check my progress**

1. Progress → weekly overview (sessions, volume, recent records).
2. I pick an exercise → chart of its estimated one-rep max and its session history.

**1.2.5 I share a plan**

1. Plan details → **Share** → a read-only link.
2. Whoever opens it sees the plan with its exercises and their media.
3. **Duplicate to my plans** gives them their own independent copy (an account is needed).

---

## D1.3 Information architecture and navigation

Five tabs at the bottom on phones (a sidebar on desktop): **Home · Plans · Exercises · Progress · Profile**. Workout mode is a full-screen view outside the tabs; the shared plan page is public and needs no sign-in; the admin panel is a separate area for admins only.

```
Public (no sign-in)
├── Sign in / Sign up / Forgot password
└── Shared plan ────────────────────────────→ Duplicate (needs an account)

App (signed in)
├── Onboarding (first sign-in only)
├── [Tab] Home
│   ├── Start suggested day / pick a day ──→ Workout mode ──→ Summary
│   └── Resume the session in progress
├── [Tab] Plans
│   ├── New plan ──→ Plan editor
│   └── Plan details
│       ├── Edit ──→ Plan editor ──→ Library (select mode)
│       ├── Share (sheet)
│       └── Start this day ──→ Workout mode
├── [Tab] Exercises
│   ├── New exercise ──→ Exercise editor
│   └── Exercise details
│       ├── Edit / Duplicate as mine ──→ Exercise editor
│       └── Add to plan
├── [Tab] Progress
│   ├── Overview
│   ├── By exercise
│   ├── Records
│   └── History ──→ Session details
└── [Tab] Profile
    └── Settings · Language · Export data · Delete account

Admin (admins only, Filament)
└── Exercises · Translations · Media · Users
```

**Routes (React Router)**

| Route | Screen |
|---|---|
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Sign-in ([D1.4.1](#d141-sign-in-and-onboarding)) |
| `/s/:token` | Shared plan, public ([D1.4.13](#d1413-sharing)) |
| `/onboarding` | Onboarding ([D1.4.1](#d141-sign-in-and-onboarding)) |
| `/` | Home ([D1.4.2](#d142-home)) |
| `/plans`, `/plans/new`, `/plans/:id`, `/plans/:id/edit` | Plans ([D1.4.6](#d146-plan-list)–[D1.4.8](#d148-plan-editor)) |
| `/exercises`, `/exercises/new`, `/exercises/:id`, `/exercises/:id/edit` | Exercises ([D1.4.3](#d143-exercise-library)–[D1.4.5](#d145-exercise-editor)) |
| `/session/:id` | Workout mode, full screen ([D1.4.9](#d149-workout-mode)) |
| `/session/:id/summary` | Summary ([D1.4.10](#d1410-workout-summary)) |
| `/progress`, `/progress/exercises/:id`, `/progress/records` | Progress ([D1.4.12](#d1412-progress)) |
| `/history`, `/history/:sessionId` | History ([D1.4.11](#d1411-history)) |
| `/profile`, `/settings` | Profile and settings ([D1.4.14](#d1414-profile-and-settings)) |
| `/admin/*` | Admin panel, served by Laravel ([D1.4.15](#d1415-admin-panel-filament)) |

---

## D1.4 Screens

Fifteen screens, each with its purpose, content and actions. Workout mode (D1.4.9) also has a wireframe, being the most critical.

### D1.4.1 Sign-in and onboarding

- **Sign in / Sign up:** email and password; signing up also asks for a name and to repeat the password. "Continue with Google" and "Continue with Apple" in phase 2 (Apple is required on the App Store once any social sign-in is offered).
- **Staying signed in:** always on, with no checkbox: a phone at the gym must not ask for a password.
- **Forgot password** by email, in the language of the account: its link opens `/reset-password`, works once, and expires after 60 minutes.
- **Coming back:** after signing in, the user lands on the page they were trying to open.
- **Server unreachable:** "Can't reach the server" and **Try again**, never the sign-in form: the user may well be signed in.
- **Onboarding**, three skippable steps: language (preset from the browser), units (kg/lb), goal (strength, hypertrophy, general fitness), then start from a template plan or from scratch.

### D1.4.2 Home

- **Active plan card** at the top. Only one plan is active at a time ([D2.8](D2-decisions.md#d28-workout-rules)).
  - The **suggested day** stands out: the day after the last one completed, in the plan's order, back to the first after the last ("Suggested: Day 2 · last time you did Day 1"). Number of exercises and estimated duration; a large **Start** button.
  - Under it, a chip for each of the other days: one tap starts that one instead. The suggestion is only a suggestion: the choice is always the user's.
- **Session in progress** banner when a session was left open: Resume or Finish.
- **This week:** a strip of 7 days with the days trained highlighted.
- **Recent records:** the last 3 personal records.
- **Free workout** shortcut (no plan).
- No active plan: the empty state of [D1.6](#d16-states-and-edge-cases).

### D1.4.3 Exercise library

- Search bar fixed at the top; matches names in the user's language and their aliases ("bench" finds "Barbell bench press"; "panca" finds "Panca piana con bilanciere").
- **Filter chips:** muscle group, equipment, source (All / Mine / Public).
- Row: thumbnail, name, main muscle, **Mine** badge for personal exercises.
- **Select mode** (opened from the plan editor): a checkbox on every row and a bar at the bottom, "Add (3)".
- **+** creates an exercise.

### D1.4.4 Exercise details

- **Media at the top:** carousel of photos and videos; videos play muted and looping, a tap opens them full screen.
- Step-by-step instructions, muscles worked (main and secondary), equipment. Tips and common mistakes come later, when there is content for them ([D3.4](D3-data-model.md#d34-exercise-library)).
- **My history** tab: last sessions, best set, estimated one-rep max.
- Actions: **Add to plan**, **Edit** (only for my own exercises), **Duplicate as mine** (for public ones, to customise them).

### D1.4.5 Exercise editor

- Fields: name, description, instructions, main muscle, secondary muscles, equipment, logging type (weight × reps, reps only, time, distance).
- A personal exercise is written in the user's language only; public exercises get every language in the admin panel ([D1.4.15](#d1415-admin-panel-filament)).
- **Media upload:** drag and drop or pick files, progress bar, reorder, choose the cover. The limits are stated next to the field ([D2.5](D2-decisions.md#d25-photos-and-videos)): videos up to 30 s and 100 MB, photos up to 10 MB, at most 2 videos and 5 photos per exercise.
- After upload a video shows "Processing…" until the server has converted it; the exercise can be saved and used meanwhile.
- Alternative **YouTube link** field, with a preview.

### D1.4.6 Plan list

- One card per plan: name, number of days, last used, **Active** and **Shared** badges.
- The active plan is always first.
- **New plan**; a **Templates** section with public plans to duplicate.
- Archived plans behind a filter of their own.

### D1.4.7 Plan details

- Header: name, goal, notes, author (when duplicated from someone else).
- **Days as tabs**; in each day the exercises with sets × reps and rest ("4 × 8–10 · 90 s"), warm-up sets counted apart ("+ 2 warm-up"). Supersets are joined by a coloured bar on the side.
- Actions: **Start this day**, **Set as active** (replaces the current active plan), **Edit**, **Share**, **Duplicate**, **Archive**.

### D1.4.8 Plan editor

- Day tabs: add, rename, reorder, delete.
- Each exercise is a row with a drag handle; a tap expands its parameters: sets, reps (one value or a range, "8-10"), rest, target load or RPE, notes.
- **Set types:** each set of an exercise has a type: **normal**, **warm-up (W)**, **drop set (D)**, **to failure (F)**. The default is normal; a tap on the set's number cycles through the types, and the letter shows next to it.
- **Supersets:** select 2 or more exercises → **Join in superset**.
- **On desktop:** two columns, the library on the left and the plan on the right, dragging from the library into a day.
- The draft is saved automatically; **Discard changes** goes back to the last saved version.

### D1.4.9 Workout mode

Full screen, no tab bar, and the screen stays on (Wake Lock API).

```
┌────────────────────────────────────┐
│ ✕   Day A – Push        32:15  Done│
├────────────────────────────────────┤
│ ●●●○○○  exercise 3 of 6            │
│                                    │
│ [img] Barbell bench press          │
│       4 × 8–10 · rest 90 s         │
│       Note: shoulder blades back   │
│                                    │
│ #    Last     kg     reps     ✓    │
│ W    40×10   [40]   [10]      ✔    │
│ 1    80×8    [80]   [ 8]      ✔    │
│ 2    80×8    [80]   [ 8]      ✔    │
│ 3    80×7    [80]   [ 8]      ○    │
│ F    75×8    [80]   [ 8]      ○    │
│ + Add set                          │
│                                    │
├────────────────────────────────────┤
│ Rest  01:12     −15   +15    Skip  │
├────────────────────────────────────┤
│ ← Previous                  Next → │
└────────────────────────────────────┘
```

- **"Last" column:** what I did in that set last time. The kg and reps fields are filled with the target or with last time's values.
- **Set types:** the first column shows the set's number, or its type letter (W, D, F); a tap changes it here too. **Warm-up sets count neither for volume nor for records.**
- **A tap on ✓** completes the set and starts the rest timer. A tap on a number opens a large stepper (±2.5 kg, ±1 rep; the weight step is a setting).
- **Rest timer:** a bar fixed at the bottom with −15 s, +15 s, Skip. At the end, a vibration and a sound; a notification when the app is in the background.
- **Navigation:** swipe or arrows between exercises; a tap on the dots opens the full list to jump to one.
- **Supersets:** after a set of exercise A the view moves to B by itself; the rest starts only after B.
- **Exercise menu:** swap (with alternatives for the same muscle), skip, add a note, watch the video.
- **Live records:** a set that beats a record shows a **New record** badge.
- Closing with ✕ pauses the session; Home offers to resume it.
- All of this works offline ([D1.6](#d16-states-and-edge-cases)).

### D1.4.10 Workout summary

- Duration, exercises completed, total sets, total volume (in the user's unit), warm-up sets excluded.
- Records broken, highlighted.
- Comparison with the last time the same day was done (+/− volume).
- How did it feel (1–5) and free notes.
- **Save** and **Delete session**.

### D1.4.11 History

- Sessions by date (or a monthly calendar): day, plan, duration, volume.
- **Session details**, editable: fix a wrong weight, add a forgotten set.

### D1.4.12 Progress

- **Overview:** sessions per week, weekly volume per muscle group, streak of consecutive weeks.
- **By exercise:** pick an exercise → chart of the estimated one-rep max over time, best set, volume per session. Periods: 1 month / 3 months / 1 year / all.
- **Records:** personal records per exercise (heaviest weight, estimated one-rep max, most reps at a given weight).
- Phase 2: body weight and measurements, with a chart.

The estimated one-rep max uses the Epley formula, weight × (1 + reps / 30), on normal, drop and to-failure sets ([D2.8](D2-decisions.md#d28-workout-rules)).

### D1.4.13 Sharing

- **Share sheet** (from the bottom): **Link active** switch, Copy link, Share (the phone's own share menu), QR code.
- **Public page:** the plan read-only, with its exercises and media and its author, in the visitor's language when the exercise has it; **Duplicate to my plans**. Without an account: sign up first, then the plan is duplicated automatically.
- The link can be turned off at any time.

### D1.4.14 Profile and settings

- Account details, **Sign out**. Profile picture and change password in phase 2.
- **Language:** Italian, English, Spanish, German, saved on the account with the theme, so both follow the user to other devices. Numbers and dates follow it: `82,5 kg` in Italian, Spanish and German, `82.5 kg` in English.
- Preferences: units kg/lb, default rest, stepper weight step, timer sound and vibration, theme (dark / light / system).
- **Export my data** (JSON or CSV) and **Delete account**: required by the GDPR once the app is public.

### D1.4.15 Admin panel (Filament)

The admin area at `/admin`, served by Laravel with Filament, for admins only. It is not part of the React app and follows Filament's own look.

- **Exercises:** list, search and filters like the library; create, edit and delete public exercises, the ones imported from free-exercise-db included ([D2.3](D2-decisions.md#d23-exercise-library)).
- **Translations:** each public exercise shows its name, description and instructions per language, side by side; a **Machine translated** flag marks the texts not yet reviewed by a person.
- **Media:** photos and videos of public exercises, with their processing status.
- **Users:** list, role (user / admin), disable an account.
- Phase 2: exercises proposed by users for the public library, to approve or reject.

---

## D1.5 Design system

Built on shadcn/ui over Tailwind: colours are CSS variables (tokens), so the dark and light themes only change values. The values below are a starting point; they live in `frontend/src/index.css`, and [C1.8](../concepts/C1-frontend.md#c18-styles-and-theme) maps each token to its Tailwind classes.

**Colours (tokens)**

| Token | Use | Dark (default) | Light |
|---|---|---|---|
| `background` | App background | #0B0B0F | #FFFFFF |
| `surface` | Cards, sheets | #16161D | #F4F4F6 |
| `primary` | Main actions, completed set | #C6F432 (lime) | #5A7A00 |
| `timer` | Rest timer (named `timer`, not `accent`: shadcn/ui's `accent` is the background of hovered items) | #38BDF8 | #0284C7 |
| `success` | Personal record | #22C55E | #15803D |
| `warning` | Offline, sync pending | #F59E0B | #B45309 |
| `destructive` | Delete | #EF4444 | #B91C1C |
| `muted` | Secondary text, "Last" values, warm-up sets | #8A8A99 | #6B6B78 |

**Typography**

- Font: **Inter**; numbers with fixed-width digits (`tabular-nums`), so timers and weights do not jump.
- Scale: 12 / 14 / 16 (body) / 20 / 24 / 32 (headings) / 48 (timer and numbers in workout mode).

**Spacing and shapes**

- 4 px grid; standard spacing 8 / 12 / 16 / 24 / 32.
- Corner radius: 12 px cards, 8 px buttons and inputs, full for chips and badges.
- Tap targets at least 48 × 48 px; 56 px for workout mode's buttons.

**Key components**

| Component | Where | Notes |
|---|---|---|
| `ExerciseListItem` | Library, plan editor | Thumbnail, name, muscle, badge; a variant with a checkbox |
| `ExerciseMedia` | Exercise details, workout mode | Photo / video / YouTube carousel, loaded lazily |
| `MuscleChip` | Filters, details | One colour per muscle group |
| `PlanDayTabs` | Plan details and editor | Scrolling tabs, reorderable while editing |
| `PlanItemRow` | Plan editor | Drag handle, expandable parameters |
| `SetTypeMarker` | Plan editor, workout mode | Set number or W / D / F; a tap cycles the type |
| `SupersetGroup` | Editor, workout mode | Coloured side bar joining the exercises |
| `SuggestedDayCard` | Home | Suggested day highlighted, chips for the other days |
| `SetRow` | Workout mode, session details | Type · Last · kg · reps · ✓ |
| `NumberStepper` | Workout mode | Large number with −/+, configurable step |
| `RestTimer` | Workout mode | Fixed bar, −15 / +15 / Skip, vibration |
| `PRBadge` | Workout mode, summary, progress | Trophy icon + kind of record |
| `ProgressChart` | Progress, exercise details | Line over time, period filters |
| `ShareSheet` | Plan details | Link, QR code, native share |
| `SyncIndicator` | Top bar | Offline state and pending changes |
| `EmptyState` | Every list | Illustration, one sentence, main action; a "Coming soon" badge and a disabled action while the feature is missing |

**Visual style: energetic**

The look of a sports app, chosen over a minimal or a "glass" style: the lime is the star, on a near-black background. The ingredients, and where they live in `frontend/src` ([C1.8](../concepts/C1-frontend.md#c18-styles-and-theme)):

- **Glow.** Soft colour fading into the background behind every page: lime from the top, the timer's blue from the top right (`body` in `index.css`). Lime halos around what matters: the logo, the main button, the current tab (`glow-primary`).
- **Gradient borders.** The important cards have a 1 px border that is lime at the top-left and fades out (`border-glow`), with 24 px corners.
- **Heavy type.** Titles are extra-bold or black, with tight letter spacing. Above each page title sits an **eyebrow**: one or two words in small lime capitals with wide spacing ("TRAINING", or today's date on Home). One word of Home's greeting is painted with a lime gradient (`text-gradient-primary`).
- **Big numbers.** Counters are black-weight with same-width digits (`tabular-nums`).
- **Brand.** A stylised "A" on a lime tile and the wordmark Atleo**Plan** (`components/brand/Brand.tsx`), until a real logo exists (open question in [D1.8](#d18-release-phases-and-open-questions)). The logo sits in the sidebar, or at the top of the page on phones.
- **Navigation.** The current tab sits in a lime "pill" (phones); the current sidebar link has a glowing lime bar on its left edge.
- **Motion, short and optional.** Each page fades in while rising 8 px (300 ms); the server's "connected" dot pulses. Both are switched off with the device's reduced-motion setting ([D1.7](#d17-responsive-layout-and-accessibility)).
- **Main actions** are 48 px tall, bold, and glow when enabled (`Button size="xl"`).

---

## D1.6 States and edge cases

Every screen handles five states: empty, loading, error, offline and syncing.

**Empty states** (a sentence and the main action, never a blank page)

| Screen | Message | Action |
|---|---|---|
| Home without an active plan | "You don't have an active plan yet" | Create a plan · Pick a template |
| Plans | "Create your first plan" | New plan |
| Exercises, "Mine" | "No personal exercises yet" | New exercise |
| Search with no results | "No exercise for «…»" | Create «…» as a new exercise |
| Progress | "Finish your first workout to see your progress" | Start a workout |
| An exercise's history | "You haven't done this exercise yet" | — |

**Loading**

- Skeletons (grey shapes) in place of the content, never a full-page spinner.
- Optimistic updates: completing a set or reordering an exercise updates the screen at once; the server call follows.
- Media: a blurred thumbnail until the full file has loaded.

**Errors**

- Network errors: a toast at the bottom with **Retry**.
- Validation errors: a message under the field, in the user's language ("Add at least one set").
- Failed media upload: the thumbnail stays, with an error icon, **Retry** and **Delete**.
- Shared link turned off or unknown: a page of its own, "This plan is no longer available".

**Offline and sync**

`SyncIndicator` in the top bar has four states:

| State | Looks like | Meaning |
|---|---|---|
| Synced | Nothing shown | Everything is saved on the server |
| Offline | Amber dot + "Offline" | Changes are saved on the phone |
| Pending | "3 changes to send" | The network is back, sending |
| Error | Red dot, tap for details | The server refused a change |

- **Works offline:** all of workout mode; plans and exercises already opened; cached history; the photos of the active plan's exercises (downloaded ahead).
- **Does not work offline** (buttons disabled, with the reason): creating or editing exercises ([D3.2](D3-data-model.md#d32-rules-for-every-table)), uploading media, creating share links, searching the public library beyond the cache.
- **Conflicts:** sessions never conflict (each has a UUID created on the device, [D2.7](D2-decisions.md#d27-offline-and-sync)). For a plan edited on two devices the last change wins, with a warning: "This plan was changed somewhere else".

---

## D1.7 Responsive layout and accessibility

**Breakpoints**

| Width | Layout | Notes |
|---|---|---|
| < 640 px (phone) | Tab bar at the bottom, one column | The reference layout |
| 640–1024 px (tablet) | Compact sidebar with icons | Lists in two columns |
| > 1024 px (desktop) | Sidebar with labels | Plan editor in two columns, Progress as a grid |

- Workout mode always stays one column, centred, at most 480 px wide, desktop included.
- On iPhones, safe areas (notch, home bar) are respected with `env(safe-area-inset-*)`.
- Longer words in German and Spanish: buttons and tabs are checked in every language, and labels wrap or shorten instead of overflowing.

**Accessibility**

- Text contrast at least 4.5:1 (WCAG AA); the lime on the light theme is the one to check.
- Never colour alone: a record is an icon plus text, a completed set a tick plus colour, a set type a letter plus colour.
- Icon-only buttons always have a label (e.g. "Complete set 3"), shown as a tooltip too ([P1.2](../project/P1-conventions.md#p12-code)).
- The rest timer's end is announced to screen readers (`aria-live`).
- Dragging works from the keyboard too (dnd-kit supports it), with Move up / Move down as an alternative.
- `prefers-reduced-motion` is respected: no celebration animation for records when motion is reduced.
- Text scales: the layout holds up to 200% zoom.

---

## D1.8 Release phases and open questions

**Phase 1 — MVP (personal use)**

- Sign-in with email and password
- Exercise library: public (imported, managed in the admin panel) and personal with photos
- Plan list, details and editor, with supersets and set types
- Workout mode with rest timer, last time's values and the suggested day
- Summary and basic history
- Offline workouts
- Four languages

**Phase 2 — Ready for other users**

- Progress charts and personal records
- Video upload
- Sharing by link and Duplicate
- Google and Apple sign-in, onboarding
- Installable PWA, full settings, data export and account deletion
- Exercises proposed by users for the public library

**Phase 3 — Product**

- Coach and athlete profiles, assigned plans
- Body weight and measurements
- Multi-week programming (progression, deload weeks)
- PDF export of a plan
- Expo app for iOS and Android
- Subscription (Stripe through Laravel Cashier)

**Open questions**

- [ ] Logo and visual identity (the lime is a proposal)
- [ ] Show users a "machine translated" note on exercises not yet reviewed, or keep the flag for admins only?
- [ ] Template plans: who writes the first ones, and how many?

---

← [S1. Setup](../start/S1-setup.md) · [Contents](../README.md) · [D2. Decisions](D2-decisions.md) →
