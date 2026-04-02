import { http } from '@/api/http'
import { unwrapResult } from '@/utils/result'

export async function login(body) {
  const res = await http.post('/auth/login', body)
  return unwrapResult(res)
}

export async function getCurrentUser() {
  const res = await http.get('/auth/user')
  return unwrapResult(res)
}

