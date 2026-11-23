import { useEffect, useState } from 'react'
import { api } from './api.js'
import { ClinicContext } from './clinicContext.js'

/** Loads the clinic facts once; nothing renders until they are here, so no screen has to handle "no clinic yet". */
export function ClinicProvider({ children }) {
  const [clinic, setClinic] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.clinic().then(setClinic).catch(setError)
  }, [])

  if (error) return <div className="page"><p className="error">{error.message}</p></div>
  if (!clinic) return <div className="page"><div className="spinner" aria-label="Loading" /></div>
  return <ClinicContext.Provider value={clinic}>{children}</ClinicContext.Provider>
}
