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
- Basic username login flow implemented.
- Auth state management and routing integration.


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
- Add email/password signup.
- Add Google sign-in.
- Add Parent / Teacher - Dashboard

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

4. Run development server `npm run dev`

5. Build for production
   `npm run build`

Summary

Multiplication Masters combines a speed-adaptive Leitner system with SM-2 scheduling to create a highly effective multiplication fact trainer. The project now includes a complete session scheduler, a session update pipeline with batching, logic to persist card states to Firestore, and a basic authentication flow. Remaining tasks involve UI refinement, improved analytics, enhanced SRS logic, and production hardening.

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