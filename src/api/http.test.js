import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('VITE_API_BASE_URL', '/demo/api')
  vi.stubEnv('BASE_URL', '/demo/platform/')
  vi.stubGlobal('window', { location: { pathname: '/demo/platform/login', search: '', hash: '', replace: vi.fn() } })
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

async function rejectedLogin(data) {
  const { createHttpClient } = await import('./http.js')
  try {
    await createHttpClient().post('/auth/login', {}, { adapter: async config => {
      throw new AxiosError('Request failed with status code 401', 'ERR_BAD_REQUEST', config, null, { status: 401, data, config })
    } })
  } catch (error) { return error }
}
it('explains a demo gateway HTML 401 and offers entry renewal', async () => {
  const error = await rejectedLogin('<html><h1>401 Authorization Required</h1></html>')
  expect(error.message).toContain('演示入口验证已过期')
  expect(error.demoEntryExpired).toBe(true)
})
it('does not confuse a business authentication response with gateway expiry', async () => {
  const error = await rejectedLogin({ code: 401, message: '账号或密码不正确' })
  expect(error.demoEntryExpired).not.toBe(true)
  expect(error.message).toBe('账号或密码不正确')
})
