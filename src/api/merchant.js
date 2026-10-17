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

export async function getMerchantWechat(storeId) {
  return unwrapResult(await http.get(`/platform/stores/${encodeURIComponent(storeId)}/wechat`))
}

export async function saveMerchantWechat(storeId, body) {
  return unwrapResult(await http.put(`/platform/stores/${encodeURIComponent(storeId)}/wechat`, body))
}

const merchantPath = id => `/platform/merchants/${encodeURIComponent(id)}`
export async function getMerchantProducts(id) {
  return unwrapResult(await http.get(`${merchantPath(id)}/products`))
}
export async function saveMerchantProduct(id, product, body) {
  return unwrapResult(await http.put(`${merchantPath(id)}/products/${encodeURIComponent(product)}`, body))
}
export async function getMerchantApplication(id, application) {
  return unwrapResult(await http.get(`${merchantPath(id)}/applications/${encodeURIComponent(application)}`))
}
export async function saveMerchantApplication(id, application, body) {
  return unwrapResult(await http.put(`${merchantPath(id)}/applications/${encodeURIComponent(application)}`, body))
}
export async function getApplicationWechat(id, application) {
  return unwrapResult(await http.get(`${merchantPath(id)}/applications/${encodeURIComponent(application)}/wechat`))
}
export async function saveApplicationWechat(id, application, body) {
  return unwrapResult(await http.put(`${merchantPath(id)}/applications/${encodeURIComponent(application)}/wechat`, body))
}

