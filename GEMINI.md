# Multiplication Masters UI - Context

## Overview
This document provides context for the Multiplication Masters UI repository, including dependencies, project structure, and key configuration files.

## Tech Stack
- **Build Tool**: Vite
- **Framework**: React 19
- **Language**: TypeScript
- **UI Framework**: Material UI (MUI) v7
- **State/Backend**: Firebase v12
- **Routing**: React Router v7
- **Animation**: Framer Motion
- **Canvas/Graphics**: Konva

## Package Configuration (`package.json`)
```json
{
  "name": "multiplication_masters_ui",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@mui/icons-material": "^7.3.5",
    "@mui/material": "^7.3.4",
    "datastructures-js": "^13.0.0",
    "firebase": "^12.5.0",
    "framer-motion": "^12.23.24",
    "konva": "^10.0.12",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-konva": "^19.2.1",
    "react-router-dom": "^7.9.6",
    "use-image": "^1.1.4",
    "uuid": "^13.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.36.0",
    "@types/node": "^24.6.0",
    "@types/react": "^19.1.16",
    "@types/react-dom": "^19.1.9",
    "@types/uuid": "^10.0.0",
    "@vitejs/plugin-react": "^5.0.4",
    "babel-plugin-react-compiler": "^19.1.0-rc.3",
    "eslint": "^9.36.0",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.22",
    "globals": "^16.4.0",
    "prettier": "^3.6.2",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.45.0",
    "vite": "^7.1.7"
  }
}
```

## Key File Locations
- **App Entry**: `src/main.tsx` 
- **Theme Config**: `src/theme/theme.ts` 
- **Firebase Config**: `src/context/FirebaseProvider.tsx`
- **Router**: `src/App.tsx`
- **ContextProviders**: `src/App.tsx`

## Directory Structure (Inferred)
- `src/components/`: UI Components (e.g., `DailyGoalPanel`, `Header`, `UserMenu`)
- `src/pages/`: Route Pages (e.g., `PracticePage`)
- `src/contexts/`: React Contexts (e.g., `userContext`, `timerContext`, `SessionStatusContext`)
- `src/hooks/`: Custom Hooks (e.g., `useDailyReviews`, `useThresholdAnimation`)
- `src/constants/`: Constants (e.g., `routeConstants`)
- `src/utilities/`: Helper functions
- `functions/`: Firebase functions directory

## General coding style
- Do not use emojis
- prefer functions and if statements wrapped in {}, avoiding explicit returns
- alphabetize imports with react imports first followed by package (library) imports followed by project imports
- alphabetize arguments, props, and variables unless we can't because of optional arguments or avoiding overriding props

## Mobile Development
- This application is built for mobile and desktop
- A helper hook exists useIsMobile that returns true on useMediaQuery(theme.breakpoints.down('sm'))
- prefer sx={property: {xs: 'foo', sm: 'bar'}} over isMobile when possible
- prefer sx={property: {xs: 'foo', sm: 'bar'}} over styled components and classes.
- Keep new component styling consistent with existing components. Avoid card look on mobile.

## Documentation
- Add js doc to all top level functions and to functions with more than a single responsibility.
- Do not use emojis in any comment

## Error handling
- When catching errors use logger from `src/hooks/useLogger` and show notification using  
the return value of useNotification(): showNotification: (message: string, severity?: AlertColor) => void

## Data model
```typescript
// src/constants/dataModels.ts
/**
 * Data models used in the application
 * This file should only contain type
 * definitions and interfaces related to backend data models.
 * this should help keep a clear separation of concerns and make
 * it easier to manage changes to data structures.
 *
 */

import type { Timestamp } from 'firebase/firestore'
import type { SceneTheme } from './sceneDefinitions'
import type { SceneObjectInstance } from '../components/SceneBuilder/sceneBuilderTypes'

export type UserCard = {
  avgResponseTime: number | null
  bottom: number
  box: number
  correct: number
  correctDivision: number
  difficulty: 'basic' | 'advanced' | 'elite'
  expression: string
  group: number
  id: string
  incorrect: number
  incorrectDivision: number
  isPrimary: boolean
  lastReviewed: number | null
  mirrorOf: string | null
  nextDueTime: number
  seen: number
  table: number
  top: number
  value: number
  wasLastReviewCorrect: boolean
  wasLastDivisionReviewCorrect: boolean
  lastElapsedTime: number
}

export interface User {
  uid: string
  username: string
  userRole: 'student' | 'teacher' | 'parent'
  createdAt: Timestamp | null
  lastLogin: Timestamp | null
  subscriptionStatus: 'free' | 'premium'

  activeGroup: number
  table: number
  totalAccuracy: number

  lifetimeCorrect: number
  lifetimeIncorrect: number
  totalSessions: number
  userDefaultSessionLength: number
  currentLevelProgress: number

  unlockedScenes?: SceneTheme[]
  activeScene?: SceneTheme
  placedScenes?: {
    [sceneId in SceneTheme]?: SceneObjectInstance[]
  }
}

export type SessionRecord = {
  userId: string // uid

  sessionType: 'multiplication' | 'division' | 'mixed'
  sessionLength: number // 10, 20, 30, 45

  startedAt: number // timestamp
  endedAt: number // timestamp
  durationMs: number

  correct: number
  incorrect: number
  accuracy: number // calculated %

  avgResponseTime: number | null
  fastCorrect: number
  slowCorrect: number
  timeouts: number

  boxesAdvanced: number
  boxesRegressed: number

  statsByTable: {
    [table: number]: {
      correct: number
      incorrect: number
    }
  }
}
```