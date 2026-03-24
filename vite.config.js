/* eslint-env node */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import process from 'process'

const cloudflareApiPlugin = () => ({
  name: 'cloudflare-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url.startsWith('/api/')) {
        let bodyStr = '';
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
           for await (const chunk of req) {
              bodyStr += chunk;
           }
        }
        
        const basePath = req.url.split('?')[0]; 
        const functionPath = path.join(process.cwd(), 'functions', basePath + '.js');
        
        if (fs.existsSync(functionPath)) {
          console.log(`[cloudflare-api] Routing request to ${functionPath}`);
          try {
            // Skip OPTIONS so Vite can handle CORS preflight
            if (req.method === 'OPTIONS') {
               return next();
            }

            const mod = await import(`file://${functionPath}?t=${Date.now()}`);
            
            let handler = null;
            if (req.method === 'POST' && mod.onRequestPost) handler = mod.onRequestPost;
            else if (req.method === 'GET' && mod.onRequestGet) handler = mod.onRequestGet;
            else if (req.method === 'PUT' && mod.onRequestPut) handler = mod.onRequestPut;
            else if (req.method === 'DELETE' && mod.onRequestDelete) handler = mod.onRequestDelete;
            else if (mod.onRequest) handler = mod.onRequest;

            if (handler) {
               const env = loadEnv(server.config.mode, process.cwd(), 'VITE_');
               const request = {
                  json: async () => JSON.parse(bodyStr || '{}'),
                  text: async () => bodyStr,
                  method: req.method,
                  url: 'http://localhost' + req.url,
                  headers: req.headers
               };
               const context = { request, env };
               const response = await handler(context);
               
               const responseBodyStr = await response.text();
               
               const responseHeaders = {};
               for (const [key, val] of response.headers.entries()) {
                  responseHeaders[key] = val;
               }
               
               res.writeHead(response.status, responseHeaders);
               res.end(responseBodyStr);
               return;
            }
          } catch (err) {
             console.error(`[cloudflare-api] Error executing ${basePath}:`, err);
             res.statusCode = 500;
             res.end(JSON.stringify({error: err.message}));
             return;
          }
        } else {
             console.log(`[cloudflare-api] Function file not found: ${functionPath}`);
        }
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflareApiPlugin()],
  server: {
    proxy: {
      '/s3-proxy': {
        target: 'https://s3-hn1-api.longvan.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/s3-proxy/, '')
      }
    }
  },
  define: {
    global: 'window',
  },
});
// Trigger Vite restart
