import express from 'express'
import path from 'path'
import db from './db'
import { createApp } from './app'

const isProd = process.env.NODE_ENV === 'production'
const PORT = process.env.PORT ?? 3001
const app = createApp(db)

if (isProd) {
  const distDir = path.join(process.cwd(), 'dist')
  app.use(express.static(distDir))
  app.get(/(.*)/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

app.listen(PORT, () => console.log(`API server → http://localhost:${PORT}`))
