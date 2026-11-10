import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

const isAnalyze = process.env.ANALYZE === 'true'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    // Bundle analysis (enable via ANALYZE=true pnpm run build)
    isAnalyze && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      // monaco-editor 0.57 引入封闭 exports 映射（./* → ./esm/vs/*），
      // `?worker` 查询串不参与 exports 模式匹配 → 深导入解析失败。
      // 正则 alias 直接改写为包内绝对路径（绕过 exports），保留 ?worker 后缀给 worker 插件。
      {
        find: /^monaco-editor\/(esm\/vs\/(?:editor|language\/(?:json|css|html|typescript))\/[a-z]+\.worker)(\?worker)$/,
        replacement: path.resolve(__dirname, 'node_modules/monaco-editor') + '/$1.js$2',
      },
    ],
  },

  // 开发服务器配置
  server: {
    port: 3200,
    host: true,
    // 配置代理解决CORS问题
    proxy: {
      // Ollama API代理
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Ollama proxy error:', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to Ollama:', req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from Ollama:', req.url, proxyRes.statusCode)
          })
        },
      },
      // 通用AI API代理 - 解决所有外部API的CORS问题
      '/api/proxy': {
        target: 'https://open.bigmodel.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('API Proxy error:', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request via proxy:', req.url)
            const target = req.headers['x-target-url']
            if (target && typeof target === 'string') {
              try {
                const url = new URL(target)
                proxyReq.path = url.pathname + url.search
                proxyReq.setHeader('Host', url.host)
              } catch (e) {
                console.error('Invalid target URL:', e)
              }
            }
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response via proxy:', req.url, proxyRes.statusCode)
            // 添加CORS头
            proxyRes.headers['Access-Control-Allow-Origin'] = '*'
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
          })
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    // 调整chunk大小警告阈值
    chunkSizeWarningLimit: 600,

    // 代码分割策略 - 使用Vite默认分割避免循环依赖
    rollupOptions: {
      output: {
        // 使用默认的代码分割策略，不手动分割以避免循环依赖
        // chunk文件命名策略
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    // 优化配置
    minify: 'esbuild',
  },
})
