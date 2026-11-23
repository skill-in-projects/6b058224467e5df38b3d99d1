import { formatDateTime, formatDay, formatDuration, formatPrice } from '../lib/format.js'
import { useClinic } from '../clinic.jsx'

const STATUS = {
  booked: null,
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'Missed',
}

export default function AppointmentSummary({ appointment: a }) {
  const clinic = useClinic()
  return (
    <dl className="card summary">
      {STATUS[a.status] && <div className={`badge ${a.status}`}>{STATUS[a.status]}</div>}
      <div><dt>What</dt><dd>{a.service.name} ({formatDuration(a.service.durationMinutes)})</dd></div>
      <div><dt>With</dt><dd>{a.practitionerName}</dd></div>
      <div><dt>When</dt><dd>{formatDay(a.localDate, { long: true })} at {a.localTime}</dd></div>
      <div><dt>Price</dt><dd>{formatPrice(a.service.priceCents)}</dd></div>
      {a.status === 'booked' && (
        <p className="muted small">
          You can move or cancel online until {formatDateTime(a.changeDeadline, clinic.timeZoneId)}.
        </p>
      )}
    </dl>
  )
}
