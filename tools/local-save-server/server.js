const http = require('http')
const fs = require('fs')
const path = require('path')
const os = require('os')
const config = require('./config.json')

const port = config.port || 7654
if (!config.outputDir) throw new Error('config.json must define outputDir')
const outputDir = config.outputDir.replace(/^~/, os.homedir())

function addCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) }
      catch (e) { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

function generateFilename() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `genart-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.png`
}

const server = http.createServer(async (req, res) => {
  addCORSHeaders(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (req.method === 'POST' && req.url === '/save') {
    try {
      const body = await parseBody(req)
      const { dataURL, filename } = body

      if (!dataURL || !dataURL.startsWith('data:image/png;base64,')) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid or missing dataURL' }))
        return
      }

      const base64Data = dataURL.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const name = path.basename(filename || generateFilename())

      fs.mkdirSync(outputDir, { recursive: true })
      const filepath = path.join(outputDir, name)
      fs.writeFileSync(filepath, buffer)

      console.log(`Saved: ${filepath}`)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, filename: name, path: filepath }))
    } catch (e) {
      console.error('Save error:', e.message)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }

  res.writeHead(404)
  res.end()
})

server.listen(port, '127.0.0.1', () => {
  console.log(`local-save-server running on http://127.0.0.1:${port}`)
  console.log(`Output dir: ${outputDir}`)
})
