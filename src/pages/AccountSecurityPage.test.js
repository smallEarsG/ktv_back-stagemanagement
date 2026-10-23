import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import AccountSecurityPage from './AccountSecurityPage.vue'
import { changePassword } from '@/api/governance'

const fixture = vi.hoisted(() => ({ auth:null, replace:vi.fn() }))
vi.mock('@/stores/auth', () => ({ useAuthStore:()=>fixture.auth }))
vi.mock('@/api/governance', () => ({ changePassword:vi.fn() }))
vi.mock('vue-router', () => ({ useRouter:()=>({replace:fixture.replace}) }))
let wrapper
beforeEach(()=> { vi.clearAllMocks();fixture.auth=reactive({token:'session-A',sessionGeneration:1,user:{id:1},logout:vi.fn()}) })
afterEach(()=>wrapper?.unmount())
async function submit() {
  wrapper=mount(AccountSecurityPage,{global:{stubs:{AppHeader:true}}})
  const fields=wrapper.findAll('input')
  await fields[0].setValue('current-example');await fields[1].setValue('new-example-123');await fields[2].setValue('new-example-123')
  await wrapper.find('form').trigger('submit')
}
it.each(['success','failure'])('ignores old password %s after leaving and logging in again',async outcome=>{
  let resolve,reject;changePassword.mockReturnValue(new Promise((yes,no)=>{resolve=yes;reject=no}))
  await submit();wrapper.unmount();fixture.auth.token='session-B';fixture.auth.sessionGeneration++
  if(outcome==='success')resolve({});else reject(new Error('old failure'))
  await flushPromises();expect(fixture.auth.logout).not.toHaveBeenCalled();expect(fixture.replace).not.toHaveBeenCalled()
})
it('still logs out the current mounted session after successful change',async()=>{
  changePassword.mockResolvedValue({});await submit();await flushPromises()
  expect(fixture.auth.logout).toHaveBeenCalledTimes(1);expect(fixture.replace).toHaveBeenCalledWith({path:'/login',query:{reason:'password-changed'}})
})
