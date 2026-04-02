import { http } from '@/api/http'
import { unwrapResult } from '@/utils/result'

export async function listMerchants(params) {
  const res = await http.get('/platform/merchants', { params })
  return unwrapResult(res)
}

export async function createMerchant(body) {
  const res = await http.post('/platform/merchants', body)
  return unwrapResult(res)
}

export async function getMerchantDetail(id) {
  const res = await http.get(`/platform/merchants/${id}`)
  return unwrapResult(res)
}

export async function updateMerchant(id, body) {
  const res = await http.put(`/platform/merchants/${id}`, body)
  return unwrapResult(res)
}

export async function disableMerchant(id) {
  const res = await http.patch(`/platform/merchants/${id}/disable`)
  return unwrapResult(res)
}

export async function enableMerchant(id) {
  const res = await http.patch(`/platform/merchants/${id}/enable`)
  return unwrapResult(res)
}

