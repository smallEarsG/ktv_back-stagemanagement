import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ServiceTermModal from './ServiceTermModal.vue'
import ResetAdminModal from './ResetAdminModal.vue'
import { getTerm, saveTerm, listAdmins, resetAdmin } from '@/api/governance'

vi.mock('@/api/governance', () => ({ getTerm: vi.fn(), saveTerm: vi.fn(), listAdmins: vi.fn(), resetAdmin: vi.fn() }))
let wrapper
const term = (version, expiresOn = null) => ({ version, expiresOn, status: expiresOn ? 'ACTIVE' : 'UNLIMITED' })
const render = component => (wrapper = mount(component, { props: { merchant: { id: 1, name: '门店A' } }, global: { stubs: { teleport: true } } }))
const button = label => wrapper.findAll('button').find(item => item.text() === label)
beforeEach(() => { vi.resetAllMocks(); getTerm.mockResolvedValue(term(1)); listAdmins.mockResolvedValue([{ id: 31, name: '店长', username: 'owner-a' }]) })
afterEach(() => { wrapper?.unmount(); wrapper = null })

it('ignores a late service-term response from another store', async () => {
  let release
  getTerm.mockImplementation(id => id === 1 ? new Promise(resolve => { release = resolve }) : Promise.resolve(term(9, '2027-12-31')))
  render(ServiceTermModal)
  await wrapper.setProps({ merchant: { id: 2, name: '门店B' } }); await flushPromises()
  release(term(1, '2026-01-01')); await flushPromises()
  expect(wrapper.find('input[type="date"]').element.value).toBe('2027-12-31')
  await wrapper.find('input[type="text"]').setValue('续费一年')
  await wrapper.find('form').trigger('submit'); await flushPromises()
  expect(saveTerm).toHaveBeenCalledWith(2, expect.objectContaining({ version: 9, expiresOn: '2027-12-31' }))
})

it('keeps stale-write errors visible, and reloads the latest version before retry', async () => {
  render(ServiceTermModal); await flushPromises()
  saveTerm.mockRejectedValue(new Error('服务期限已变化，请重新加载后续费'))
  await wrapper.find('input[type="text"]').setValue('续费')
  await wrapper.find('form').trigger('submit'); await flushPromises()
  expect(wrapper.find('[role="alert"]').text()).toContain('重新加载')
  expect(wrapper.emitted('saved')).toBeUndefined()
  getTerm.mockResolvedValue(term(7))
  await button('重新加载').trigger('click'); await flushPromises()
  await wrapper.find('input[type="text"]').setValue('重新核对后续费')
  saveTerm.mockResolvedValue(term(8))
  await wrapper.find('form').trigger('submit'); await flushPromises()
  expect(saveTerm).toHaveBeenLastCalledWith(1, expect.objectContaining({ version: 7 }))
  expect(wrapper.emitted('saved')).toHaveLength(1)
})

it('blocks saving a term when its initial load failed', async () => {
  getTerm.mockRejectedValue(new Error('网络暂不可用'))
  render(ServiceTermModal); await flushPromises()
  await wrapper.find('form').trigger('submit')
  expect(saveTerm).not.toHaveBeenCalled()
  expect(button('保存服务期限').attributes('disabled')).toBeDefined()
})

it('clearly limits the legacy term editor to dining', async () => {
  render(ServiceTermModal); await flushPromises()
  expect(wrapper.text()).toContain('点餐服务期限')
  expect(wrapper.text()).toContain('商城')
  expect(wrapper.text()).toContain('产品与应用')
})

it('requires reauthentication, reason and confirmation, then wipes passwords even on uncertain failure', async () => {
  render(ResetAdminModal); await flushPromises()
  await wrapper.find('form').trigger('submit'); expect(resetAdmin).not.toHaveBeenCalled()
  await wrapper.findAll('input[type="password"]')[0].setValue('Operator123!')
  await wrapper.findAll('input[type="password"]')[1].setValue('Temporary123!')
  await wrapper.findAll('input[type="password"]')[2].setValue('Temporary123!')
  await wrapper.find('input[type="text"]').setValue('已核对店长身份')
  await wrapper.find('input[type="checkbox"]').setValue(true)
  expect(wrapper.findAllComponents({ name: 'UiInput' }).map(field => field.props('modelValue'))).toEqual(['Operator123!', 'Temporary123!', 'Temporary123!', '已核对店长身份'])
  let snapshot
  resetAdmin.mockImplementation((store, user, body) => { snapshot = structuredClone(body); return Promise.reject(new Error('结果未确认，请核对记录')) })
  await wrapper.find('form').trigger('submit'); await flushPromises()
  expect(wrapper.find('[role="alert"]').exists() ? wrapper.find('[role="alert"]').text() : '').toContain('结果未确认')
  expect(resetAdmin.mock.calls[0].slice(0, 2)).toEqual([1, 31])
  expect(snapshot.confirmed).toBe(true)
  expect(snapshot.operatorPassword).toBe('Operator123!')
  expect(wrapper.findAll('input[type="password"]').every(field => field.element.value === '')).toBe(true)
  expect(wrapper.find('[role="alert"]').text()).toContain('未确认')
})

it('never retains the previous merchant account or typed password on switching stores', async () => {
  render(ResetAdminModal); await flushPromises()
  await wrapper.find('input[type="password"]').setValue('transient')
  listAdmins.mockResolvedValue([{ id: 91, username: 'owner-b', name: 'B店长' }])
  await wrapper.setProps({ merchant: { id: 2, name: '门店B' } }); await flushPromises()
  expect(wrapper.find('input[type="password"]').element.value).toBe('')
  expect(wrapper.find('select').element.value).toBe('91')
  expect(wrapper.text()).not.toContain('owner-a')
})
