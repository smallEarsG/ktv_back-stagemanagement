import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import OperationsPage from './OperationsPage.vue'
import { getOperationsSummary, listIncidents, acknowledgeIncident } from '@/api/operations'
vi.mock('@/api/operations', () => ({ getOperationsSummary: vi.fn(), listIncidents: vi.fn(), acknowledgeIncident: vi.fn() }))
let wrapper
const health = () => ({ databaseReady: true, storageReady: true, errorCount: 1, unresolvedCount: 1, slowCount: 0, heartbeat: { state: 'OK' }, backup: { state: 'STALE', encrypted: true }, restore: { state: 'MISSING' }, loadTest: { state: 'MISSING' } })
const mountPage = () => { wrapper = mount(OperationsPage, { global: { stubs: { AppHeader: true, teleport: true } } }); return wrapper }
beforeEach(() => { vi.clearAllMocks(); getOperationsSummary.mockResolvedValue(health()); listIncidents.mockResolvedValue({ total: 0, list: [] }) })
afterEach(() => { wrapper?.unmount() })
it('keeps stale backup and missing restore visible even when incident history cannot load', async () => { listIncidents.mockRejectedValue(new Error('监控记录暂时不可读')); mountPage(); await flushPromises(); expect(wrapper.text()).toContain('记录已过期'); expect(wrapper.text()).toContain('尚无记录'); expect(wrapper.text()).toContain('监控记录暂时不可读'); expect(wrapper.text()).not.toContain('所选范围暂无异常记录') })
it('acknowledges only the occurrence count the administrator actually reviewed', async () => {
  const row = { id: 'incident-id', occurrences: 3, storeId: 7, route: '/api/orders/:value', severity: 'ERROR', source: 'SERVER', kind: 'HTTP_SERVER', httpStatus: 500, businessCode: 500 }
  listIncidents.mockResolvedValue({ total: 1, list: [row] }); mountPage(); await flushPromises()
  await wrapper.findAll('button').find(b => b.text() === '标记已处理').trigger('click'); await flushPromises()
  expect(acknowledgeIncident).toHaveBeenCalledWith(expect.objectContaining({ id: 'incident-id', occurrences: 3 }))
})
it('ignores a late history response after a newer filter request', async () => {
  let release
  listIncidents.mockImplementationOnce(() => new Promise(resolve => { release = resolve }))
  mountPage(); await flushPromises(); await wrapper.find('input[type="number"]').setValue(7); await wrapper.find('form').trigger('submit'); await flushPromises()
  release({ total: 1, list: [{ id: 'stale', source: 'SERVER', kind: 'HTTP_SERVER', route: '/stale-record' }] }); await flushPromises()
  expect(wrapper.text()).not.toContain('/stale-record'); expect(listIncidents.mock.calls[1][0].storeId).toBe(7)
})
