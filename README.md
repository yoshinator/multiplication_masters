# Multiplication Masters

A time-driven hybrid SRS (Spaced Repetition System) combining Leitner and SM-2 algorithms for mastering multiplication facts up to 24×24, with complementary division, addition, and subtraction packs. This project builds reflex-level recall using a custom spaced-repetition engine that adapts to both accuracy and response speed, providing an engaging and effective learning experience for students.

## Overview

Multiplication Masters is a modern web application designed to help students master multiplication facts through an adaptive learning system. Built with React and TypeScript, it combines proven spaced-repetition techniques with gamification elements, real-time feedback, and personalized learning paths. The application includes a customizable scene builder, performance analytics, and Firebase-backed cloud storage for seamless cross-device learning.

## Language Composition

- **TypeScript**: 99.4%
- **Other**: 0.6%

---

## Tech Stack

### Frontend
- **Build Tool**: Vite 7.x
- **Framework**: React 19.x
- **Language**: TypeScript 5.9.x
- **UI Framework**: Material UI (MUI) v7
- **Routing**: React Router v7
- **Animation**: Framer Motion
- **Canvas/Graphics**: Konva & React-Konva
- **State Management**: React Context API

### Backend
- **Platform**: Firebase 12.x
- **Database**: Firestore
- **Authentication**: Firebase Auth
- **Cloud Functions**: Node.js 24 with TypeScript
- **Storage**: Firebase Storage

### Development Tools
- **Linting**: ESLint 9.x with TypeScript ESLint
- **Formatting**: Prettier 3.x
- **Type Checking**: TypeScript strict mode
- **Compiler Optimization**: Babel React Compiler

---

## Repository Structure

```
.
├── src/                    # Frontend source code
├── functions/              # Firebase Cloud Functions (backend)
├── public/                 # Static assets
├── .github/                # GitHub workflows and configurations
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
├── storage.rules           # Firebase Storage security rules
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Frontend dependencies and scripts
```

---

## Key Scripts

### Frontend (Root)
- **`npm run dev`** - Start development server with hot module replacement
- **`npm run build`** - Build for production (TypeScript compilation + Vite build)
- **`npm run lint`** - Run ESLint on the codebase
- **`npm run preview`** - Preview production build locally
- **`npm run emulators`** - Start Firebase emulators with data import/export

### Backend (functions/)
- **`npm run build`** - Compile TypeScript Cloud Functions
- **`npm run build:watch`** - Watch mode for function development
- **`npm run deploy`** - Deploy Cloud Functions to Firebase
- **`npm run serve`** - Run functions locally with emulators

## Frontend Structure (`src/`)

### Components (`src/components/`)
Reusable UI components organized by feature:

- **AppModal** - Generic modal wrapper for dialogs
- **CardLoadingSkeleton** - Loading state for flash cards
- **DailyGoalPanel** - Daily learning goals and progress tracking
- **FeedbackButton/FeedbackModal** - User feedback collection system
- **FinishSignin** - Email-link authentication completion handler
- **Header** - Application navigation bar
- **LevelUpAnimation** - Achievement celebration animations
- **Login** - Sign-in and account upgrade flows:
  - Google sign-in
  - Email-link sign-in
  - Username + 6-digit PIN sign-in (if enabled)
  - Anonymous users can upgrade via the Save Progress modal (requires Terms acceptance)
- **FactCard** - Flash card interface with timer and zones (multiplication, division, addition, subtraction)
- **OnboardingModal** - Required first-login questionnaire (role + grade defaults)
- **PanelCard** - Reusable responsive panel shell (shared layout for dashboard-style panels like DailyGoalPanel and SceneXPDisplay)
- **PackMasteryPanel** - Pack completion progress visualization
- **RequireUser** - Route protection for authenticated users
- **SavedScenesGallery** - Scene builder saved layouts gallery
- **SceneBuilder** - Customizable scene creation system with canvas, controls, and object placement
- **SessionSummary** - Post-session statistics and performance review
- **StatsPanel** - Detailed analytics and performance metrics
- **Timer** - Session countdown timer
- **UserMenu** - User profile and settings dropdown
- **WelcomeBack** - Returning user greeting

### Contexts (`src/contexts/`)
Application-wide state management using React Context:

- **cardScheduler** - SRS algorithm implementation and card queue management
- **firebase** - Firebase initialization and service configuration
- **modalContext** - Centralized modal state management
- **notificationContext** - Toast notifications and alerts
- **reviewSession** - Session state tracking and card updates
- **SessionStatusContext** - Active session status and metadata
- **themeContext** - Dark/light mode theme switching
- **timerContext** - Session timer state and controls
- **userContext** - User authentication and profile data

### Hooks (`src/hooks/`)
Custom React hooks for shared logic:

- **useAuthActions** - Authentication operations (login, logout)
- **useCloudFunction** - Firebase Cloud Functions caller
- **useDailyReviews** - Daily card provisioning and quota management
- **useDebouncedCallback** - Performance optimization for rapid events
- **useFirestore** - Firestore query helpers
- **useIsMobile** - Responsive breakpoint detection
- **useKeyboardOpen** - Mobile keyboard visibility detection
- **useInactivityLogout** - Inactivity timeout handler (used to auto-logout username+PIN sessions)
- **useLogger** - Error logging and debugging utilities
- **useSaveProgress** - Session data persistence
- **useThresholdAnimation** - Triggers a temporary animation flag when a value crosses a threshold (supports gating via `enabled` / `resetOnEnable` to avoid firing during initial data hydration)

### Pages (`src/pages/`)
Top-level route components:

- **HomePage** - Landing page with call-to-action
- **PracticePage** - Main training interface with flash cards
- **ProfilePage** - User profile and settings management
- **SceneBuilderPage** - Scene customization interface
- **StatsPage** - Comprehensive performance analytics dashboard
- **PrivacyPolicyPage** - Privacy policy
- **TermsOfServicePage** - Terms of service
- **CoppaPage** - COPPA notice
- **FerpaPage** - FERPA notice

### Constants (`src/constants/`)
Type definitions and configuration:

- **appConstants.ts** - Application-wide constants and settings
- **dataModels.ts** - TypeScript interfaces for User, UserCard, UserFact, SessionRecord, and Feedback
- **ModalContext.tsx** - Modal configuration and types
- **routeConstants.ts** - Application route definitions
- **sceneDefinitions.ts** - Scene themes and object definitions

### Utilities (`src/utilities/`)
Helper functions and shared logic:

- **accountHelpers.ts** - User account operations
- **debugQueue.ts** - Development debugging tools
- **firebaseHelpers.ts** - Firebase utility functions
- **stringHelpers.ts** - String manipulation utilities
- **typeutils.ts** - TypeScript type guards and utilities

---

## Backend Structure (`functions/`)

Firebase Cloud Functions for server-side operations built with TypeScript and Node.js 24.

### Cloud Functions (`functions/src/`)

#### `initializeUserOnAuthCreate`
**Trigger**: Firebase Auth `onCreate` event (new auth user)  
**Purpose**: Server-side initialization of `users/{uid}` (replaces client-side seeding)  
**Operations**:
- Creates the `users/{uid}` root document with default fields (role, packs, stats counters, etc.)
- Assigns a generated username
- Sets `createdAt` / `lastLogin`
- Creates default `sceneMeta/garden` document

#### `initializeUserMeta`
**Trigger**: Firestore `onCreate` event for `users/{userId}`  
**Purpose**: Automatically initializes metadata for new users  
**Operations**:
- Creates default scene metadata (garden theme with 0 XP)
- Sets up initial pack configuration (mul_36 and mul_144)
- Marks user as initialized to prevent re-runs

> Note: With `initializeUserOnAuthCreate` in place, `initializeUserMeta` acts as a defensive backstop for older data / edge cases.

#### Username + PIN auth (callables)
- **`signInWithUsernamePin`**: Validates username + 6-digit PIN, enforces lockout (5 failed attempts → 1 hour), and returns a Firebase custom token.
- **`setUsernamePin`**: Enables username+PIN sign-in for an existing account by storing a bcrypt hash server-side and marking `hasUsernamePin`.
  - Eligibility is enforced server-side: the user must have signed in with Google or an email link (anonymous users cannot enable a PIN).
  - The username is taken from the existing `users/{uid}.username` field.
- **`resetUsernamePinLockout`**: Clears temporary lockout state after successful non-PIN sign-in.

#### `provisionFacts`
**Trigger**: HTTPS callable function  
**Purpose**: Provisions new multiplication/division/addition/subtraction facts for users (1-30 facts per call)  
**Operations**:
- Validates user authentication and pack name
- Uses transactions to safely increment fact cursor
- Merges facts with existing user progress (preserves statistics)
- Updates pack metadata (completion status, next cursor position)
- Enforces fact provisioning boundaries

#### `migrateUserToFacts`
**Trigger**: HTTPS callable function  
**Purpose**: Migrates legacy UserCards to new UserFacts data model  
**Operations**:
- Converts old card format (e.g., "3-4") to new fact ID format (e.g., "mul:3:4")
- Preserves all SRS data (box level, response times, accuracy)
- Determines appropriate pack based on highest seen operand
- Sets pack cursor to first missing fact
- Includes rollback logic for safety
- Handles batched writes for large datasets

#### `saveUserScene`
**Trigger**: HTTPS callable function  
**Purpose**: Saves customized scene layouts to user's collection  
**Operations**:
- Validates scene data and thumbnail URL
- Enforces 4-scene storage limit per user
- Validates thumbnail path matches user's storage location
- Supports both new scene creation and updates
- Includes security checks for emulator vs production environments

### Data Models (`functions/src/masterCards.ts`)
- **MASTER_FACTS** - Pre-generated fact databases for mul_36, mul_144, mul_576, div_144, add_20, and sub_20 packs
- **PackMeta** - Pack metadata interface (progress tracking)
- **UserFact** - Individual fact data model with SRS fields

---

## Key Features and Use Cases

### Core Learning System
- **Adaptive Spaced Repetition**: Hybrid Leitner + SM-2 algorithm that schedules cards based on performance
- **Speed-Based Promotion**: Cards advance based on both accuracy and response time
  - ≤3 seconds: Promote one box level
  - 3-5 seconds: Stay in current box
  - >5 seconds: Demote two box levels
  - Incorrect: Reset to box 1
- **Intelligent Session Building**: Dynamic session creation from due cards, active learning cards (box ≤ 3), and new unseen cards
- **Progress Persistence**: Batched Firestore writes optimize performance while maintaining data integrity

### Practice Modes
- **Timed Sessions**: 15, 30, or 45-card sessions with countdown timer
- **Multiple Packs**: Support for 6×6 (mul_36), 12×12 (mul_144), and 24×24 (mul_576) fact packs
- **Daily Provisioning**: Controlled introduction of new facts (5-30 per day) to prevent cognitive overload
- **Mixed Practice**: Randomized card order prevents pattern recognition

### Gamification
- **Scene Builder**: Customizable learning environment with unlockable themes and objects
- **XP System**: Earn experience points tied to specific scenes
- **Level Progression**: Visual feedback for mastery thresholds and pack advancement
- **Achievement Celebrations**: Animations for level-ups and milestones

### Analytics and Tracking
- **Session Statistics**: Real-time accuracy, response times, and box movements
- **Performance Dashboard**: 
  - Overall accuracy across all facts
  - Pack-specific performance metrics
  - Weakest facts identification
  - Response time analysis (fast/slow/timeout breakdown)
- **Historical Data**: All sessions stored in Firestore with detailed breakdowns by table
- **Progress Visualization**: Charts and cards showing mastery progress

### User Experience
- **Responsive Design**: Optimized for both mobile and desktop with MUI breakpoints
- **Dark/Light Themes**: User-preference theme switching
- **Real-Time Feedback**: Color-coded zones (green/yellow/red) based on response speed
- **Offline Preparation**: Firebase emulator support for offline development
- **Authentication**:
  - Anonymous sessions for quick start
  - Google sign-in
  - Email-link sign-in
  - Optional username + 6-digit PIN sign-in (enabled from Profile after Google/email-link sign-in)
  - Username+PIN sessions auto-logout after 5 minutes of inactivity

### Educational Use Cases
- **Individual Learning**: Self-paced fact mastery for students
- **Classroom Integration**: Teachers can deploy for student practice
- **Homeschool Curriculum**: Structured learning path from basics (1-6) to advanced (1-24)
- **Remedial Support**: Targeted practice on weakest multiplication facts
- **Benchmark Preparation**: Build automaticity for standardized test success

---

## Summary

Multiplication Masters combines a speed-adaptive Leitner system with SM-2 scheduling to create a highly effective multiplication fact trainer. The project includes:
- Complete session scheduler with intelligent card selection
- Session update pipeline with batched writes for performance
- Cloud Functions for user initialization, fact provisioning, and data migration
- Customizable scene builder with persistent storage
- Comprehensive analytics dashboard
- Responsive UI with real-time feedback
- Firebase-backed authentication and data persistence

The architecture separates concerns between frontend (React/TypeScript) and backend (Firebase Cloud Functions), enabling scalable, maintainable development. Remaining work focuses on UI polish, advanced analytics, enhanced SRS features, and production deployment hardening.

---

## What Has Been Completed

### Core Application Structure
- React + TypeScript + Vite project successfully initialized.
- Project configuration set up with ESLint, Prettier, and TypeScript settings.
- Base component and modular file structure established.

### Multiplication Deck and Card Model
- Full deck generation logic for all expressions from 1×1 through 24×24.
- Card schema defined, including:
  - box
  - nextDueTime
  - lastReviewed
  - avgResponseTime
  - seen
  - correct
  - incorrect
  - table (12 or 24 mode)
  - group (1–3 tables per block)
  - difficulty classification
- Support for mirrored card relationships (primary vs mirrored variants).

### Firebase Integration
- Firebase project integrated for backend data storage.
- Card metadata and user progress states prepared for persistence.
- Frontend hooks and service structure in place for ongoing Firebase communication.
- Firebase seeding utility added for development use (window.seedCards).
- Repository reviewed to ensure no sensitive keys (service accounts) are committed.
- Added logic to hydrate a user's personal card collection by copying from the master deck.

### UI Foundations
- Initial flash card interface implemented.
- Input handling, reaction timer, and feedback logic operational.
- Core logic for answer evaluation and SRS routing functional.
- Add better error states, loading screens, and improved input feedback using MUI theme colors.
- Improve UI presentation, animations, and responsiveness.
- Add level progression interface 

### Spaced Repetition Engine (SRS)
- Speed-Adaptive Leitner + SM-2 hybrid logic defined.
- Reaction-time based card movement:
  - 3 seconds or less: promote one box.
  - between 3–5 seconds: remain in current box.
  - Over 5 seconds: demote two boxes.
  - Incorrect answer: reset to box 1.
- Timestamp-based scheduling via nextDueTime.
- Priority queue implemented to surface the correct next card.
- Full session scheduler implemented:
  - Sessions can have 15, 30 or 45 cards.
  - Session built from all due cards first, then active learning cards (box ≤ 3), then unseen cards (seen = 0).
  - Only cards with box ≤ 3 are requeued during the session.
  - Cards moved to box ≥ 4 are removed from the active queue for the rest of the session.
  - Add mastery thresholds and unlocking workflow for advancing activeGroup.
  - Add queue shuffling to avoid pattern recognition in session.

### Review Session Context
- ReviewSessionContext created to accumulate all updated cards during a session.
- Tracks correct and incorrect counts per session and totals.
- Updated cards stored in memory until flush.
- Auto flush when session reaches 5 cards
- Batched write implemented using Firestore writeBatch.
- flushUpdates persists:
  - All updated UserCards
  - User’s session-level and lifetime correct and incorrect totals
- clearUpdates resets session state after persistence.
- Add session-level statistics (session length, cards reviewed, accuracy).

### Gamification
- Add a scene builder so users can customize a scene with unlocked items.

### Routing
- Add routes for Profile, Homepage, Training, Scene Builder.

### User Authentication
- Firebase Auth supports Anonymous, Google, and Email-link sign-in.
- Username + PIN is implemented via Cloud Functions minting Firebase custom tokens.
- PIN setup is only allowed from Profile after a user has authenticated via Google or email-link.
- PIN security controls:
  - 6-digit numeric PIN
  - Server-side bcrypt hashing (no plaintext PIN stored)
  - 5 failed attempts triggers a 1-hour lockout
  - Lockout is reset after successful Google/email-link sign-in
- App behavior: username+PIN sessions auto-logout after 5 minutes of inactivity.

Legal & compliance routes:
- `/privacy`, `/terms`, `/coppa`, `/ferpa`
- The `Footer` is intentionally shown only on Home + legal pages.


---

## Work Remaining

### Frontend and User Experience
-(show locked/unlocked tables).
- Add unlocking mechanisms for Scene items. (Currently hard coded for garden theme)
- Build performance dashboard (accuracy, response times, weakest facts).
  - Show total accuracy across all cards.
  - Show group accuracy for the highest times table group you're in (1–3, 4–6, etc.).
  - Reset all stats if user wants to start fresh.
- Add practice modes (timed drill, review-only, mixed tables).
- Make Scene Builder item picker display item images instead of labels.
- Replace temporary Home Page with proper copy and CTAs.

- Implement offline-first caching with IndexedDB or localStorage.

### Backend and Data Logic
- Finalize and document Firebase data schema.
- Add secure Firebase rules to isolate user data.
- Add data export/import feature for portability.
- Add Scene Builder saves and unlocked items to data store.

### SRS Improvements
- Add mirror card activation logic (unlock mirrored versions after mastery).
- Implement weighting for mirrored cards if needed.
- Add decay logic for overdue cards (automatic demotion after long inactivity).
- Tune long-range intervals after user testing.
- Add user defined intervals.

### Deployment and Production Readiness
- Add build pipeline for production deployment.
- Set up CI for linting, type checks, and test running.
- Add screenshots, GIF demos, and installation instructions.
- Add proper licensing.

### User Sign Up and Auth
- (Optional) Add email/password signup (currently uses email-link).
- (Optional) Add additional providers / account management UX.
- Add Parent / Teacher - Dashboard

### Security and Privacy
- Audit repository for any exposed sensitive keys.
- Privacy Policy, Terms, COPPA, and FERPA pages are implemented and linked from the UI.
- Firestore rules isolate user data and block client access to sensitive auth collections (`usernameIndex`, `userSecrets`).

## Legal Pages
The app includes in-app legal pages for Privacy, Terms, COPPA, and FERPA. These are accessible from the `Footer` and are routed under `/privacy`, `/terms`, `/coppa`, and `/ferpa`.



---

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Firebase account (for backend services)
- Firebase CLI installed globally: `npm install -g firebase-tools`

### Installation

1. **Clone the repository**  
   ```bash
   git clone https://github.com/yoshinator/multiplication_masters.git
   cd multiplication_masters
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Install function dependencies** (for local development)  
   ```bash
   cd functions
   npm install
   cd ..
   ```

4. **Configure environment variables**  
   Create a `.env.local` file in the root directory with your Firebase configuration:
   
   ```shell
   VITE_FIREBASE_API_KEY=yourFirebaseApiKey
   VITE_FIREBASE_AUTH_DOMAIN=yourProjectId.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=yourProjectId
   VITE_FIREBASE_STORAGE_BUCKET=yourProjectId.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=yourSenderId
   VITE_FIREBASE_APP_ID=yourAppId
   ```
   
   Use `.env.template` as a reference for required variables.

### Development

#### Running the Frontend
Start the Vite development server with hot module replacement:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

#### Running with Firebase Emulators
For full-stack local development including Cloud Functions:
```bash
npm run emulators
```
This starts:
- Firestore Emulator (port 8080)
- Cloud Functions Emulator (port 5001)
- Firebase UI (port 4000)
- Authentication Emulator (port 9099)

Data is automatically imported from `./firebase-data` and exported on exit.

#### Initial Database Setup
In development mode, the Firebase instance and seeding utilities are attached to the window object:

1. Start the development server or emulators
2. Open the browser console
3. Run: `window.seedCards()`

This initializes the master facts collection. See `src/contexts/firebase/FirebaseProvider.tsx` for implementation details.

### Building for Production

1. **Type-check and build the frontend**:
   ```bash
   npm run build
   ```
   Output will be in the `dist/` directory

2. **Build Cloud Functions**:
   ```bash
   cd functions
   npm run build
   cd ..
   ```

3. **Preview the production build locally**:
   ```bash
   npm run preview
   ```

### Deployment

#### Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

#### Deploy Cloud Functions
```bash
firebase deploy --only functions
```

#### Deploy Everything
```bash
firebase deploy
```

Note: Ensure Firestore security rules (`firestore.rules`) and Storage rules (`storage.rules`) are configured before deploying to production.

---

## License and Terms of Use

This project is licensed under a **Source Available License** (see [LICENSE](LICENSE) for full details).

### What you CAN do:
* **Personal Use:** Download, run, and play with the software for yourself.
* **Modify:** Change the code to add features or fix bugs for your own use.
* **Classroom Use:** If you are a teacher, you can use this with your students in your classroom.

### What you CANNOT do:
* **Commercial Use:** You may not sell this software or use it to make money.
* **Public Re-hosting:** You may not upload this code (modified or original) to your own public website, GitHub, or app store.
* **Third-Party Distribution:** You may not give this software to other schools or organizations. Please direct them to this original repository instead.

**For commercial licensing or questions regarding distribution, please contact:** yoanante@gmail.com