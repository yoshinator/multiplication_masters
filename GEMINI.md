# Multiplication Masters - Coding Assistant Context

## Project Overview
**Multiplication Masters** (aka Math Builders) is a time-driven hybrid SRS (Spaced Repetition System) application for mastering multiplication facts up to 24×24. The project combines Leitner and SM-2 algorithms to build reflex-level recall through an adaptive spaced-repetition engine that responds to both accuracy and response speed.

## Tech Stack

### Frontend
- **Build Tool**: Vite 7.x
- **Framework**: React 19.x with React Compiler optimization
- **Language**: TypeScript 5.9.x (strict mode)
- **UI Framework**: Material UI (MUI) v7
- **Routing**: React Router v7
- **Animation**: Framer Motion
- **Canvas/Graphics**: Konva & React-Konva
- **State Management**: React Context API
- **Data Structures**: datastructures-js (priority queues for SRS)
- **Onboarding**: Driver.js for guided tours

### Backend
- **Platform**: Firebase 12.x
- **Database**: Firestore
- **Authentication**: Firebase Auth (Anonymous, Google, Email Link)
- **Cloud Functions**: Node.js 24 with TypeScript
- **Storage**: Firebase Storage (for scene builder images)

### Development Tools
- **Linting**: ESLint 9.x with TypeScript ESLint
- **Formatting**: Prettier 3.x
- **Type Checking**: TypeScript strict mode

## Repository Structure

```
.
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React Context providers for state
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Top-level route components
│   ├── constants/        # Type definitions & constants
│   ├── utilities/        # Helper functions
│   ├── theme/            # MUI theme configuration
│   ├── App.tsx           # Main app with routing
│   └── main.tsx          # Entry point with provider wrapping
├── functions/
│   └── src/              # Firebase Cloud Functions
├── public/
│   └── assets/           # Static images and assets
├── firebase.json         # Firebase configuration
├── firestore.rules       # Firestore security rules
├── storage.rules         # Storage security rules
└── vite.config.ts        # Vite build configuration
```

## Key Scripts

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "emulators": "npm --prefix functions run build && firebase emulators:start --import=./firebase-data --export-on-exit --project multiplicationmaster"
}
```

## Architecture Overview

### Application Entry Point
**File**: `src/main.tsx`

The application uses a nested provider pattern for state management:

```
StrictMode
└── BrowserRouter
    └── FirebaseProvider
        └── ThemeContextProvider
            └── NotificationProvider
                └── UserProvider
                    └── ModalProvider
                        └── SessionStatusProvider
                            └── ReviewSessionProvider
                                └── CardSchedulerProvider
                                    └── App (with routing)
```

### Routing Structure
**File**: `src/App.tsx` & `src/constants/routeConstants.ts`

Routes:
- `/` - HomePage (landing page)
- `/train` - PracticePage (main practice interface) - requires auth
- `/stats` - StatsPage (analytics dashboard) - requires auth
- `/profile` - ProfilePage (user settings) - requires auth
- `/builder` - SceneBuilderPage (scene customization) - requires auth
- `/finish-signin` - FinishSignin (email link authentication handler)
- `/privacy` - PrivacyPolicyPage
- `/terms` - TermsOfServicePage
- `/coppa` - CoppaPage
- `/ferpa` - FerpaPage

**Layout note**: `Footer` is intentionally shown only on Home + legal routes.

Protected routes use the `RequireUser` component wrapper.

## Frontend Structure (`src/`)

### Components (`src/components/`)
Organized by feature, key components include:

- **AppModal** - Generic modal wrapper for dialogs
- **CardLoadingSkeleton** - Loading state for flash cards
- **DailyGoalPanel** - Daily learning goals and progress tracking
- **FeedbackButton/FeedbackModal** - User feedback collection system
- **FinishSignin** - OAuth authentication completion handler
- **Header** - Application navigation bar with user menu
- **LevelUpAnimation** - Achievement celebration animations
- **Login** - Sign-in and account upgrade flows:
  - `LoginModal` for Google / email-link / username+PIN sign-in
  - `SaveProgressModal` for upgrading anonymous accounts (requires Terms acceptance)
  - `UsernamePinLogin` for kid-friendly username + 6-digit PIN sign-in
  - `SetPinModal` (opened from Profile) to enable username+PIN sign-in
- **MultiplicationCard** - Flash card interface with timer and zones (correct/incorrect/skip)
- **PackMasteryPanel** - Pack completion progress visualization
- **RequireUser** - Route protection HOC for authenticated users
- **SavedScenesGallery** - Scene builder saved layouts gallery
- **SceneBuilder** - Customizable scene creation system with canvas, controls, and object placement
- **SessionSummary** - Post-session statistics and performance review
- **StatsPanel** - Detailed analytics and performance metrics
- **Timer** - Session countdown timer
- **UserMenu** - User profile and settings dropdown
- **WelcomeBack** - Returning user greeting and session start

### Contexts (`src/contexts/`)
Application-wide state management:

- **firebase** (`firebase/FirebaseProvider.tsx`)
  - Initializes Firebase app, auth, firestore, storage, analytics
  - Manages `userFacts` collection subscription
  - Provides `loadUserFacts()` function

- **userContext** (`userContext/UserProvider.tsx`)
  - User authentication state (`authStatus`: loading | signedOut | signedIn)
  - User document from Firestore
  - Active pack metadata and fact IDs
  - Active scene metadata
  - Functions: `updateUser()`, `incrementSceneXP()`, `selectScene()`

- **cardScheduler** (`cardScheduler/CardSchedulerProvider.tsx`)
  - SRS algorithm implementation (Leitner + SM-2 hybrid)
  - Card queue management with priority queue
  - Functions: `startSession()`, `getNextFact()`, `submitAnswer()`
  - State: `currentFact`, `isQueueEmpty`, `estimatedReviews`, `estimatedUniqueFacts`

- **reviewSession** (`reviewSession/ReviewSessionProvider.tsx`)
  - Session state tracking (correct/incorrect counts)
  - Batched updates to Firestore
  - Functions: `addUpdatedFactToSession()`, `finishSession()`, `showAnswer()`, `hideAnswer()`
  - State: `latestSession`, `pendingUserFacts`, `percentageMastered`, `isSaving`

- **SessionStatusContext** (`SessionStatusContext/SessionStatusProvider.tsx`)
  - Active session status flag
  - Session length configuration
  - State: `isSessionActive`, `sessionLength`

- **timerContext** (`timerContext/TimerProvider.tsx`)
  - Session timer state and controls
  - Functions: `startTimer()`, `stopTimer()`, `resetTimer()`
  - State: `seconds`, `isRunning`

- **modalContext** (`modalContext/ModalProvider.tsx`)
  - Centralized modal state management
  - Functions: `openModal(content)`, `closeModal()`

- **notificationContext** (`notificationContext/NotificationProvider.tsx`)
  - Toast notifications system
  - Function: `showNotification(message, severity)`

- **themeContext** (`themeContext/ThemeContextProvider.tsx`)
  - Dark/light/system theme switching
  - Persists to localStorage

### Hooks (`src/hooks/`)
Custom React hooks for shared logic:

- **useAuthActions** - Authentication operations (anonymous, Google, email link)
- **useCloudFunction** - Generic Firebase Cloud Functions caller with status tracking
- **useDailyReviews** - Calculates daily review count from Firestore
- **useDebouncedCallback** - Performance optimization for rapid events
- **useFirestore** - Firestore query/doc subscription hooks (`useFirestoreQuery`, `useFirestoreDoc`)
- **useIsMobile** - Responsive breakpoint detection (MUI theme-based)
- **useKeyboardOpen** - Mobile keyboard visibility detection (viewport-based)
- **useInactivityLogout** - Signs out after inactivity (used for username+PIN sessions)
- **useLogger** - Conditional console logging utility
- **useSaveProgress** - Handles account upgrade prompts and email linking
- **useThresholdAnimation** - Triggers animations when values cross thresholds (e.g., level up)

### Pages (`src/pages/`)
Top-level route components:

- **HomePage** - Landing page with marketing content and anonymous login
- **PracticePage** - Main training interface with flash cards, timer, stats panel, and guided tours
- **ProfilePage** - User profile, settings, pack selection, and account management
- **SceneBuilderPage** - Scene customization interface with Konva canvas
- **StatsPage** - Comprehensive performance analytics dashboard with lifetime stats
- **PrivacyPolicyPage** - Privacy policy and data handling disclosures
- **TermsOfServicePage** - Terms and acceptable use
- **CoppaPage** - COPPA notice and parent guidance
- **FerpaPage** - FERPA notice (school/education context)

### Constants (`src/constants/`)
Type definitions and configuration:

- **appConstants.ts** - Session lengths, mastery thresholds, XP values, daily goal
- **dataModels.ts** - TypeScript interfaces:
  - `User` - User document schema
  - `UserFact` - Individual fact card schema (includes SRS fields: box, nextDueTime, avgResponseTime, etc.)
  - `SessionRecord` - Session history document schema
  - `PackMeta` - Pack metadata (e.g., "1-12" or "13-24")
  - `SavedScene` - Scene builder saved layout
  - `Feedback` - User feedback document
- **ModalContext.tsx** - Modal configuration types
- **routeConstants.ts** - Application route paths
- **sceneDefinitions.ts** - Scene themes and object definitions for scene builder

### Utilities (`src/utilities/`)
Helper functions:

- **accountHelpers.ts** - `generateRandomUsername()` for anonymous users
- **debugQueue.ts** - Development debugging for priority queue
- **firebaseHelpers.ts** - `omitUndefined()` for safe Firestore updates
- **stringHelpers.ts** - `capitalizeFirstLetter()`
- **typeutils.ts** - `extractErrorMessage()`, `noop()`, `FieldValueAllowed<T>` type

### Theme (`src/theme/`)
- **theme.ts** - MUI theme configuration (light and dark variants)

## Backend Structure (`functions/`)

### Cloud Functions (`functions/src/`)
Node.js 24 TypeScript Cloud Functions:

- **index.ts** - Main exports file
- User initialization functions
- Fact provisioning and deck generation
- Data migration utilities
- Scheduled functions (if applicable)
- Username+PIN auth callables (custom-token minting + PIN setup + lockout reset)

User initialization is server-side:
- `initializeUserOnAuthCreate` (Firebase Auth onCreate) creates `users/{uid}` with default fields and an assigned username.
- The client (`UserProvider`) subscribes to `users/{uid}` and does not seed/overwrite user docs.

**Package**: `functions/package.json`
```json
{
  "engines": { "node": "24" },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^7.0.3"
  }
}
```

## Data Models

### User Document (`users/{uid}`)
```typescript
type SignInMethod = 'anonymous' | 'google' | 'emailLink' | 'usernamePin'

interface User {
  id: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  username?: string
  createdAt: number
  lastLogin: number
  lastSignInMethod?: SignInMethod
  totalSessions: number
  totalCorrect: number
  totalIncorrect: number
  dailyGoal: number
  userDefaultSessionLength: number
  showTour: boolean
  upgradePromptSnoozedUntil?: Timestamp
  hasUsernamePin?: boolean
  usernameSetByUser?: boolean
  activePack: string // e.g., "1-12"
  activeScene?: SceneTheme
  sceneXP: number
  // ... other fields
}
```

### UserFact Document (`users/{uid}/Facts/{factId}`)
```typescript
interface UserFact {
  id: string
  expression: string // e.g., "3 × 4"
  answer: number
  box: number // Leitner box (0-5)
  nextDueTime: number // timestamp
  lastReviewed: number | null
  avgResponseTime: number | null
  seen: number
  correct: number
  incorrect: number
  table: 12 | 24 // which table set
  group: number // 1-3 tables per block
  difficulty: 'easy' | 'medium' | 'hard'
  isPrimary: boolean // vs mirrored
  easeFactor: number // SM-2 ease factor
  interval: number // SM-2 interval in days
}
```

### SessionRecord Document (`users/{uid}/Sessions/{sessionId}`)
```typescript
interface SessionRecord {
  id: string
  startedAt: number
  endedAt: number
  correct: number
  incorrect: number
  sessionLength: number
  sessionType: 'multiplication' | 'division' | 'mixed'
  factUpdates: Array<{
    factId: string
    boxChange: number
    wasCorrect: boolean
    responseTime: number
  }>
}
```

## Key Features and Workflows

### SRS Algorithm (Hybrid Leitner + SM-2)
**Location**: `src/contexts/cardScheduler/`

1. **Card Selection**:
   - Priority queue sorts facts by `nextDueTime`
   - Only selects cards from active pack
   - Filters due cards (nextDueTime <= now)

2. **Answer Submission**:
   - Correct answer:
     - Fast response (< 3s): advance 2 boxes
     - Normal response: advance 1 box
     - Update SM-2 ease factor
   - Incorrect answer:
     - Demote to box 1 (or box 0 if never seen)
     - Reset SM-2 interval

3. **Box Intervals**:
   - Box 0: immediate (new cards)
   - Box 1: 1 day
   - Box 2: 3 days
   - Box 3: 7 days
   - Box 4+: SM-2 algorithm (mastered)

### Session Flow
1. User clicks "Start Session" on `WelcomeBack` component
2. `CardScheduler.startSession()` loads facts and builds queue
3. `SessionStatusContext` sets `isSessionActive = true`
4. Timer starts countdown from `sessionLength`
5. User answers cards via `MultiplicationCard` component
6. Each answer calls `submitAnswer()` → updates fact → adds to pending batch
7. Timer expires or user stops → `ReviewSession.finishSession()`
8. Batch writes all pending updates to Firestore
9. `SessionSummary` component displays results
10. New `SessionRecord` created in Firestore

### Authentication Flow
- **Anonymous**: `loginAnonymously()` → auto-generates username
- **Google**: `loginWithGoogle()` or `linkGoogleAccount()` for upgrading
- **Email Link**: `sendLoginLink()` → user clicks link → `FinishSignin` page handles sign-in
- **Username + PIN**:
  - Sign-in: callable `signInWithUsernamePin` validates username + 6-digit PIN, enforces lockout (5 attempts → 1 hour), and returns a Firebase custom token.
  - Enablement: callable `setUsernamePin` stores bcrypt hash server-side and marks `hasUsernamePin` / `usernameSetByUser` on the user doc.
  - Eligibility: PIN enablement is only allowed after signing in via Google or email-link (not during anonymous upgrade).
  - Lockout reset: callable `resetUsernamePinLockout` is invoked after successful Google/email-link sign-in.

**Security note**: The username index and PIN hashes live in server-only collections (`usernameIndex`, `userSecrets`) and are blocked from client access in `firestore.rules`.

### Pack System
Users can select packs (e.g., "1-12" or "13-24") from `ProfilePage`. Active pack determines which facts are loaded into the card scheduler.

### Scene Builder
Users can customize practice session backgrounds using Konva canvas. Scenes are saved to Firebase Storage and metadata stored in Firestore.

## Development Best Practices

### Code Style
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use `type` over `interface` for simple shapes
- Extract reusable logic into custom hooks
- Keep components focused and single-purpose

### State Management
- Use Context for global state
- Use local state for component-specific UI
- Avoid prop drilling - lift state to nearest common ancestor
- Batch Firestore writes for performance

### Firebase
- Always check for null/undefined before using Firebase services
- Use `omitUndefined()` before Firestore `updateDoc()`
- Unsubscribe from snapshots in cleanup
- Use `useFirestoreQuery`/`useFirestoreDoc` for reactive data

### Error Handling
- Use `extractErrorMessage()` to normalize errors
- Show user-friendly notifications via `useNotification()`
- Log errors with `useLogger()` for debugging
- Catch and handle Firebase auth errors gracefully

### Performance
- Use `useMemo` and `useCallback` for expensive computations
- Debounce rapid user input with `useDebouncedCallback`
- Lazy load components where appropriate
- Batch Firestore writes (see `ReviewSession`)
- In `useInactivityLogout`, the `onTimeout` callback is stored in a ref to avoid resubscribing listeners/timers on every render while still calling the latest callback.

## Common Patterns

### Accessing Contexts
```typescript
import { useUser } from '../contexts/userContext/useUserContext'

const { user, updateUser } = useUser()
```

### Firestore Queries
```typescript
import { useFirestoreQuery } from '../hooks/useFirestore'
import { collection, query, where } from 'firebase/firestore'

const q = useMemo(() => {
  if (!db || !userId) return null
  return query(
    collection(db, 'users', userId, 'Sessions'),
    where('endedAt', '>=', startOfDay.getTime())
  )
}, [db, userId])

const { data: sessions, loading, error } = useFirestoreQuery<SessionRecord>(q)
```

### Updating User
```typescript
import { useUser } from '../contexts/userContext/useUserContext'

const { updateUser } = useUser()

await updateUser({ dailyGoal: 50 })
```

### Opening Modals
```typescript
import { useModal } from '../contexts/modalContext/modalContext'

const { openModal, closeModal } = useModal()

openModal(<MyCustomComponent onClose={closeModal} />)
```

### Showing Notifications
```typescript
import { useNotification } from '../contexts/notificationContext/notificationContext'

const { showNotification } = useNotification()

showNotification('Settings saved!', 'success')
showNotification('An error occurred', 'error')
```

## Testing & Local Development

### Firebase Emulators
```bash
npm run emulators
```
Starts Firestore, Auth, Functions, and Storage emulators with data import/export.

### Development Server
```bash
npm run dev
```
Runs Vite dev server on `http://localhost:5173`

## Critical Files to Know

- **`src/main.tsx`** - Application entry and provider setup
- **`src/App.tsx`** - Routing configuration
- **`src/contexts/cardScheduler/useCardScheduler.ts`** - SRS algorithm implementation
- **`src/contexts/reviewSession/ReviewSessionProvider.tsx`** - Session state and batched writes
- **`src/contexts/userContext/UserProvider.tsx`** - User authentication and profile
- **`src/contexts/firebase/FirebaseProvider.tsx`** - Firebase initialization
- **`src/constants/dataModels.ts`** - All TypeScript interfaces
- **`src/constants/appConstants.ts`** - App-wide configuration values
- **`firestore.rules`** - Security rules for Firestore
- **`functions/src/index.ts`** - Cloud Functions entry

## Known Issues & Gotchas

1. **Safari Keyboard Detection**: `useKeyboardOpen` uses a workaround because Safari doesn't fully support visualViewport API
2. **Queue Mutation**: Do NOT mutate the priority queue in `CardScheduler` - always use immutable operations
3. **Firestore Batch Writes**: Limited to 500 operations - sessions are designed to stay under this limit
4. **Anonymous Users**: Must prompt to upgrade after N days to prevent data loss
5. **Scene Builder**: Images must be optimized before upload to avoid storage costs

## Future Enhancements (Work Remaining)

- Enhanced SRS features (configurable intervals, custom difficulty)
- Advanced analytics (learning curves, time-of-day insights)
- Division mode (already stubbed in session types)
- Multiplayer/competitive modes
- Mobile app (React Native)
- Production deployment hardening (rate limiting, abuse prevention)

---

**Last Updated**: 2026-02-05
**Repository**: [yoshinator/multiplication_masters](https://github.com/yoshinator/multiplication_masters)