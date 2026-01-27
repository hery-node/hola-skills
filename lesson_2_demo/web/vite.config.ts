import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    // Deduplicate echarts and zrender to ensure single instance
    dedupe: ['echarts', 'zrender'],
  },
  optimizeDeps: {
    // Include echarts dependencies for proper pre-bundling
    include: ['echarts', 'echarts/core', 'echarts/renderers', 'echarts/charts', 'echarts/components', 'zrender'],
  },
  server: {
    port: 8083,
  },
})
