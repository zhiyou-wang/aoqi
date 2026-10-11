import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    watch: {
      // public 为纯静态资源、无需 HMR；忽略它可避免 Windows 下
      // 大视频文件被占用(EBUSY)导致文件监听器崩溃
      ignored: ['**/public/**'],
    },
    proxy: {
      // 前端 dev 时把 /api 代理到后端，避免 CORS 与跨域
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
