import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import AppointmentSummary from '../components/AppointmentSummary.jsx'

/** Shown once after booking. The manage link is only in this page's state: it is never fetched again. */
export default function Booked() {
  const { state } = useLocation()
  const [copied, setCopied] = useState(false)
  if (!state?.appointment) return <Navigate to="/" replace />

  const link = `${window.location.origin}${window.location.pathname}#/manage/${state.manageToken}`

  return (
    <div className="page narrow">
      <div className="success-mark" aria-hidden="true">✓</div>
      <h1>You're booked</h1>
      <AppointmentSummary appointment={state.appointment} />

      <div className="card manage-link">
        <h2>Keep this link</h2>
        <p>It's the only way to move or cancel your visit online. Anyone with the link can change the booking, so don't share it.</p>
        <div className="copy-row">
          <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Your manage link" />
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(link).then(() => setCopied(true))}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <Link to="/">Book something else</Link>
    </div>
  )
}
