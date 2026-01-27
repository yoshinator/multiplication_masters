import { useState, useCallback } from 'react'
import {
  getFunctions,
  httpsCallable,
  type HttpsCallableResult,
} from 'firebase/functions'
import { useFirebaseContext } from '../contexts/firebase/firebaseContext'
import { extractErrorMessage } from '../utilities/typeutils'
import { useLogger } from './useLogger'

type CloudFunctionStatus = 'idle' | 'pending' | 'success' | 'error'

export function useCloudFunction<RequestData = unknown, ResponseData = unknown>(
  functionName: string
) {
  const { app } = useFirebaseContext()
  const [status, setStatus] = useState<CloudFunctionStatus>('idle')
  const [data, setData] = useState<ResponseData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const logger = useLogger('useCloudFunction')

  const execute = useCallback(
    async (
      requestData?: RequestData
    ): Promise<HttpsCallableResult<ResponseData> | undefined> => {
      if (!app) {
        const msg = 'Firebase app not initialized'
        logger(msg, functionName)
        setError(msg)
        setStatus('error')
        return undefined
      }

      setStatus('pending')
      setError(null)
      setData(null)

      try {
        const functions = getFunctions(app)
        const callable = httpsCallable<RequestData, ResponseData>(
          functions,
          functionName
        )
        const result = await callable(requestData)

        setData(result.data)
        setStatus('success')
        return result
      } catch (err) {
        const msg = extractErrorMessage(err)
        setError(msg)
        setStatus('error')
        throw err
      }
    },
    [app, functionName, logger]
  )

  const reset = useCallback(() => {
    setStatus('idle')
    setData(null)
    setError(null)
  }, [])

  return {
    execute,
    data,
    error,
    status,
    isPending: status === 'pending',
    isIdle: status === 'idle',
    isSuccess: status === 'success',
    isError: status === 'error',
    reset,
  }
}
