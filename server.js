import http from 'http'
import { readFile, writeFile, appendFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createReadStream, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const usersFile = join(__dirname, 'users.json')
const publicDir = join(__dirname, 'public')

async function getUsers() {
  const data = await readFile(usersFile, 'utf-8')
  return JSON.parse(data)
}

async function logPurchase(user) {
  const logLine = `[${new Date().toISOString()}] Investment: £${user.investment}\n`
  await appendFile(join(__dirname, 'purchases.log'), logLine)
}

async function saveUser(user) {
  const users = await getUsers()
  users.push(user)
  await writeFile(usersFile, JSON.stringify(users, null, 2))
  await logPurchase(user) 
  return user
}

const serveStatic = (req, res) => {
  let filePath = req.url === '/' ? 'index.html' : req.url.slice(1)
  filePath = join(publicDir, filePath)
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    createReadStream(join(publicDir, '404.html')).pipe(res)
    return
  }
  const ext = filePath.split('.').pop()
  const mime = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    png: 'image/png'
  }[ext] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': mime })
  createReadStream(filePath).pipe(res)
}

let goldPrice = 2345.67 

setInterval(() => {
  const change = (Math.random() - 0.5) * 4
  goldPrice = Math.max(1000, goldPrice + change)
}, 10000)

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.url === '/api/users' && req.method === 'GET') {
    const users = await getUsers()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(users))
  }

  else if (req.url === '/api/users' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', async () => {
      const newUser = JSON.parse(body)
      const saved = await saveUser(newUser)
      res.writeHead(201, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(saved))
    })
  } else if (req.url === '/api/price' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ price: goldPrice }))
    return
  }

  else if (req.url.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Not found' }))
  } else {
    serveStatic(req, res)
  }
})

const PORT = 4000
server.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`)
})

