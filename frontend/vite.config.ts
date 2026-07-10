import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 启用 sourcemap 用于调试（生产环境使用 hidden 模式）
    sourcemap: 'hidden',
    // 滚动 chunk 大小警告阈值
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // 手动代码分割 — 将大型依赖拆分为独立 chunk
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            // 图表库单独打包（recharts 很大）
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
              return 'vendor-charts'
            }
            // 知识图谱 force-graph 库单独打包
            if (id.includes('react-force-graph') || id.includes('force-graph') || id.includes('three')) {
              return 'vendor-graph'
            }
            // Radix UI 组件库单独打包
            if (id.includes('@radix-ui')) {
              return 'vendor-radix'
            }
            // React 核心单独打包
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) {
              return 'vendor-react'
            }
            // 其他第三方库
            return 'vendor'
          }
        },
      },
    },
  },
})
