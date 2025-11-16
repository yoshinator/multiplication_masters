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
- Note: Firebase `apiKey` exposure is not inherently sensitive; however, service account keys or admin SDK keys should not appear in the repo. The repository should be audited for any sensitive configuration.

### UI Foundations
- Initial flash card interface implemented.
- Input handling, reaction timer, and feedback logic operational.
- Core logic for answer evaluation and SRS routing functional.

### Spaced Repetition Engine (SRS)
- Speed-Adaptive Leitner + SM-2 hybrid logic defined.
- Reaction-time based card movement:
  - Under 2 seconds: promote one box.
  - 3–4 seconds: remain in current box.
  - Over 4–7 seconds: demote two boxes.
  - Incorrect answer: reset to box 1.
- Timestamp-based scheduling via nextDueTime.
- Conceptual design for a priority queue to always surface due cards first.

---

## Work Remaining

### User Sign Up and Auth
- create email password sign up 
- Sign in with Google


### Frontend and User Experience
- Improve UI presentation, animations, and responsiveness.
- Add level progression interface (show locked/unlocked tables).
- Build performance dashboard (accuracy, response times, weakest facts).
- Add practice modes (timed drill, review-only, mixed tables).
- Add error states, loading screens, and improved input feedback.
- Implement local caching or offline-first support using IndexedDB or localStorage.

### Backend and Data Logic
- Finalize and document Firebase data schema.
- Implelement synchronization logic for card updates during and after review sessions.
- Implement secure Firebase rules to isolate user data.
- Add session-level statistics (session length, cards reviewed, accuracy).
- Add data export/import feature for portability.

### SRS Improvements
- Finish full implementation of the priority queue scheduler.
- Add mirror card activation logic (unlock mirrored versions after mastery).
- Implement weighting for mirrored cards if needed.
- Add decay logic for overdue cards (automatic demotion after long inactivity).
- Tune the long-range box intervals if required after user testing.
- Add mastery thresholds per table group and unlocking workflow.

### Deployment and Production Readiness
- Include Firebase script to seed intial cards. 
- Add build pipeline for production deployment (Firebase Hosting, Vercel, or Netlify).
- Set up CI for linting, type checks, and test running.
- Add screenshots, GIF demos, and installation guides.
- Add environment variable documentation and `.env` template.
- Add proper licensing.

### Security and Privacy
- Audit repository for any exposed sensitive keys.
- Move all Firebase config into `.env` files if not already.
- Add privacy policy and terms of use for public release.
- Ensure compliance with Firebase security rules.

---


---

## Getting Started

1. Clone the repository  
   `git clone https://github.com/yoshinator/multiplication_masters.git` or ssh if you prefer

2. Install dependencies  
   `npm install`

3. Configure environment variables in `.env.local`  

```shell
VITE_FIREBASE_API_KEY=yourKey
VITE_FIREBASE_AUTH_DOMAIN=yourDomain
VITE_FIREBASE_PROJECT_ID=yourProject
```

Currently a firebase instance attaches to the window object if running in dev to simplify seeding initial card deck. This deck is the deck used to create new cards for every new user. 
In development once you have your firebase project setup variables needed in your env file above you can run window.seedCards(). See firebaseProvider.tsx for implementation. 


4. Run development server  
`npm run dev`

5. Build for production  
`npm run build`

---

## Summary
Multiplication Masters combines a speed-adaptive Leitner system with SM-2 scheduling to produce a highly effective multiplication fact trainer. The project already includes core models, SRS logic, card generation, and Firebase setup. Remaining tasks involve improving UI/UX, completing the scheduler, refining algorithms, securing the backend, and preparing for deployment.

---
