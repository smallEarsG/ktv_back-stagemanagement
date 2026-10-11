import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import MerchantWechatModal from './MerchantWechatModal.vue'
import { getMerchantWechat, saveMerchantWechat } from '@/api/merchant'

vi.mock('@/api/merchant', () => ({ getMerchantWechat: vi.fn(), saveMerchantWechat: vi.fn() }))
const config = (storeId, version = 1) => ({ storeId, version, enabled: true, paymentEnabled: false, appId: `wx-store-${storeId}`, merchantId: '', dataKeyReady: true, loginReady: true, hasAppSecret: true })
let wrapper
function page(storeId = 1) {
  wrapper = mount(MerchantWechatModal, { props: { open: true, storeId }, global: { stubs: { teleport: true } } })
  return wrapper
}
const button = label => wrapper.findAll('button').find(item => item.text() === label)
beforeEach(() => { vi.clearAllMocks(); getMerchantWechat.mockImplementation(storeId => Promise.resolve(config(storeId))) })
afterEach(() => { wrapper?.unmount(); wrapper = null })

it('does not show stored secrets even if an unexpected response contains them', async () => {
  getMerchantWechat.mockResolvedValue({ ...config(1), appSecret: 'must-not-render', privateKeyPem: 'must-not-render' })
  page(); await flushPromises()
  expect(wrapper.find('input[name="appSecret"]').element.value).toBe('')
  expect(wrapper.find('textarea[name="privateKeyPem"]').element.value).toBe('')
  expect(wrapper.html()).not.toContain('must-not-render')
})

it('ignores a late read from the previously selected merchant', async () => {
  let release
  getMerchantWechat.mockImplementation(storeId => storeId === 1 ? new Promise(resolve => { release = resolve }) : Promise.resolve(config(2)))
  page(); await wrapper.setProps({ storeId: 2 }); await flushPromises()
  release(config(1)); await flushPromises()
  expect(wrapper.find('input[name="appId"]').element.value).toBe('wx-store-2')
})

it('sends the selected store and original version, then wipes the new secret', async () => {
  let payload
  saveMerchantWechat.mockImplementation((storeId, body) => { payload = structuredClone(body); return Promise.resolve(config(storeId, 2)) })
  page(2); await flushPromises()
  await wrapper.find('input[name="appSecret"]').setValue('new-test-secret')
  await button('保存此门店配置').trigger('click'); await flushPromises()
  expect(saveMerchantWechat.mock.calls[0][0]).toBe(2)
  expect(payload.expectedVersion).toBe(1)
  expect(payload.appSecret).toBe('new-test-secret')
  expect(payload.apiV3Key).toBe('')
  expect(wrapper.find('input[name="appSecret"]').element.value).toBe('')
  expect(wrapper.emitted('saved')).toEqual([[2]])
})

it('keeps a conflict visible, and a reload picks up the new version with empty secrets', async () => {
  saveMerchantWechat.mockRejectedValue(new Error('配置已被其他管理员更新，请重新加载'))
  page(); await flushPromises()
  await wrapper.find('input[name="appSecret"]').setValue('unsaved-secret')
  await button('保存此门店配置').trigger('click'); await flushPromises()
  expect(wrapper.find('[role="alert"]').text()).toContain('其他管理员更新')
  expect(wrapper.emitted('saved')).toBeUndefined()
  getMerchantWechat.mockResolvedValue(config(1, 7))
  await button('重新加载').trigger('click'); await flushPromises()
  expect(wrapper.find('input[name="appSecret"]').element.value).toBe('')
  let version
  saveMerchantWechat.mockImplementation((id, body) => { version = body.expectedVersion; return Promise.resolve(config(id, 8)) })
  await button('保存此门店配置').trigger('click'); await flushPromises()
  expect(version).toBe(7)
})

it('closing and reopening does not retain the previous secret or configuration', async () => {
  page(); await flushPromises(); await wrapper.find('input[name="appSecret"]').setValue('transient-secret')
  await button('关闭').trigger('click'); await wrapper.setProps({ open: false })
  getMerchantWechat.mockRejectedValue(new Error('读取失败'))
  await wrapper.setProps({ open: true, storeId: 2 }); await flushPromises()
  expect(wrapper.find('input[name="appSecret"]').exists()).toBe(false)
  expect(wrapper.html()).not.toContain('transient-secret')
  expect(button('保存此门店配置').attributes('disabled')).toBeDefined()
})
