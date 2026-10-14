import { http } from './http'
import { unwrapResult } from '@/utils/result'
export const changePassword = body => http.post('/auth/password', body).then(unwrapResult)
export const listAdmins = store => http.get(`/platform/merchants/${store}/admins`).then(unwrapResult)
export const resetAdmin = (store, id, body) => http.post(`/platform/merchants/${store}/admins/${id}/reset-password`, body).then(unwrapResult)
export const getTerm = store => http.get(`/platform/merchants/${store}/service`).then(unwrapResult)
export const saveTerm = (store, body) => http.put(`/platform/merchants/${store}/service`, body).then(unwrapResult)
export const listTerms = params => http.get('/platform/subscriptions', { params }).then(unwrapResult)
export const listAudit = params => http.get('/platform/audit', { params }).then(unwrapResult)
