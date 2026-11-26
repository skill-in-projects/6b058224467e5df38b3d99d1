// One place for every call to the backend. Errors come back as { code, message, fields } (see ApiError on the server),
// so screens can show the server's sentence, or map a code to their own text.

const base = () => (window.CONFIG?.API_URL || '').replace(/\/$/, '')

export const RESTING_EVENT = 'clinic:resting'

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || 'Something went wrong. Please try again.')
    this.status = status
    this.code = body?.code || 'unknown'
    this.fields = body?.fields || {}
  }
}

async function request(path, { method = 'GET', body, staffKey, signal } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (staffKey) headers['X-Staff-Key'] = staffKey
  let response
  try {
    response = await fetch(base() + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(0, { code: 'offline', message: 'We could not reach the clinic. Check your connection and try again.' })
  }
  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  // The database is over its limit for now: App swaps every screen for one calm message.
  if (response.status === 503 && data?.code === 'database_resting') window.dispatchEvent(new Event(RESTING_EVENT))
  if (!response.ok) throw new ApiError(response.status, data)
  return data
}

const query = (params) => new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null)).toString()

export const api = {
  clinic: () => request('/api/clinic'),
  services: () => request('/api/services'),
  practitioners: (serviceId) => request(`/api/practitioners?${query({ serviceId })}`),
  days: (serviceId, practitionerId, from, days = 14, signal) =>
    request(`/api/availability/days?${query({ serviceId, practitionerId, from, days })}`, { signal }),
  slots: (serviceId, practitionerId, date, signal) => request(`/api/availability?${query({ serviceId, practitionerId, date })}`, { signal }),
  book: (booking) => request('/api/appointments', { method: 'POST', body: booking }),
  appointment: (token) => request(`/api/appointments/manage/${encodeURIComponent(token)}`),
  cancel: (token, reason) => request(`/api/appointments/manage/${encodeURIComponent(token)}/cancel`, { method: 'POST', body: { reason } }),
  reschedule: (token, startsAt) =>
    request(`/api/appointments/manage/${encodeURIComponent(token)}/reschedule`, { method: 'POST', body: { startsAt } }),
  minutes: (from, days = 7) => request(`/api/stats/minutes?${query({ from, days })}`),
  staffDay: (key, date) => request(`/api/staff/day?${query({ date })}`, { staffKey: key }),
  staffStatus: (key, id, status, reason) =>
    request(`/api/staff/appointments/${id}/status`, { method: 'POST', body: { status, reason }, staffKey: key }),
  addTimeOff: (key, timeOff) => request('/api/staff/time-off', { method: 'POST', body: timeOff, staffKey: key }),
  deleteTimeOff: (key, id) => request(`/api/staff/time-off/${id}`, { method: 'DELETE', staffKey: key }),
}
