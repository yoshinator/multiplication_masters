import { useEffect, useState } from 'react'
import {
  onSnapshot,
  type Query,
  type DocumentReference,
  type DocumentData,
} from 'firebase/firestore'
import { useLogger } from './useLogger'
import { extractErrorMessage } from '../utilities/typeutils'
import { useNotification } from '../contexts/notificationContext/notificationContext'

export function useFirestoreQuery<T = DocumentData>(
  queryRef: Query | null | undefined,
  options: { idField?: string } = {}
) {
  const { idField = 'id' } = options
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const logger = useLogger('useFirestoreQuery')
  const { showNotification } = useNotification()

  useEffect(() => {
    if (!queryRef) {
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const results = snapshot.docs.map((doc) => ({
          ...doc.data(),
          [idField]: doc.id,
        })) as T[]
        setData(results)
        setLoading(false)
        setError(null)
      },
      (err) => {
        logger('Error fetching query:', err)
        showNotification(
          'Error fetching data from Firestore: ' + extractErrorMessage(err),
          'error'
        )
        setError(extractErrorMessage(err))
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [queryRef, idField, logger])

  return { data, loading, error }
}

export function useFirestoreDoc<T = DocumentData>(
  docRef: DocumentReference | null | undefined,
  options: { idField?: string } = {}
) {
  const { idField = 'id' } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [exists, setExists] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logger = useLogger('useFirestoreDoc')
  const { showNotification } = useNotification()

  useEffect(() => {
    if (!docRef) {
      setLoading(false)
      setExists(false)
      setData(null)
      setError(null)
      return
    }

    setLoading(true)
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setExists(snapshot.exists())
        if (snapshot.exists()) {
          setData({ ...snapshot.data(), [idField]: snapshot.id } as T)
        } else {
          setData(null)
        }
        setLoading(false)
        setError(null)
      },
      (err) => {
        showNotification(
          'Error fetching document from Firestore: ' + extractErrorMessage(err),
          'error'
        )
        logger('Error fetching doc:', err)
        setError(extractErrorMessage(err))
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [docRef, idField, logger])

  return { data, loading, exists, error }
}
