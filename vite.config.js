import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

/**
 * Dev-only plugin: serves /api/<name> by loading ./api/<name>.js and invoking
 * the handler with Vercel-compatible req/res shims so the production
 * serverless functions also work in `vite dev`.
 *
 * Without this, the SPA catch-all returns index.html for /api/* in dev, which
 * breaks every client API call.
 */
function apiDevPlugin(envVars) {
  return {
    name: 'bynge-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()

        const url = new URL(req.url, 'http://localhost')
        const name = url.pathname.replace(/^\/api\//, '').replace(/\.[^/.]+$/, '')
        if (!name) return next()

        const file = resolve(process.cwd(), 'api', `${name}.js`)
        if (!existsSync(file)) return next()

        let handler
        try {
          // Cache-bust on each request so handler edits hot-reload in dev
          const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`)
          handler = mod.default
        } catch (err) {
          console.error(`[api] failed to load ${name}:`, err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Handler load failed' }))
          return
        }

        // Vercel-style req additions
        req.query = Object.fromEntries(url.searchParams)

        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          const chunks = []
          await new Promise((done) => {
            req.on('data', (c) => chunks.push(c))
            req.on('end', done)
          })
          const raw = Buffer.concat(chunks).toString('utf8')
          if (raw) {
            try { req.body = JSON.parse(raw) } catch { req.body = raw }
          }
        }

        // Vercel-style res helpers
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (data) => {
          if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
          return res
        }
        res.send = (data) => {
          if (data == null) return res.end()
          if (typeof data === 'object' && !(data instanceof Buffer)) return res.json(data)
          res.end(data)
          return res
        }

        // Mirror .env into process.env so the handlers can read server-only keys
        for (const [k, v] of Object.entries(envVars)) {
          if (!(k in process.env)) process.env[k] = v
        }

        try {
          await handler(req, res)
        } catch (err) {
          console.error(`[api] /api/${name} crashed:`, err)
          if (!res.writableEnded) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Handler crashed' }))
          }
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.PORT) || 3000

  // Make non-VITE env vars available to the dev API plugin
  for (const [k, v] of Object.entries(env)) {
    if (!k.startsWith('VITE_') && !(k in process.env)) process.env[k] = v
  }

  return {
    plugins: [react(), apiDevPlugin(env)],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      port,
      open: true,
    },
  }
})
