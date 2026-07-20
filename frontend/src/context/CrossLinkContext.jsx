import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '../api/client'

const CrossLinkContext = createContext(null)

export function CrossLinkProvider({ children }) {
  const [pin, setPin] = useState(null)
  const [resolved, setResolved] = useState(null)
  const [resolving, setResolving] = useState(false)

  const clearPin = useCallback(() => {
    setPin(null)
    setResolved(null)
  }, [])

  const pinToSee = useCallback(async ({ case_ref = null, zone_id = null }) => {
    const next = {
      case_ref,
      zone_id,
      source: 'ask',
      target: 'see',
    }
    setPin(next)
    setResolving(true)
    try {
      const ctx = await api.crosslink(next)
      setResolved(ctx)
      return ctx
    } finally {
      setResolving(false)
    }
  }, [])

  const pinToAsk = useCallback(async ({ zone_id = null, case_ref = null }) => {
    const next = {
      case_ref,
      zone_id,
      source: 'see',
      target: 'ask',
    }
    setPin(next)
    setResolving(true)
    try {
      const ctx = await api.crosslink(next)
      setResolved(ctx)
      return ctx
    } finally {
      setResolving(false)
    }
  }, [])

  const pinToPredict = useCallback(async ({ zone_id = null }) => {
    const next = {
      zone_id,
      case_ref: null,
      source: 'see',
      target: 'predict',
    }
    setPin(next)
    setResolved({ zone_id, source: 'see', target: 'predict' })
    return next
  }, [])

  const value = useMemo(
    () => ({
      pin,
      resolved,
      resolving,
      clearPin,
      pinToSee,
      pinToAsk,
      pinToPredict,
      setPin,
      setResolved,
    }),
    [pin, resolved, resolving, clearPin, pinToSee, pinToAsk, pinToPredict],
  )

  return (
    <CrossLinkContext.Provider value={value}>{children}</CrossLinkContext.Provider>
  )
}

export function useCrossLink() {
  const ctx = useContext(CrossLinkContext)
  if (!ctx) throw new Error('useCrossLink must be used within CrossLinkProvider')
  return ctx
}
