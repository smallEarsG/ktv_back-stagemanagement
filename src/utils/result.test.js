import { describe, expect, it } from 'vitest'
import { unwrapResult } from '@/utils/result'

describe('unwrapResult', () => {
  it('returns data when code is 200', () => {
    const data = unwrapResult({
      data: { code: 200, msg: 'success', data: { ok: true } },
    })
    expect(data).toEqual({ ok: true })
  })

  it('throws error when code is not 200', () => {
    expect(() =>
      unwrapResult({ data: { code: 500, msg: 'boom' } }),
    ).toThrow('boom')
  })
})

