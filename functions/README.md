# Firebase Cloud Functions

This directory contains Firebase Cloud Functions for Multiplication Masters.

## Functions

### `initializeUserCards`

**Trigger**: Firestore `onCreate` event for `users/{userId}` documents

**Purpose**: Automatically initializes a new user's card collection when their user document is created.

**What it does**:
1. Reads all cards from the master `cards` collection (576 cards)
2. Copies them to the user's `UserCards` subcollection
3. Writes in batches of 500 to respect Firestore's batch limits

**Benefits**:
- Removes expensive read/write operations from the client
- Improves user experience by preventing UI blocking
- Ensures card initialization happens reliably server-side
- Reduces client-side complexity and error handling

## Development

### Prerequisites
- Node.js 18 or higher
- Firebase CLI installed globally

### Local Testing

1. Install dependencies:
   ```bash
   cd functions
   npm install
   ```

2. Build the functions:
   ```bash
   npm run build
   ```

3. Run with Firebase emulators:
   ```bash
   # From the root directory
   firebase emulators:start
   ```

   The functions emulator will run on port 5001.

### Deployment

Deploy all functions:
```bash
firebase deploy --only functions
```

Deploy a specific function:
```bash
firebase deploy --only functions:initializeUserCards
```

## Architecture Notes

Previously, card initialization was handled client-side in `FirebaseProvider.tsx` via the `ensureUserCards` function. This caused the following issues:

1. **Performance**: Every new user login would trigger 576 Firestore reads
2. **Latency**: Batched writes would block the client UI
3. **Reliability**: Client-side errors could leave users without cards

The new Cloud Function approach resolves these issues by:
- Triggering automatically when a user document is created
- Running in the background without blocking the client
- Providing better error handling and logging
- Reducing client bundle size and complexity
