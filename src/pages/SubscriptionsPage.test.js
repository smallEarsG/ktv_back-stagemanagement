import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SubscriptionsPage from './SubscriptionsPage.vue'
import { http } from '@/api/http'

vi.mock('@/api/http', () => ({ http: { get: vi.fn() } }))
const result = { list: [{ id: 1, name: '测试餐馆', isActive: true, productType: 'MALL', status: 'EXPIRING', expiresOn: '2026-10-20', daysRemaining: 3, application: { id: 12 } }], total: 1, counts: [{ serviceStatus: 'EXPIRING', count: 1 }] }
const render = () => mount(SubscriptionsPage, { global: { stubs: { AppHeader: true, MerchantProductsModal: true, UiButton: { props: ['disabled', 'loading', 'type'], template: '<button :disabled="disabled || loading" :type="type || \'button\'"><slot /></button>' } } } })
describe('product renewal worklist', () => {
  beforeEach(() => { http.get.mockReset(); http.get.mockResolvedValue({ data: { code: 200, data: result } }) })
  it('shows independent mall subscriptions and opens the matching product for renewal', async () => {
    const wrapper = render(); await flushPromises()
    expect(http.get).toHaveBeenCalledWith('/platform/product-subscriptions', { params: { business: 'ALL', status: 'ALL', keyword: '', page: 1 } })
    expect(wrapper.text()).toContain('商城服务'); expect(wrapper.text()).toContain('测试餐馆'); expect(wrapper.text()).toContain('剩余 3 天')
    await wrapper.findAll('button').find(button => button.text() === '去续费').trigger('click')
    expect(wrapper.findComponent({ name: 'MerchantProductsModal' }).props('initialProduct')).toBe('MALL')
    wrapper.unmount()
  })
  it('filters by product and keeps a failed request visibly retryable', async () => {
    const wrapper = render(); await flushPromises()
    await wrapper.find('select[aria-label="业务产品"]').setValue('MALL'); await flushPromises()
    expect(http.get.mock.lastCall[1].params.business).toBe('MALL')
    http.get.mockRejectedValueOnce(new Error('服务暂时不可用'))
    await wrapper.findAll('button').find(button => button.text() === '刷新列表').trigger('click'); await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('服务暂时不可用')
    expect(wrapper.findAll('tbody tr').length).toBe(1)
    wrapper.unmount()
  })
})
