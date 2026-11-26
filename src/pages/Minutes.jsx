import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { addDays, formatDay, formatDuration } from '../lib/format.js'
import { useClinic } from '../clinicContext.js'

const TICK_STEPS = [15, 30, 60, 120, 180, 240, 360, 480, 720, 1440]
const number = new Intl.NumberFormat('en-GB')
const visitsText = (n) => `${n} ${n === 1 ? 'visit' : 'visits'}`

/** The Sunday that starts the clinic week holding this day. */
function weekStart(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return addDays(isoDate, -new Date(Date.UTC(y, m - 1, d)).getUTCDay())
}

/** Round axis steps (15, 30, 60... minutes), at most four of them above zero. */
function axisTicks(maxValue) {
  const step = TICK_STEPS.find((s) => maxValue / s <= 4) ?? Math.ceil(maxValue / 4 / 1440) * 1440
  const top = Math.max(1, Math.ceil(maxValue / step)) * step
  const ticks = []
  for (let t = 0; t <= top; t += step) ticks.push(t)
  return { top, ticks }
}

/**
 * Booked minutes for one clinic week, as totals only: no patient details are loaded here.
 */
export default function Minutes() {
  const clinic = useClinic()
  const thisWeek = weekStart(clinic.today)
  const [from, setFrom] = useState(thisWeek)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let stale = false
    setError(null)
    api.minutes(from, 7)
      .then((d) => { if (!stale) setData(d) })
      .catch((err) => { if (!stale) { setData(null); setError(err) } })
    return () => { stale = true }
  }, [from])

  const busiest = data?.days.reduce((best, d) => (d.minutes > best.minutes ? d : best), data.days[0])

  return (
    <div className="page">
      <div className="staff-bar">
        <h1>Minutes</h1>
        <div className="date-nav">
          <button type="button" onClick={() => setFrom(addDays(from, -7))} aria-label="Previous week">‹</button>
          <strong>{formatDay(from)} - {formatDay(addDays(from, 6))}</strong>
          <button type="button" onClick={() => setFrom(addDays(from, 7))} aria-label="Next week">›</button>
          {from !== thisWeek && <button type="button" className="link" onClick={() => setFrom(thisWeek)}>This week</button>}
        </div>
      </div>
      <p className="muted">Booked visit time for the week. Cancelled visits are left out.</p>

      {error && <p className="error">{error.message}</p>}
      {!data && !error && <div className="spinner" aria-label="Loading" />}
      {data && (
        <>
          <div className="tiles">
            <div className="tile hero-tile">
              <span className="tile-label">Booked minutes</span>
              <span className="tile-value">{number.format(data.totalMinutes)}</span>
              <span className="tile-note">{data.totalMinutes > 0 ? formatDuration(data.totalMinutes) : 'Nothing booked yet'}</span>
            </div>
            <div className="tile">
              <span className="tile-label">Visits</span>
              <span className="tile-value">{number.format(data.visits)}</span>
              <span className="tile-note">{data.cancelledVisits} cancelled</span>
            </div>
            <div className="tile">
              <span className="tile-label">Average visit</span>
              <span className="tile-value">{data.visits > 0 ? `${Math.round(data.totalMinutes / data.visits)} min` : '-'}</span>
              <span className="tile-note">per booked visit</span>
            </div>
            <div className="tile">
              <span className="tile-label">Busiest day</span>
              <span className="tile-value">{busiest.minutes > 0 ? formatDay(busiest.date) : '-'}</span>
              <span className="tile-note">{busiest.minutes > 0 ? `${number.format(busiest.minutes)} min` : 'No visits this week'}</span>
            </div>
          </div>

          <section className="step">
            <h2>Booked minutes per day</h2>
            <DayColumns days={data.days} today={clinic.today} />
          </section>

          <div className="chart-pair">
            <section className="step">
              <h2>Minutes by practitioner</h2>
              <Bars rows={data.practitioners} />
            </section>
            <section className="step">
              <h2>Minutes by service</h2>
              <Bars rows={data.services} />
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function DayColumns({ days, today }) {
  const { top, ticks } = axisTicks(Math.max(...days.map((d) => d.minutes)))
  return (
    <>
      <div className="mchart">
        <div className="mchart-plot">
          {ticks.map((t) => (
            <div key={t} className={`mchart-grid${t === 0 ? ' base' : ''}`} style={{ bottom: `${(t / top) * 100}%` }}>
              <span>{number.format(t)}</span>
            </div>
          ))}
          <div className="mchart-cols">
            {days.map((d) => (
              <div key={d.date} className="mchart-col" tabIndex={0}
                aria-label={`${formatDay(d.date, { long: true })}: ${d.minutes} minutes, ${visitsText(d.visits)}`}>
                <div className="mchart-bar" style={{ height: `${(d.minutes / top) * 100}%` }} />
                <div className="mchart-tip" role="tooltip">
                  <strong>{number.format(d.minutes)} min</strong>
                  <span>{formatDay(d.date)} · {visitsText(d.visits)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mchart-x">
          {days.map((d) => {
            const [weekday, ...rest] = formatDay(d.date).split(' ')
            return (
              <span key={d.date} className={d.date === today ? 'today' : undefined}>
                {weekday}<small>{rest.join(' ')}</small>
              </span>
            )
          })}
        </div>
      </div>
      <details className="chart-table">
        <summary>Show as a table</summary>
        <table>
          <thead><tr><th>Day</th><th>Minutes</th><th>Visits</th></tr></thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}><td>{formatDay(d.date, { long: true })}</td><td>{number.format(d.minutes)}</td><td>{d.visits}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}

function Bars({ rows }) {
  const sorted = [...rows].sort((a, b) => b.minutes - a.minutes)
  const top = Math.max(1, ...sorted.map((r) => r.minutes))
  return (
    <div className="hbars">
      {sorted.map((r) => (
        <div key={r.name} className="hbar-row">
          <span className="hbar-name">{r.name}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: `calc((100% - 9.5rem) * ${r.minutes / top})` }} />
            <span className="hbar-value">{number.format(r.minutes)} min<small> · {visitsText(r.visits)}</small></span>
          </div>
        </div>
      ))}
    </div>
  )
}
