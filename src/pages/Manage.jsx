import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { formatDay } from '../lib/format.js'
import AppointmentSummary from '../components/AppointmentSummary.jsx'
import SlotPicker from '../components/SlotPicker.jsx'

/** The patient's own appointment, opened from the link in the confirmation. Move or cancel, while the rules allow it. */
export default function Manage() {
  const { token } = useParams()
  const [appointment, setAppointment] = useState(null)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('view') // view | move | cancel
  const [slot, setSlot] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    api.appointment(token).then(setAppointment).catch(setError)
  }, [token])

  async function run(action, done) {
    setBusy(true)
    setError(null)
    try {
      setAppointment(await action())
      setMode('view')
      setSlot(null)
      setNotice(done)
    } catch (err) {
      setError(err)
      // The appointment changed under us (someone else, or the deadline passed): show the current state.
      if (['not_active', 'too_late'].includes(err.code)) api.appointment(token).then(setAppointment).catch(() => {})
    } finally {
      setBusy(false)
    }
  }

  if (!appointment) {
    return <div className="page narrow">{error ? <><p className="error">{error.message}</p><Link to="/">Go to the clinic</Link></> : <div className="spinner" aria-label="Loading" />}</div>
  }

  return (
    <div className="page narrow">
      <h1>Your appointment</h1>
      {notice && <p className="success" role="status">{notice}</p>}
      <AppointmentSummary appointment={appointment} />
      {error && <p className="error">{error.message}</p>}

      {appointment.status === 'booked' && !appointment.canChange && (
        <p className="muted">It's too close to your visit to change it online. Please call the clinic.</p>
      )}

      {appointment.canChange && mode === 'view' && (
        <div className="actions">
          <button type="button" onClick={() => { setMode('move'); setNotice(null) }}>Move to another time</button>
          <button type="button" className="danger" onClick={() => { setMode('cancel'); setNotice(null) }}>Cancel appointment</button>
        </div>
      )}

      {mode === 'move' && (
        <section className="step">
          <h2>Pick a new time</h2>
          <SlotPicker serviceId={appointment.service.id} practitionerId={appointment.practitionerId} selected={slot} onSelect={setSlot} />
          <div className="actions">
            <button type="button" className="primary" disabled={!slot || busy}
              onClick={() => run(() => api.reschedule(token, slot.startsAt), `Moved to ${formatDay(slot.date, { long: true })} at ${slot.localTime}.`)}>
              {busy ? 'Moving...' : slot ? `Move to ${slot.localTime}` : 'Choose a time'}
            </button>
            <button type="button" className="link" onClick={() => setMode('view')}>Keep the current time</button>
          </div>
        </section>
      )}

      {mode === 'cancel' && (
        <section className="step">
          <h2>Cancel this appointment?</h2>
          <label>
            <span>Reason (optional, helps the clinic)</span>
            <input value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} />
          </label>
          <div className="actions">
            <button type="button" className="danger" disabled={busy} onClick={() => run(() => api.cancel(token, reason), 'Your appointment is cancelled.')}>
              {busy ? 'Cancelling...' : 'Yes, cancel it'}
            </button>
            <button type="button" className="link" onClick={() => setMode('view')}>No, keep it</button>
          </div>
        </section>
      )}

      {appointment.status === 'cancelled' && <Link to={`/book/${appointment.service.id}`}>Book a new time</Link>}
    </div>
  )
}

