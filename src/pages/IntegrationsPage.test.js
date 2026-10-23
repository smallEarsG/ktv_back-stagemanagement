import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import IntegrationsPage from './IntegrationsPage.vue'
import { getMerchantProducts, listMerchants } from '@/api/merchant'
import { http } from '@/api/http'

vi.mock('@/api/merchant', () => ({ getMerchantProducts: vi.fn(), listMerchants: vi.fn() }))
vi.mock('@/api/http', () => ({ http: { get: vi.fn(), post: vi.fn() } }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ user: { id: 7 } }) }))

let wrapper
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const products = id => ({ products: [{ application: { id, productType: 'MALL' } }] })
const render = async () => { wrapper = mount(IntegrationsPage, { global: { stubs: { AppHeader: true, UiModal: true } } }); await flushPromises(); return wrapper }
const selectStore = id => wrapper.find('select').setValue(String(id))
const appLabels = () => wrapper.findAll('label').filter(label => label.text().includes('商城 · 应用'))

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear()
  listMerchants.mockResolvedValue({ list: [{ id: 1, name: '商家甲' }, { id: 2, name: '商家乙' }] })
  http.get.mockResolvedValue({ data: { code: 200, data: { list: [] } } })
  http.post.mockResolvedValue({ data: { code: 200, data: { mode: 'MOCK' } } })
})
afterEach(() => wrapper?.unmount())

it('keeps the selected merchant applications when an earlier request completes late', async () => {
  const old = deferred(), current = deferred()
  getMerchantProducts.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise)
  await render(); await selectStore(1); await selectStore(2)
  current.resolve(products(202)); await flushPromises()
  old.resolve(products(101)); await flushPromises()
  expect(appLabels().map(label => label.text())).toEqual(['商城 · 应用 #202登记授权'])
  expect(wrapper.find('select').element.value).toBe('2')
})

it('ignores a late error from another merchant', async () => {
  const old = deferred()
  getMerchantProducts.mockReturnValueOnce(old.promise).mockResolvedValueOnce(products(202))
  await render(); await selectStore(1); await selectStore(2); await flushPromises()
  old.reject(new Error('商家甲加载失败')); await flushPromises()
  expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  expect(appLabels()[0].text()).toContain('#202')
})

it('clears the previous merchant authorization editor immediately on switching', async () => {
  const current = deferred()
  getMerchantProducts.mockResolvedValueOnce(products(101)).mockReturnValueOnce(current.promise)
  await render(); await selectStore(1); await flushPromises()
  await appLabels()[0].find('button').trigger('click')
  expect(wrapper.text()).toContain('应用 #101 授权记录')
  await selectStore(2)
  expect(wrapper.text()).not.toContain('应用 #101 授权记录')
  expect(appLabels()).toHaveLength(0)
  current.resolve(products(202)); await flushPromises()
  expect(wrapper.text()).not.toContain('应用 #101 授权记录')
})

it('keeps applications empty when the merchant selection is cleared during loading', async () => {
  const old = deferred()
  getMerchantProducts.mockReturnValueOnce(old.promise)
  await render(); await selectStore(1); await selectStore('')
  old.resolve(products(101)); await flushPromises()
  expect(appLabels()).toHaveLength(0)
})
