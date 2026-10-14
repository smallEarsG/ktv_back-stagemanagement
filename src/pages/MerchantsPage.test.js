import { afterEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import MerchantsPage from './MerchantsPage.vue'
import { getMerchantDetail, listMerchants, updateMerchant } from '@/api/merchant'
vi.mock('@/api/merchant', () => ({ createMerchant: vi.fn(), disableMerchant: vi.fn(), enableMerchant: vi.fn(), getMerchantDetail: vi.fn(), listMerchants: vi.fn(), updateMerchant: vi.fn() }))
let wrapper
function page() {
  listMerchants.mockResolvedValue({ list: [], total: 0 })
  wrapper = mount(MerchantsPage, { global: { stubs: ['AppHeader', 'MerchantTable', 'MerchantFormModal', 'MerchantWechatModal', 'ResetAdminModal', 'ServiceTermModal'] } })
}
afterEach(() => { wrapper?.unmount(); vi.resetAllMocks() })
it('does not save merchant B using a late response from merchant A', async () => {
  let release
  getMerchantDetail.mockImplementation(id => id === 1 ? new Promise(resolve => { release = resolve }) : Promise.resolve({ id: 2, name: '门店B' }))
  page(); await flushPromises()
  wrapper.findComponent({ name: 'MerchantTable' }).vm.$emit('edit', 1); await flushPromises()
  wrapper.findComponent({ name: 'MerchantTable' }).vm.$emit('edit', 2); await flushPromises()
  release({ id: 1, name: '门店A' }); await flushPromises()
  const modal = wrapper.findComponent({ name: 'MerchantFormModal' })
  expect(modal.props('initialValue').name).toBe('门店B')
  modal.vm.$emit('submit', { name: modal.props('initialValue').name }); await flushPromises()
  expect(updateMerchant).toHaveBeenCalledWith(2, { name: '门店B' })
})
it('refuses to save when merchant detail could not be read', async () => {
  getMerchantDetail.mockRejectedValue(new Error('详情读取失败'))
  page(); await flushPromises()
  wrapper.findComponent({ name: 'MerchantTable' }).vm.$emit('edit', 2); await flushPromises()
  const modal = wrapper.findComponent({ name: 'MerchantFormModal' })
  expect(modal.props('disabled')).toBe(true)
  modal.vm.$emit('submit', { name: '不完整表单' }); await flushPromises()
  expect(updateMerchant).not.toHaveBeenCalled()
})
