import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const port = Number(process.env.PORT ?? 4173)
const root = new URL('.', import.meta.url).pathname
const types = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
])

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname
  const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1)
  const filePath = normalize(join(root, relativePath))

  if (!filePath.startsWith(root)) {
    response.writeHead(403).end('Forbidden')
    return
  }

  try {
    const file = await stat(filePath)
    if (!file.isFile()) throw new Error('Not a file')
    response.writeHead(200, { 'content-type': types.get(extname(filePath)) ?? 'application/octet-stream' })
    createReadStream(filePath).pipe(response)
  } catch {
    response.writeHead(404).end('Not found')
  }
})

server.listen(port, () => {
  console.log(`HTML-in-Canvas inception: http://localhost:${port}`)
})
