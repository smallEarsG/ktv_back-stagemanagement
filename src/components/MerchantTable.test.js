import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MerchantTable from './MerchantTable.vue'

it('opens product selection from renewal instead of silently renewing dining', async () => {
  const row = { id: 42, name: '商城门店', isActive: true }
  const wrapper = mount(MerchantTable, { props: { rows: [row] } })
  try {
    const renewal = wrapper.findAll('button').find(button => button.text() === '服务续费')
    expect(renewal).toBeDefined()
    await renewal.trigger('click')
    expect(wrapper.emitted('products')).toEqual([[row]])
    expect(wrapper.emitted('service')).toBeUndefined()
  } finally { wrapper.unmount() }
})
