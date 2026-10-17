import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import MerchantProductsModal from './MerchantProductsModal.vue'
import { getMerchantProducts, saveMerchantProduct, saveMerchantApplication } from '@/api/merchant'
vi.mock('@/api/merchant', () => ({ getMerchantProducts: vi.fn(), saveMerchantProduct: vi.fn(), saveMerchantApplication: vi.fn() }))
const product = (store, version = 1) => ({ productType: 'MALL', name: `商城${store}`, granted: true, enabled: true, status: 'ACTIVE', expiresOn: '2027-10-17', version, application: { id: store * 10, applicationKey: `mall-${store}`, status: 'ACTIVE', version: 3 } })
let wrapper
const button = label => wrapper.findAll('button').find(item => item.text() === label)
function page(id = 1) { wrapper = mount(MerchantProductsModal, { props: { merchant: { id, name: `门店${id}` } }, global: { stubs: { teleport: true, MerchantWechatModal: true } } }); return wrapper }
beforeEach(() => { vi.clearAllMocks(); getMerchantProducts.mockImplementation(id => Promise.resolve({ products: [product(id)] })) })
afterEach(() => wrapper?.unmount())
it('does not let a late merchant read replace the selected merchant grant', async () => {
  let release
  getMerchantProducts.mockImplementation(id => id === 1 ? new Promise(resolve => { release = resolve }) : Promise.resolve({ products: [product(2, 8)] }))
  page(); await wrapper.setProps({ merchant: { id: 2, name: '门店2' } }); await flushPromises()
  release({ products: [product(1)] }); await flushPromises()
  await wrapper.find('input[name="productReason"]').setValue('年度续费')
  await wrapper.find('form').trigger('submit'); await flushPromises()
  expect(saveMerchantProduct.mock.calls[0][0]).toBe(2)
  expect(saveMerchantProduct.mock.calls[0][2].expectedVersion).toBe(8)
})
it('locks further writes after unknown result until a fresh server read', async () => {
  saveMerchantProduct.mockRejectedValue(new Error('连接中断'))
  page(); await flushPromises()
  await wrapper.find('input[name="productReason"]').setValue('开通商城')
  await wrapper.find('form').trigger('submit'); await flushPromises()
  expect(wrapper.find('[role="alert"]').text()).toContain('重新加载')
  await wrapper.find('form').trigger('submit'); await flushPromises()
  expect(saveMerchantProduct).toHaveBeenCalledTimes(1)
  await button('重新加载').trigger('click'); await flushPromises()
  expect(wrapper.find('input[name="productReason"]').element.value).toBe('')
})
it('application changes use their own identity and version', async () => {
  saveMerchantApplication.mockResolvedValue({})
  page(2); await flushPromises()
  await wrapper.find('input[name="applicationReason"]').setValue('商家暂停营业')
  await button('暂停应用').trigger('click'); await flushPromises()
  expect(saveMerchantApplication).toHaveBeenCalledWith(2, 20, { expectedVersion: 3, status: 'PAUSED', reason: '商家暂停营业' })
})
it('revoking a product also clears permission for new trades', async () => {
  saveMerchantProduct.mockResolvedValue({})
  page(); await flushPromises()
  await wrapper.find('input[name="granted"]').setValue(false)
  await wrapper.find('input[name="productReason"]').setValue('撤销授权')
  await wrapper.find('form').trigger('submit'); await flushPromises()
  expect(saveMerchantProduct.mock.calls[0][2].granted).toBe(false)
  expect(saveMerchantProduct.mock.calls[0][2].enabled).toBe(false)
})
