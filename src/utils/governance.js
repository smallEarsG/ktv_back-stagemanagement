import { scopedPermissionLabels } from './scoped-permission-labels.js'
export const serviceLabels = { UNLIMITED: '无期限', ACTIVE: '服务中', EXPIRING: '30天内到期', EXPIRED: '已到期', PAUSED: '已暂停', NOT_OPEN: '未开通／授权已撤销' }
export const actionLabels = { ACCOUNT_CHANGE: '本人改密', ACCOUNT_RESET: '受控重置密码', STAFF_CREATE: '新增员工', STAFF_DELETE: '删除员工', STAFF_PERMISSIONS: '变更员工权限', STAFF_STATUS: '变更员工状态', MERCHANT_CREATE: '开通商户', MERCHANT_ENABLE: '启用商户', MERCHANT_DISABLE: '停用商户', SERVICE_TERM: '调整点餐期限', PRODUCT_GRANT: '调整产品授权', APPLICATION_STATE: '调整应用状态' }
const permissionLabels = { 'business:scoped': '指定业务范围', 'business:DINING': '点餐业务', 'business:MALL': '商城业务', 'dining:view': '查看台位营业', 'dining:manage': '开台转台清台', 'kitchen:operate': '后厨制作出餐', 'service:operate': '顾客服务', 'refund:approve': '执行退款', 'dashboard:view': '首页看板', 'pos:view': '收银', 'workbench:view': '订单工作台', 'order:view': '订单管理', 'product:view': '商品管理', 'refund:view': '查看退款', 'finance:view': '财务', 'warehouse:view': '仓库', 'operations:view': '会员运营', 'settings:view': '门店设置', 'settings:edit': '编辑点餐场景' }
export function auditSnapshot(value = {}, action = '') {
  const applicationState = action === 'APPLICATION_STATE'
  const labels = { active: '启用状态', role: '角色', permissions: '权限', productType: '业务产品', granted: '产品授权', enabled: '新增交易开关', expiresOn: '到期日', status: applicationState ? '应用状态' : '服务状态', canTrade: '实际可新增交易', historyAccessible: '可处理历史业务', mustChange: '下次登录需改密', credentialsChanged: '密码已更新', adminId: '店长编号', orderingAllowed: '允许新增消费', daysRemaining: '剩余天数' }
  return Object.entries(value || {}).filter(([key]) => labels[key]).map(([key, item]) => {
    let text
    if (key === 'permissions') text = (item || []).map(p => scopedPermissionLabels[p] || permissionLabels[p] || '其他授权').join('、') || '未分配'
    else if (key === 'productType') text = { DINING: '点餐', MALL: '商城' }[item] || '未知业务'
    else if (key === 'granted') text = item ? '已开通' : '未开通／已撤销'
    else if (key === 'enabled') text = item ? '开启' : '关闭'
    else if (key === 'role') text = item === 'admin' ? '店长／管理员' : '员工'
    else if (key === 'status') text = (applicationState ? { ACTIVE: '启用', PAUSED: '暂停' } : serviceLabels)[item] || '未知状态'
    else if (key === 'active') text = item ? '启用' : '停用'
    else text = typeof item === 'boolean' ? item ? '是' : '否' : item ?? '无期限'
    return `${labels[key]}：${text}`
  }).join('；') || '无记录'
}
export function validatePasswordForm(form, reset = false) {
  if (reset && (!form.operatorPassword || !form.reason.trim() || !form.confirmed)) return '请验证操作人密码、填写原因并确认重置'
  if (!reset && !form.currentPassword) return '请填写原密码'
  if (form.newPassword.length < 8 || new TextEncoder().encode(form.newPassword).length > 72 || !form.newPassword.trim()) return '新密码至少8位，UTF-8长度不超过72字节'
  if (form.newPassword !== form.confirmPassword) return '两次新密码不一致'
  return ''
}
export function extendTerm(expiresOn, months, today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date())) {
  const base = expiresOn && expiresOn > today ? expiresOn : today
  const [year, month, day] = base.split('-').map(Number)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(day, last))
  return target.toISOString().slice(0, 10)
}
