export const secretFields = ['appSecret', 'privateKeyPem', 'apiV3Key', 'publicKeyPem']
const publicFields = ['enabled', 'appId', 'paymentEnabled', 'merchantId', 'merchantSerialNumber', 'publicKeyId', 'notifyBaseUrl']

export function emptyWechatForm() {
  return { enabled: false, paymentEnabled: false, appId: '', appSecret: '', merchantId: '', merchantSerialNumber: '', privateKeyPem: '', apiV3Key: '', publicKeyPem: '', publicKeyId: '', notifyBaseUrl: '' }
}

export function editableWechatConfig(config) {
  const form = emptyWechatForm()
  for (const field of publicFields) if (config?.[field] !== undefined) form[field] = config[field]
  return form
}

export function wechatPayload(form, version) {
  const body = { expectedVersion: Number(version || 0) }
  for (const field of [...publicFields, ...secretFields]) {
    if (typeof form[field] === 'boolean') body[field] = form[field]
    else body[field] = String(form[field] || '').trim()
  }
  return body
}
