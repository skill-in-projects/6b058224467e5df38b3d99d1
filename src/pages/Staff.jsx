import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import { addDays, formatDay } from '../lib/format.js'
import { useClinic } from '../clinicContext.js'

const KEY_STORE = 'clinic.staffKey'
const STATUS_LABEL = { booked: 'Booked', cancelled: 'Cancelled', completed: 'Done', no_show: 'No-show' }

function readKey() {
  try {
    return sessionStorage.getItem(KEY_STORE) || ''
  } catch {
    return ''
  }
}

/**
 * The front desk day view. The staff key is kept for this browser tab only (sessionStorage), never in the URL.
 */
export default function Staff() {
  const clinic = useClinic()
  const [key, setKey] = useState(readKey)
  const [date, setDate] = useState(clinic.today)
  const [day, setDay] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    if (!key) return
    setError(null)
    api.staffDay(key, date).then(setDay).catch((err) => {
      if (err.code === 'bad_staff_key') {
        try { sessionStorage.removeItem(KEY_STORE) } catch { /* private mode */ }
        setKey('')
      }
      setError(err)
    })
  }, [key, date])

  useEffect(load, [load])

  if (!key) return <KeyForm error={error} onKey={(k) => { try { sessionStorage.setItem(KEY_STORE, k) } catch { /* private mode */ } setKey(k) }} />

  return (
    <div className="page wide">
      <div className="staff-bar">
        <h1>Front desk <span aria-hidden="true">🐶</span></h1>
        <div className="date-nav">
          <button type="button" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">‹</button>
          <strong>{formatDay(date, { long: true })}</strong>
          <button type="button" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">›</button>
          {date !== clinic.today && <button type="button" className="link" onClick={() => setDate(clinic.today)}>Today</button>}
        </div>
      </div>
      {error && <p className="error">{error.message}</p>}
      {!day && !error && <div className="spinner" aria-label="Loading" />}
      {day && (
        <div className="columns">
          {day.practitioners.map((p) => (
            <PractitionerColumn key={p.practitionerId} column={p} staffKey={key} date={date} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  )
}

function KeyForm({ error, onKey }) {
  const [value, setValue] = useState('')
  return (
    <div className="page narrow">
      <h1>Front desk <span aria-hidden="true">🐶</span></h1>
      <form className="card" onSubmit={(e) => { e.preventDefault(); if (value.trim()) onKey(value.trim()) }}>
        <label>
          <span>Staff key</span>
          <input type="password" autoComplete="current-password" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        {error && <p className="error">{error.message}</p>}
        <button className="primary" type="submit">Open the day view</button>
      </form>
    </div>
  )
}

function PractitionerColumn({ column, staffKey, date, onChanged }) {
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)
  const [showTimeOff, setShowTimeOff] = useState(false)

  async function act(id, fn) {
    setBusyId(id)
    setError(null)
    try {
      await fn()
      onChanged()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }

  const live = column.appointments.filter((a) => a.status !== 'cancelled')
  const cancelled = column.appointments.filter((a) => a.status === 'cancelled')

  return (
    <section className="column">
      <header>
        <h2>{column.practitionerName}</h2>
        <small className="muted">{live.length} {live.length === 1 ? 'visit' : 'visits'}</small>
      </header>
      {error && <p className="error small">{error.message}</p>}

      {column.timeOff.map((t) => (
        <div key={t.id} className="block time-off">
          <span>{t.from}-{t.to} · {t.reason || 'Time off'}</span>
          <button type="button" className="link" disabled={busyId === `t${t.id}`} onClick={() => act(`t${t.id}`, () => api.deleteTimeOff(staffKey, t.id))}>
            Remove
          </button>
        </div>
      ))}

      {live.length === 0 && column.timeOff.length === 0 && <p className="muted small">Nothing booked.</p>}
      {live.map((a) => (
        <article key={a.id} className={`block visit ${a.status}`}>
          <div className="visit-head">
            <strong>{a.localTime}-{a.localEndTime}</strong>
            <span className={`badge ${a.status}`}>{STATUS_LABEL[a.status]}</span>
          </div>
          <div>{a.patientName} · {a.serviceName}</div>
          <small className="muted"><a href={`tel:${a.patientPhone}`}>{a.patientPhone}</a> · {a.patientEmail}</small>
          {a.notes && <p className="notes">“{a.notes}”</p>}
          {a.rescheduleCount > 0 && <small className="muted">Moved {a.rescheduleCount}x by the patient</small>}
          {a.status === 'booked' && (
            <div className="visit-actions">
              <button type="button" disabled={busyId === a.id} onClick={() => act(a.id, () => api.staffStatus(staffKey, a.id, 'completed'))}>Done</button>
              <button type="button" disabled={busyId === a.id} onClick={() => act(a.id, () => api.staffStatus(staffKey, a.id, 'no_show'))}>No-show</button>
              <button type="button" className="danger" disabled={busyId === a.id}
                onClick={() => act(a.id, () => api.staffStatus(staffKey, a.id, 'cancelled', 'Cancelled by the clinic'))}>Cancel</button>
            </div>
          )}
        </article>
      ))}

      {cancelled.length > 0 && (
        <details className="cancelled-list">
          <summary>{cancelled.length} cancelled</summary>
          {cancelled.map((a) => <div key={a.id} className="muted small">{a.localTime} {a.patientName}</div>)}
        </details>
      )}

      {showTimeOff ? (
        <TimeOffForm practitionerId={column.practitionerId} date={date} staffKey={staffKey}
          onDone={() => { setShowTimeOff(false); onChanged() }} onCancel={() => setShowTimeOff(false)} />
      ) : (
        <button type="button" className="link" onClick={() => setShowTimeOff(true)}>+ Add time off</button>
      )}
    </section>
  )
}

function TimeOffForm({ practitionerId, date, staffKey, onDone, onCancel }) {
  const [from, setFrom] = useState('12:00')
  const [to, setTo] = useState('13:00')
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.addTimeOff(staffKey, { practitionerId, day: date, from, to, reason: reason || null })
      onDone()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="time-off-form" onSubmit={submit}>
      <div className="row">
        <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
        <input type="time" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
      </div>
      <input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
      {error && <p className="error small">{error.message}</p>}
      <div className="row">
        <button type="submit" className="primary" disabled={busy}>Add</button>
        <button type="button" className="link" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
