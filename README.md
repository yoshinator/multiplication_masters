# Multiplication Masters
A time-driven hybrid SRS (Leitner + SM-2) for mastering multiplication up to 24×24.  
This project builds reflex-level recall using a custom spaced-repetition engine that adapts to both accuracy and response speed.

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

### Spaced Repetition Engine (SRS)
- Speed-Adaptive Leitner + SM-2 hybrid logic defined.
- Reaction-time based card movement:
  - Under 2 seconds: promote one box.
  - 3–4 seconds: remain in current box.
  - Over 4–7 seconds: demote two boxes.
  - Incorrect answer: reset to box 1.
- Timestamp-based scheduling via nextDueTime.
- Priority queue implemented to surface the correct next card.
- Full session scheduler implemented:
  - Sessions capped at 35 cards.
  - Session built from all due cards first, then active learning cards (box ≤ 3), then unseen cards (seen = 0).
  - Only cards with box ≤ 3 are requeued during the session.
  - Cards moved to box ≥ 4 are removed from the active queue for the rest of the session.

### Review Session Context
- ReviewSessionContext created to accumulate all updated cards during a session.
- Tracks correct and incorrect counts per session.
- Updated cards stored in memory until flush.
- Batched write implemented using Firestore writeBatch.
- flushUpdates persists:
  - All updated UserCards
  - User’s session-level correct and incorrect totals
- clearUpdates resets session state after persistence.
- Add session-level statistics (session length, cards reviewed, accuracy).
---

## Work Remaining

### Frontend and User Experience
- Add level progression interface (show locked/unlocked tables).
- Build performance dashboard (accuracy, response times, weakest facts).
  - Show total accuracy across all cards.
  - Show group accuracy for the highest times table group you're in (1–3, 4–6, etc.).
  - Reset all stats if user wants to start fresh.
- Add practice modes (timed drill, review-only, mixed tables).

- Implement offline-first caching with IndexedDB or localStorage.

### Backend and Data Logic
- Finalize and document Firebase data schema.
- Add secure Firebase rules to isolate user data.
- Add data export/import feature for portability.

### SRS Improvements
- Add mirror card activation logic (unlock mirrored versions after mastery).
- Implement weighting for mirrored cards if needed.
- Add decay logic for overdue cards (automatic demotion after long inactivity).
- Tune long-range intervals after user testing.
- Add mastery thresholds and unlocking workflow for advancing activeGroup.

### Deployment and Production Readiness
- Add build pipeline for production deployment.
- Set up CI for linting, type checks, and test running.
- Add screenshots, GIF demos, and installation instructions.
- Add proper licensing.

### User Sign Up and Auth
- Add email/password signup.
- Add Google sign-in.

### Security and Privacy
- Audit repository for any exposed sensitive keys.
- Add privacy policy and terms of use.
- Ensure compliance with Firebase rules.

---

## Getting Started

1. Clone the repository  
   `git clone https://github.com/yoshinator/multiplication_masters.git`

2. Install dependencies  
   `npm install`

3. Configure environment variables in `.env.local`  
Minimum config required:
```shell
VITE_FIREBASE_API_KEY=yourKey
VITE_FIREBASE_AUTH_DOMAIN=yourDomain
VITE_FIREBASE_PROJECT_ID=yourProject
```

A Firebase instance and seeding utilities attach to the window object in development mode for initializing the master deck.
Run window.seedCards() after configuring Firebase.
See firebaseProvider.tsx for implementation details.

4. Run development server
5. npm run dev

Build for production but I'm still not there. 
npm run build

Summary

Multiplication Masters combines a speed-adaptive Leitner system with SM-2 scheduling to create a highly effective multiplication fact trainer. The project now includes a complete session scheduler, a session update pipeline with batching, and logic to persist card states to Firestore. Remaining tasks involve UI refinement, improved analytics, enhanced SRS logic, and production hardening.