import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { addDays, formatDay, groupSlots } from '../lib/format.js'
import { useClinic } from '../clinicContext.js'

const DAYS_SHOWN = 14

/**
 * A date strip (free slots per day) and the free times on the chosen day. Used by booking and by "move my appointment".
 * Every request is cancelled when the inputs change, so a slow answer for an old day never replaces the new one.
 */
export default function SlotPicker({ serviceId, practitionerId, selected, onSelect }) {
  const clinic = useClinic()
  const [from, setFrom] = useState(clinic.today)
  const [days, setDays] = useState(null)
  const [day, setDay] = useState(null)
  const [slots, setSlots] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const ctrl = new AbortController()
    setDays(null)
    api.days(serviceId, practitionerId, from, DAYS_SHOWN, ctrl.signal)
      .then((list) => {
        setDays(list)
        setDay((current) => (current && list.some((d) => d.date === current) ? current : list.find((d) => d.freeSlots > 0)?.date ?? null))
      })
      .catch((err) => err.name !== 'AbortError' && setError(err))
    return () => ctrl.abort()
  }, [serviceId, practitionerId, from])

  useEffect(() => {
    if (!day) return setSlots([])
    const ctrl = new AbortController()
    setSlots(null)
    api.slots(serviceId, practitionerId, day, ctrl.signal)
      .then((d) => setSlots(d.slots))
      .catch((err) => err.name !== 'AbortError' && setError(err))
    return () => ctrl.abort()
  }, [serviceId, practitionerId, day])

  const canGoBack = from > clinic.today
  const lastDay = addDays(clinic.today, clinic.bookingHorizonDays)

  if (error) return <p className="error">{error.message}</p>

  return (
    <div className="slot-picker">
      <div className="date-strip" role="tablist" aria-label="Choose a day">
        <button type="button" className="strip-arrow" disabled={!canGoBack} onClick={() => setFrom(addDays(from, -DAYS_SHOWN))} aria-label="Earlier days">
          ‹
        </button>
        {days === null && <div className="spinner small" aria-label="Loading days" />}
        {days?.map((d) => (
          <button
            key={d.date}
            type="button"
            role="tab"
            aria-selected={d.date === day}
            className={`day ${d.date === day ? 'active' : ''}`}
            disabled={d.freeSlots === 0}
            onClick={() => setDay(d.date)}
          >
            <span>{formatDay(d.date).split(' ')[0]}</span>
            <strong>{formatDay(d.date).split(' ')[1]}</strong>
            <small>{d.freeSlots === 0 ? 'Full' : `${d.freeSlots} free`}</small>
          </button>
        ))}
        <button
          type="button"
          className="strip-arrow"
          disabled={addDays(from, DAYS_SHOWN) > lastDay}
          onClick={() => setFrom(addDays(from, DAYS_SHOWN))}
          aria-label="Later days"
        >
          ›
        </button>
      </div>

      {days && !days.some((d) => d.freeSlots > 0) && <p className="muted">No free times in these two weeks. Try the next ones.</p>}
      {day && slots === null && <div className="spinner" aria-label="Loading times" />}
      {day && slots?.length === 0 && <p className="muted">That day just filled up. Pick another day.</p>}
      {day && slots?.length > 0 && (
        <div className="slot-groups">
          <h3>{formatDay(day, { long: true })}</h3>
          {groupSlots(slots).map((group) => (
            <div key={group.label} className="slot-group">
              <span className="slot-group-label">{group.label}</span>
              <div className="slots">
                {group.slots.map((s) => (
                  <button
                    key={s.startsAt}
                    type="button"
                    className={`slot ${selected?.startsAt === s.startsAt ? 'active' : ''}`}
                    onClick={() => onSelect({ ...s, date: day })}
                  >
                    {s.localTime}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
