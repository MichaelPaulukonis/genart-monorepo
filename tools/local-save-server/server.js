const http = require('http')
const fs = require('fs')
const path = require('path')
const os = require('os')
const config = require('./config.json')

const port = config.port || 7654
const outputDir = config.outputDir.replace(/^~/, os.homedir())

function addCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
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

  res.writeHead(404)
  res.end()
})

server.listen(port, '127.0.0.1', () => {
  console.log(`local-save-server running on http://127.0.0.1:${port}`)
  console.log(`Output dir: ${outputDir}`)
})
