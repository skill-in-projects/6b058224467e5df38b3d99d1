import { useState } from 'react'

const FIELDS = [
  { name: 'name', label: 'Full name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', hint: 'Your confirmation and the link to manage it go here.' },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', hint: 'Only used if the clinic needs to reach you.' },
]

/** The patient's details. Server field errors (400 "invalid") are shown under each field; the form keeps what was typed. */
export default function PatientForm({ busy, fieldErrors = {}, onSubmit }) {
  const [values, setValues] = useState({ name: '', email: '', phone: '', notes: '' })
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }))

  return (
    <form
      className="patient-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(values)
      }}
    >
      {FIELDS.map((f) => (
        <label key={f.name} className={fieldErrors[f.name] ? 'invalid' : ''}>
          <span>{f.label}</span>
          <input
            name={f.name}
            type={f.type || 'text'}
            autoComplete={f.autoComplete}
            value={values[f.name]}
            onChange={set(f.name)}
            aria-invalid={Boolean(fieldErrors[f.name])}
            required
          />
          {fieldErrors[f.name] ? <small className="error">{fieldErrors[f.name]}</small> : f.hint && <small className="muted">{f.hint}</small>}
        </label>
      ))}
      <label className={fieldErrors.notes ? 'invalid' : ''}>
        <span>Anything the clinic should know? (optional)</span>
        <textarea name="notes" rows={3} maxLength={500} value={values.notes} onChange={set('notes')} />
        {fieldErrors.notes && <small className="error">{fieldErrors.notes}</small>}
      </label>
      <button className="primary" type="submit" disabled={busy}>
        {busy ? 'Booking...' : 'Confirm booking'}
      </button>
    </form>
  )
}
