import React, { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import api from '../../api/api.js'
import Button from '../ui/Button.jsx'
import { Alert } from '../ui/Feedback.jsx'
import PasswordField from './PasswordField.jsx'
import { readApiError } from '../../utils/apiError.js'
import { passwordGuidance, passwordProblem } from '../../utils/password.js'

// Change-password form shared by the customer and administrator security pages and the auction profile.
// Same rules as sign-up and reset: the server's policy answer is shown next to the field it is about.
export default function ChangePasswordForm({ idPrefix = 'change-password' }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const set = key => value => { setSaved(false); setForm(current => ({ ...current, [key]: value })) }

  const submit = async event => {
    event.preventDefault()
    if (saving) return
    setSaved(false)
    if (!form.current) return setErrors({ current: 'Enter your current password.' })
    const problem = passwordProblem(form.next)
    if (problem) return setErrors({ password: problem.message })
    if (form.next !== form.confirm) return setErrors({ confirm: 'Passwords do not match.' })
    setErrors({})
    setSaving(true)
    try {
      await api.post('/auth/change-password', { current: form.current, newPassword: form.next })
      setForm({ current: '', next: '', confirm: '' })
      setSaved(true)
    } catch (error) {
      const failure = readApiError(error, 'Could not update your password.')
      const fields = failure.fieldErrors
      if (fields.current || fields.password) setErrors({ current: fields.current, password: fields.password })
      else setErrors({ form: failure.message })
    } finally {
      setSaving(false)
    }
  }

  const guidance = passwordGuidance(form.next)

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {errors.form && <Alert tone="error">{errors.form}</Alert>}
      <PasswordField id={`${idPrefix}-current`} label="Current password" autoComplete="current-password" value={form.current} onChange={set('current')} error={errors.current} maxLength={128} />
      <PasswordField id={`${idPrefix}-new`} label="New password" value={form.next} onChange={set('next')} error={errors.password} hint={guidance.text} hintTone={guidance.tone} maxLength={128} />
      <PasswordField id={`${idPrefix}-confirm`} label="Confirm new password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} maxLength={128} />
      {saved && <p role="status" className="text-green-700 text-sm flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Password updated. Your other devices were signed out.</p>}
      <Button type="submit" loading={saving}>Update password</Button>
    </form>
  )
}
