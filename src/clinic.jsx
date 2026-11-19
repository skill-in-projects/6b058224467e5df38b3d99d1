import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api.js'

// The clinic facts every screen needs (name, time zone, notice hours, today in clinic time), loaded once.
const ClinicContext = createContext(null)

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

export function useClinic() {
  return useContext(ClinicContext)
}
