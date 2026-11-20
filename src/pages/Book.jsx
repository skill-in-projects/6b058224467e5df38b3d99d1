import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { formatDay, formatDuration, formatPrice } from '../lib/format.js'
import SlotPicker from '../components/SlotPicker.jsx'
import PatientForm from '../components/PatientForm.jsx'

/**
 * Booking in three steps on one page: who, when, your details. Each step shows its choice once made, with a Change
 * link, so the patient always sees the whole booking before confirming.
 */
export default function Book() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [practitioners, setPractitioners] = useState(null)
  const [practitioner, setPractitioner] = useState(null)
  const [slot, setSlot] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [pickerKey, setPickerKey] = useState(0)

  useEffect(() => {
    Promise.all([api.services(), api.practitioners(serviceId)])
      .then(([services, list]) => {
        setService(services.find((s) => String(s.id) === serviceId) ?? null)
        setPractitioners(list)
        if (list.length === 1) setPractitioner(list[0])
      })
      .catch(setError)
  }, [serviceId])

  async function confirm(values) {
    setBusy(true)
    setError(null)
    setFieldErrors({})
    try {
      const result = await api.book({ serviceId: service.id, practitionerId: practitioner.id, startsAt: slot.startsAt, ...values })
      navigate('/booked', { state: result, replace: true })
    } catch (err) {
      if (err.code === 'invalid') setFieldErrors(err.fields)
      else if (err.code === 'slot_taken') {
        // Someone else got it first: back to the times, refreshed, keeping the typed details.
        setSlot(null)
        setPickerKey((k) => k + 1)
      }
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (!service && practitioners) return <div className="page"><p className="error">That service does not exist.</p><Link to="/">Back to services</Link></div>
  if (!service) return <div className="page">{error ? <p className="error">{error.message}</p> : <div className="spinner" aria-label="Loading" />}</div>

  return (
    <div className="page narrow">
      <Link to="/" className="back">‹ All services</Link>
      <h1>{service.name}</h1>
      <p className="muted">{formatDuration(service.durationMinutes)} · {formatPrice(service.priceCents)}</p>

      <section className="step">
        <h2>1. Who would you like to see?</h2>
        {practitioner ? (
          <div className="chosen">
            <span>{practitioner.name}, {practitioner.title}</span>
            {practitioners.length > 1 && <button type="button" className="link" onClick={() => { setPractitioner(null); setSlot(null) }}>Change</button>}
          </div>
        ) : (
          <div className="cards compact">
            {practitioners.map((p) => (
              <button key={p.id} type="button" className="card person" onClick={() => setPractitioner(p)}>
                <strong>{p.name}</strong>
                <span>{p.title}</span>
                <small className="muted">{p.bio}</small>
              </button>
            ))}
          </div>
        )}
      </section>

      {practitioner && (
        <section className="step">
          <h2>2. When?</h2>
          {slot ? (
            <div className="chosen">
              <span>{formatDay(slot.date, { long: true })} at {slot.localTime}</span>
              <button type="button" className="link" onClick={() => setSlot(null)}>Change</button>
            </div>
          ) : (
            <>
              {error?.code === 'slot_taken' && <p className="error">{error.message}</p>}
              <SlotPicker key={pickerKey} serviceId={service.id} practitionerId={practitioner.id} selected={slot} onSelect={setSlot} />
            </>
          )}
        </section>
      )}

      {slot && (
        <section className="step">
          <h2>3. Your details</h2>
          {error && !['invalid', 'slot_taken'].includes(error.code) && <p className="error">{error.message}</p>}
          <PatientForm busy={busy} fieldErrors={fieldErrors} onSubmit={confirm} />
        </section>
      )}
    </div>
  )
}
