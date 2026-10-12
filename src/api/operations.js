import { http } from '@/api/http'
import { unwrapResult } from '@/utils/result'

export async function getOperationsSummary() { return unwrapResult(await http.get('/platform/operations/summary')) }
export async function listIncidents(params) { return unwrapResult(await http.get('/platform/operations/incidents', { params })) }
export async function acknowledgeIncident(row) { return unwrapResult(await http.post(`/platform/operations/incidents/${encodeURIComponent(row.id)}/acknowledge`, { occurrences: row.occurrences })) }
