import { expect, it } from 'vitest'
import { actionLabels, auditSnapshot, extendTerm, validatePasswordForm } from './governance'

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

it('distinguishes a product trading switch even when the application is already paused', () => {
  const before = { productType: 'MALL', granted: true, enabled: true, status: 'PAUSED', expiresOn: '2027-10-19', canTrade: false }
  const after = { ...before, enabled: false, appSecret: 'never-render-this', applicationKey: 'never-render-this-key' }
  const previous = auditSnapshot(before, 'PRODUCT_GRANT'), next = auditSnapshot(after, 'PRODUCT_GRANT')
  expect(next).not.toBe(previous)
  expect(previous).toContain('商城')
  expect(previous).toContain('新增交易开关：开启')
  expect(next).toContain('新增交易开关：关闭')
  expect(next).toContain('产品授权：已开通')
  expect(next).toContain('已暂停')
  expect(next).not.toContain('never-render')
})

it('names application state changes and makes both new actions available as audit filters', () => {
  expect(actionLabels.PRODUCT_GRANT).toBe('调整产品授权')
  expect(actionLabels.APPLICATION_STATE).toBe('调整应用状态')
  expect(auditSnapshot({ productType: 'DINING', status: 'ACTIVE', version: 9 }, 'APPLICATION_STATE')).toBe('业务产品：点餐；应用状态：启用')
  expect(auditSnapshot({ productType: 'MALL', status: 'PAUSED' }, 'APPLICATION_STATE')).toBe('业务产品：商城；应用状态：暂停')
})
