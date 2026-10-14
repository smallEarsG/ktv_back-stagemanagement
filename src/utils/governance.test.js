import { expect, it } from 'vitest'
import { auditSnapshot, extendTerm, validatePasswordForm } from './governance'

it('renews from a future expiry and clamps month ends, or renews an expired store from today', () => {
  expect(extendTerm('2028-02-29', 12, '2026-10-14')).toBe('2029-02-28')
  expect(extendTerm('2026-10-31', 3, '2026-10-14')).toBe('2027-01-31')
  expect(extendTerm('2026-01-01', 12, '2026-10-14')).toBe('2027-10-14')
})

it('checks UTF8 password limits and explicit reset authorization before submitting', () => {
  const form = { currentPassword: 'old', newPassword: '中'.repeat(24), confirmPassword: '中'.repeat(24) }
  expect(validatePasswordForm(form)).toBe('')
  expect(validatePasswordForm({ ...form, newPassword: '中'.repeat(25) })).toContain('72')
  expect(validatePasswordForm(form, true)).toContain('确认重置')
  expect(validatePasswordForm({ ...form, operatorPassword: 'operator', reason: '身份已核对', confirmed: true }, true)).toBe('')
})

it('renders readable history without credential or internal version fields', () => {
  const text = auditSnapshot({ active: false, permissions: ['pos:view'], version: 12, passwordHash: 'must-not-render' })
  expect(text).toContain('停用')
  expect(text).toContain('收银')
  expect(text).not.toContain('12')
  expect(text).not.toContain('must-not-render')
})
