# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
# 每门店微信配置

门店列表新增“微信配置”，平台管理员可单独保存每家店的小程序和收款配置。秘钥字段只接受新值，留空保留原值，服务器不回显原值；关闭弹窗或保存成功后清空输入。配置按版本保存，冲突时请重新加载后核对。

后端需要先应用 `migration_store_wechat.sql` 并设置 `ORDERING_WECHAT_DATA_KEY`，部署说明在后端仓库 `deploy/store-wechat-setup.md`。页面显示“配置完整”只代表本地字段完整，正式交付须完成微信授权、登录和支付退款验收。
