export const serviceLabels = { UNLIMITED: '无期限', ACTIVE: '服务中', EXPIRING: '30天内到期', EXPIRED: '已到期' }
export const actionLabels = { ACCOUNT_CHANGE: '本人改密', ACCOUNT_RESET: '受控重置密码', STAFF_CREATE: '新增员工', STAFF_DELETE: '删除员工', STAFF_PERMISSIONS: '变更员工权限', STAFF_STATUS: '变更员工状态', MERCHANT_CREATE: '开通商户', MERCHANT_ENABLE: '启用商户', MERCHANT_DISABLE: '停用商户', SERVICE_TERM: '调整服务期限' }
const permissionLabels = { 'business:scoped': '指定业务范围', 'business:DINING': '点餐业务', 'business:MALL': '商城业务', 'dining:view': '查看台位营业', 'dining:manage': '开台转台清台', 'kitchen:operate': '后厨制作出餐', 'service:operate': '顾客服务', 'refund:approve': '执行退款', 'dashboard:view': '首页看板', 'pos:view': '收银', 'workbench:view': '订单工作台', 'order:view': '订单管理', 'product:view': '商品管理', 'refund:view': '查看退款', 'finance:view': '财务', 'warehouse:view': '仓库', 'operations:view': '会员运营', 'settings:view': '门店设置', 'settings:edit': '编辑点餐场景' }
export function auditSnapshot(value = {}) {
  const labels = { active: '启用状态', role: '角色', permissions: '权限', expiresOn: '到期日', status: '服务状态', mustChange: '下次登录需改密', credentialsChanged: '密码已更新', adminId: '店长编号', orderingAllowed: '允许新增消费', daysRemaining: '剩余天数' }
  return Object.entries(value).filter(([key]) => labels[key]).map(([key, item]) => `${labels[key]}：${key === 'permissions' ? (item || []).map(p => permissionLabels[p] || '其他授权').join('、') || '未分配' : key === 'role' ? item === 'admin' ? '店长／管理员' : '员工' : key === 'status' ? serviceLabels[item] || item : key === 'active' ? item ? '启用' : '停用' : typeof item === 'boolean' ? item ? '是' : '否' : item ?? '无期限'}`).join('；') || '无记录'
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
