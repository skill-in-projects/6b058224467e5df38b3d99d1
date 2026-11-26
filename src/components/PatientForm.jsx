import { useRef, useState } from 'react'

const MAX_NOTES = 500
const EMOJIS = ['🙂', '😀', '😅', '😊', '😐', '😟', '😢', '😷', '🤒', '🤕', '🙏', '👍', '❤️', '⏰']

const FIELDS = [
  { name: 'name', label: 'Full name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', hint: 'Your confirmation and the link to manage it go here.' },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', hint: 'Only used if the clinic needs to reach you.' },
]

/** The patient's details. Server field errors (400 "invalid") are shown under each field; the form keeps what was typed. */
export default function PatientForm({ busy, fieldErrors = {}, onSubmit }) {
  const [values, setValues] = useState({ name: '', email: '', phone: '', notes: '' })
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }))
  const [emojisOpen, setEmojisOpen] = useState(false)
  const notesRef = useRef(null)

  /** Puts the emoji where the cursor is in the notes box (or at the end), and keeps the cursor after it. */
  const addEmoji = (emoji) => {
    const box = notesRef.current
    const start = box?.selectionStart ?? values.notes.length
    const end = box?.selectionEnd ?? start
    const next = values.notes.slice(0, start) + emoji + values.notes.slice(end)
    if (next.length > MAX_NOTES) return
    setValues((v) => ({ ...v, notes: next }))
    requestAnimationFrame(() => {
      box?.focus()
      box?.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }

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
        <textarea ref={notesRef} name="notes" rows={3} maxLength={MAX_NOTES} value={values.notes} onChange={set('notes')} />
        {fieldErrors.notes && <small className="error">{fieldErrors.notes}</small>}
      </label>
      <div className="emoji-picker">
        <button type="button" className="emoji-toggle" aria-expanded={emojisOpen} onClick={() => setEmojisOpen((o) => !o)}>
          🙂 {emojisOpen ? 'Hide emojis' : 'Add an emoji'}
        </button>
        {emojisOpen && (
          <div className="emoji-list" role="group" aria-label="Emojis to add to your note">
            {EMOJIS.map((emoji) => (
              <button key={emoji} type="button" aria-label={`Add ${emoji}`} onClick={() => addEmoji(emoji)}>{emoji}</button>
            ))}
          </div>
        )}
      </div>
      <button className="primary" type="submit" disabled={busy}>
        {busy ? 'Booking...' : 'Confirm booking'}
      </button>
    </form>
  )
}
