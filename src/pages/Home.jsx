import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { formatDuration, formatPrice } from '../lib/format.js'
import { useClinic } from '../clinicContext.js'

export default function Home() {
  const clinic = useClinic()
  const [services, setServices] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.services().then(setServices).catch(setError)
  }, [])

  return (
    <div className="page">
      <section className="hero">
        <h1>Book a visit at {clinic.name}</h1>
        <p>Pick a service, choose a time that suits you, and get a confirmation straight away. No account needed.</p>
      </section>

      {error && <p className="error">{error.message}</p>}
      {!services && !error && <div className="spinner" aria-label="Loading" />}
      <div className="cards">
        {services?.map((s) => (
          <Link key={s.id} to={`/book/${s.id}`} className="card service-card">
            <h2>{s.name}</h2>
            <p>{s.description}</p>
            <div className="meta">
              <span>{formatDuration(s.durationMinutes)}</span>
              <span>{formatPrice(s.priceCents)}</span>
            </div>
          </Link>
        ))}
      </div>

      <p className="muted small">
        Already booked? Use the link in your confirmation to move or cancel, up to {clinic.cancellationNoticeHours} hours before your visit.
      </p>
    </div>
  )
}
