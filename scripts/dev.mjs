import { createReadStream, existsSync } from 'node:fs'
import { stat, realpath } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { createGzip, createBrotliCompress, constants } from 'node:zlib'
import { pipeline } from 'node:stream/promises'

const root = await realpath(resolve('.'))

function option(name, fallback) {
  const exact = process.argv.find(argument => argument.startsWith(name + '='))
  if (exact) return exact.slice(name.length + 1)
  const index = process.argv.indexOf(name)
  if (index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--')) return process.argv[index + 1]
  return fallback
}

const host = String(option('--host', process.env.HOST || '127.0.0.1')).trim() || '127.0.0.1'
const rawPort = String(option('--port', process.env.PORT || '4174')).trim()
const port = Number(rawPort)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Anyo world dev server: --port must be an integer from 1 to 65535')
  process.exit(1)
}

const mime = new Map([
  ['.json','application/json; charset=utf-8'],['.html','text/html; charset=utf-8'],['.css','text/css; charset=utf-8'],
  ['.js','text/javascript; charset=utf-8'],['.mjs','text/javascript; charset=utf-8'],['.svg','image/svg+xml'],
  ['.glb','model/gltf-binary'],['.gltf','model/gltf+json'],['.png','image/png'],['.jpg','image/jpeg'],['.jpeg','image/jpeg'],
  ['.webp','image/webp'],['.gif','image/gif'],['.ico','image/x-icon'],['.woff','font/woff'],['.woff2','font/woff2'],['.hdr','image/vnd.radiance'],['.vrm','model/gltf-binary'],['.vrma','model/gltf-binary'],['.ktx2','image/ktx2'],['.wasm','application/wasm'],['.mp3','audio/mpeg'],['.ogg','audio/ogg'],['.mp4','video/mp4'],['.webm','video/webm']
])
// Revalidate rather than treating mutable project paths as immutable. In particular,
// switching texture/visibility profiles must never reuse stale world JSON.
const cors = { 'access-control-allow-origin':'*', 'access-control-expose-headers':'ETag, Last-Modified, Content-Encoding, Content-Length, Cache-Control, Accept-Ranges, Content-Range' }
const compressible = new Set(['.json','.html','.css','.js','.mjs','.svg','.gltf','.wasm'])
function encodingFor(header, eligible) {
  const accepted = new Map(String(header || '').toLowerCase().split(',').map(part => {
    const [name,...params] = part.trim().split(';')
    const qParam = params.find(p => /^\s*q\s*=/.test(p))
    const q = qParam ? Number(qParam.split('=')[1]) : 1
    return [name.trim(), Number.isFinite(q) && q >= 0 && q <= 1 ? q : 0]
  }))
  const quality = name => accepted.get(name) ?? accepted.get('*') ?? 0
  const identity = accepted.get('identity') ?? (accepted.get('*') === 0 ? 0 : 1)
  if (eligible) {
    const choices = ['br','gzip'].filter(name => quality(name)>0).sort((a,b)=>quality(b)-quality(a))
    if (choices.length && (!accepted.has('identity') || quality(choices[0])>=identity)) return choices[0]
  }
  return identity>0 ? 'identity' : null
}
function matchesETag(header, etag) {
  return String(header).split(',').some(value => value.trim()==='*' || value.trim().replace(/^W\//,'')===etag.replace(/^W\//,''))
}
const server = createServer(async (req,res) => {
  const fail = (status, message) => { res.writeHead(status,{...cors,'cache-control':'no-store'}); res.end(message) }
  if (req.method === 'OPTIONS') { res.writeHead(204,{...cors,'access-control-allow-methods':'GET, HEAD, OPTIONS','access-control-allow-headers':'Range, If-None-Match, If-Modified-Since','cache-control':'no-store'}); return res.end() }
  if (!['GET','HEAD'].includes(req.method)) return fail(405,'Method not allowed')
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    let pathname = decodeURIComponent(url.pathname)
    if (pathname === '/') pathname = existsSync(join(root,'atlas.world.json')) ? '/atlas.world.json' : '/world.anyo.json'
    const segments = pathname.split('/')
    if (segments.some(part => part.startsWith('.') || part === 'node_modules') || segments[1] === 'scripts' || pathname.includes(String.fromCharCode(92))) return fail(404,'Not found')
    const file = resolve(root,'.'+pathname)
    if (!file.startsWith(root+sep)) return fail(404,'Not found')
    const actual = await realpath(file)
    if (!actual.startsWith(root+sep) || actual.slice(root.length+1).split(sep).some(part => part.startsWith('.') || part === 'node_modules') || actual.slice(root.length+1).split(sep)[0] === 'scripts') return fail(404,'Not found')
    const info = await stat(actual)
    if (!info.isFile()) return fail(404,'Not found')
    const extension = extname(actual).toLowerCase()
    const eligible = compressible.has(extension) && info.size >= 1024
    const encoding = encodingFor(req.headers['accept-encoding'], eligible)
    if (!encoding) return fail(406,'No acceptable content encoding')
    // Weak validators are suitable for dev files: size plus high-resolution mtime.
    // Include encoding to keep representations distinct in caches.
    const etag = `W/"${info.size.toString(16)}-${info.mtimeMs.toString(36)}-${encoding}"`
    const headers = {...cors,'cache-control':'no-cache',etag,'last-modified':info.mtime.toUTCString(),
      vary:'Accept-Encoding','content-type':mime.get(extension) || 'application/octet-stream'}
    if (encoding!=='identity') headers['content-encoding']=encoding
    const notModified = req.headers['if-none-match'] !== undefined
      ? matchesETag(req.headers['if-none-match'],etag)
      : req.headers['if-modified-since'] !== undefined && Math.floor(info.mtimeMs/1000)*1000 <= Date.parse(req.headers['if-modified-since'])
    if (notModified) { res.writeHead(304,headers); return res.end() }
    // Local audio must support byte ranges for browser media seeking.
    if (encoding==='identity' && ['.mp3','.ogg'].includes(extension)) {
      headers['accept-ranges']='bytes'
      if (req.headers.range && !req.headers['if-range']) {
        const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range)
        let start=0,end=info.size-1
        if (match && (match[1] || match[2])) {
          if (!match[1]) start=Math.max(0,info.size-Number(match[2]))
          else { start=Number(match[1]); if(match[2])end=Math.min(end,Number(match[2])) }
        } else start=info.size
        if (!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=info.size||end<start) {
          res.writeHead(416,{...headers,'content-range':`bytes */${info.size}`,'content-length':0});return res.end()
        }
        res.writeHead(206,{...headers,'content-range':`bytes ${start}-${end}/${info.size}`,'content-length':end-start+1})
        if(req.method==='HEAD')return res.end()
        return await pipeline(createReadStream(actual,{start,end}),res)
      }
    }
    if (encoding==='identity') headers['content-length']=info.size
    res.writeHead(200,headers)
    if (req.method === 'HEAD') return res.end()
    const stream = createReadStream(actual)
    if (encoding==='br') await pipeline(stream,createBrotliCompress({params:{[constants.BROTLI_PARAM_QUALITY]:4}}),res)
    else if (encoding==='gzip') await pipeline(stream,createGzip(),res)
    else await pipeline(stream,res)
  } catch {
    if (res.headersSent || res.destroyed) { if (!res.destroyed) res.destroy(); return }
    return fail(404,'Not found')
  }
})

server.on('error', error => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`Anyo world dev server: ${host}:${port} is already in use. Try --port=${port + 1}.`)
    process.exitCode = 1
    return
  }
  throw error
})

server.listen(port, host, () => {
  const displayHost = host === '0.0.0.0' ? '127.0.0.1' : host
  const entry = existsSync(join(root,'atlas.world.json')) ? 'atlas.world.json' : 'world.anyo.json'
  const authority = displayHost.includes(':') ? '[' + displayHost + ']' : displayHost
  const sourceRoot = 'http://' + authority + ':' + port + '/'
  console.log('Anyo world source: ' + sourceRoot + entry)
  console.log('World Loader preview (start Loader separately): http://localhost:5173/?registryRoot=' + encodeURIComponent(sourceRoot))
})
