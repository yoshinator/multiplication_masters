import type { FC } from 'react'
import { useState } from 'react'
import { Box, Button, Input } from '@mui/material'
import useFirebase from '../contexts/useFirebase'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'

type LoginProps = {
  compact?: boolean
}

export const Login: FC<LoginProps> = ({ compact = false }) => {
  const { app, loadUserCards } = useFirebase()
  const [username, setUsername] = useState<string>('')
  const [cards, setCards] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    try {
      let name = username
      if (!name) {
        // fallback prompt for compact mode or empty input
        const p = window.prompt('Enter username')
        if (!p) return
        name = p
        setUsername(p)
      }

      if (!app) {
        setError('Firebase app not initialized')
        return
      }

      setLoading(true)
      const db = getFirestore(app)

      // check/create user
      const userRef = doc(db, 'users', name)
      const userSnap = await getDoc(userRef)
      if (!userSnap.exists()) {
        await setDoc(userRef, { username: name, createdAt: serverTimestamp() })
      }

      // ensure user has UserCards subcollection; if empty, create copies
      const userCardsCol = collection(db, 'users', name, 'UserCards')
      const userCardsSnap = await getDocs(userCardsCol)
      if (userCardsSnap.empty) {
        // read all cards
        const cardsCol = collection(db, 'cards')
        const cardsSnap = await getDocs(cardsCol)
        const data = cardsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setCards(data)
        // keep a console trace for dev
        console.log('cards', data)

        // create a new doc per card using chunked writeBatch (max 500 ops per batch)
        const CHUNK_SIZE = 500
        const chunks: Array<typeof data> = []
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          chunks.push(data.slice(i, i + CHUNK_SIZE))
        }

        for (const chunkItems of chunks) {
          const batch = writeBatch(db)
          for (const card of chunkItems) {
            const maybeId = card as unknown as { id?: string }
            const id = maybeId.id || undefined
            const cardDocRef = id ? doc(userCardsCol, id) : doc(userCardsCol)
            batch.set(cardDocRef, card)
          }
          await batch.commit()
        }
        console.log('Initialized user UserCards for', name)
      }
      // load user cards into context
      try {
        await loadUserCards(name)
      } catch {
        // ignore
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {!compact && (
        <Input
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      )}
      <Button
        variant="contained"
        onClick={handleLogin}
        disabled={loading}
        data-cards-count={cards.length}
      >
        {loading ? '...' : 'Login'}
      </Button>
      {error && (
        <Box component="span" sx={{ color: 'error.main', ml: 1 }}>
          {error}
        </Box>
      )}
    </Box>
  )
}
