import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { onSessionExpired } from './api/client'
import { createSessionExpiredHandler } from './features/admin/session-expired'

const app = createApp(App)

app.use(router)

// `401` numa chamada que não é o login: o client limpa a sessão e chama isto (CA14).
onSessionExpired(createSessionExpiredHandler(router))

app.mount('#app')
