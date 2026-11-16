import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// O endereço da API entra no bundle na hora do build. Sem `VITE_API_URL`, o build segue
// (o CI compila sem ela), mas avisa: esse bundle derruba o app ao carregar o cliente
// (src/api/client.ts) em vez de chamar um endereço padrão.
function warnMissingApiUrl(): Plugin {
  return {
    name: 'reserva:warn-missing-api-url',
    apply: 'build',
    configResolved(config) {
      if (!config.env.VITE_API_URL) {
        config.logger.warn(
          '\nAVISO: VITE_API_URL não definida: este build não sabe onde está a API e o app ' +
            'falha ao carregar o cliente. Defina-a no ambiente antes de publicar.\n',
        )
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss(), warnMissingApiUrl()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
