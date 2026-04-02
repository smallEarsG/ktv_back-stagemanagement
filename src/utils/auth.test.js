import { beforeEach, describe, expect, it } from 'vitest'
import { clearAuth, getToken, getUser, setToken, setUser } from '@/utils/auth'

describe('auth utils', () => {
  beforeEach(() => {
    clearAuth()
  })

  it('stores and reads token', () => {
    expect(getToken()).toBe('')
    setToken('t1')
    expect(getToken()).toBe('t1')
  })

  it('stores and reads user', () => {
    expect(getUser()).toBe(null)
    setUser({ id: 1, username: 'admin' })
    expect(getUser()).toEqual({ id: 1, username: 'admin' })
  })
})

