// Dates are shown in the clinic's time zone, not the browser's: a patient abroad booking a visit at home must see the
// clinic's clock. The server sends the zone in GET /api/clinic.

export function formatPrice(cents) {
  if (!cents) return 'Covered'
  return new Intl.NumberFormat('en-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(cents / 100)
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

/** "2026-12-01" -> "Tue 1 Dec". Built from the parts so the browser's zone cannot move it to another day. */
export function formatDay(isoDate, { long = false } = {}) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  return new Intl.DateTimeFormat('en-GB', {
    weekday: long ? 'long' : 'short',
    day: 'numeric',
    month: long ? 'long' : 'short',
    timeZone: 'UTC',
  }).format(date)
}

/** A UTC instant as clinic-local time, for example "09:15". */
export function formatTime(utcIso, timeZone) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(new Date(utcIso))
}

/** A UTC instant as clinic-local day and time, for example "Mon 30 Nov, 09:00". */
export function formatDateTime(utcIso, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone,
  }).formatToParts(new Date(utcIso))
  const get = (type) => parts.find((p) => p.type === type)?.value
  return `${get('weekday')} ${get('day')} ${get('month')}, ${get('hour')}:${get('minute')}`
}

/** "2026-12-01" plus n days, as "yyyy-mm-dd". */
export function addDays(isoDate, n) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

/** Morning / afternoon / evening groups for the slot grid, by the clinic-local hour already sent by the server. */
export function groupSlots(slots) {
  const groups = [
    { label: 'Morning', slots: [] },
    { label: 'Afternoon', slots: [] },
    { label: 'Evening', slots: [] },
  ]
  for (const slot of slots) {
    const hour = Number(slot.localTime.slice(0, 2))
    groups[hour < 12 ? 0 : hour < 17 ? 1 : 2].slots.push(slot)
  }
  return groups.filter((g) => g.slots.length > 0)
}
