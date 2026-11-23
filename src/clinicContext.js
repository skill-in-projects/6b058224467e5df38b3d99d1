import { createContext, useContext } from 'react'

// The clinic facts every screen needs (name, time zone, notice hours, today in clinic time). Filled by ClinicProvider.
export const ClinicContext = createContext(null)

export function useClinic() {
  return useContext(ClinicContext)
}
