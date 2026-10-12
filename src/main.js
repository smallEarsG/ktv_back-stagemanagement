import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { installTelemetry } from '@/utils/telemetry'
import { reportTelemetry } from '@/api/http'

const app = createApp(App)

app.use(createPinia())
app.use(router)

installTelemetry(app, reportTelemetry)
app.mount('#app')

