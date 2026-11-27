import assert from 'node:assert/strict'
import {mkdtemp,readFile,writeFile,mkdir,rm,copyFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {spawn} from 'node:child_process'
import {createServer as createNetServer} from 'node:net'
import {request} from 'node:http'
import {gunzipSync,brotliDecompressSync} from 'node:zlib'
const root=new URL('../',import.meta.url), source=await readFile(new URL('world.anyo.json',root))
const art=JSON.parse(source).entities.find(e=>e.type==='image').src
const dir=await mkdtemp(join(tmpdir(),'aeternum-http-'))
let child
try {
  await writeFile(join(dir,'world.anyo.json'),source)
  await mkdir(join(dir,'assets'),{recursive:true})
  await copyFile(new URL(art,root),join(dir,'assets','art.webp'))
  const audio=await readFile(new URL('assets/audio/bach-air-on-the-g-string.mp3',root));await writeFile(join(dir,'assets','test.mp3'),audio)
  await mkdir(join(dir,'scripts'));await writeFile(join(dir,'scripts','secret.txt'),'private')
  const socket=createNetServer();await new Promise((ok,no)=>{socket.once('error',no);socket.listen(0,'127.0.0.1',ok)})
  const port=socket.address().port;await new Promise(ok=>socket.close(ok))
  child=spawn(process.execPath,[fileURLToPath(new URL('scripts/dev.mjs',root)),`--port=${port}`],{cwd:dir,stdio:['ignore','pipe','pipe']})
  await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('Dev server startup timeout')),5000);child.on('error',e=>{clearTimeout(timer);no(e)});child.once('exit',code=>{clearTimeout(timer);no(Error(`Dev server exited ${code}`))});child.stdout.on('data',b=>{if(String(b).includes('Anyo world source:')){clearTimeout(timer);ok()}})})
  const get=(path,headers={},method='GET')=>new Promise((ok,no)=>{const req=request({host:'127.0.0.1',port,path,method,headers},res=>{const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>ok({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));res.on('error',no)});req.on('error',no);req.setTimeout(5000,()=>req.destroy(Error('Request timeout')));req.end()})
  const plain=await get('/');assert.equal(plain.status,200);assert.deepEqual(plain.body,source);assert.equal(plain.headers['cache-control'],'no-cache');assert.equal(Number(plain.headers['content-length']),source.length)
  for(const [encoding,decode] of [['gzip',gunzipSync],['br',brotliDecompressSync]]){
    const compressed=await get('/world.anyo.json',{'Accept-Encoding':encoding});assert.equal(compressed.status,200);assert.equal(compressed.headers['content-encoding'],encoding);assert.deepEqual(decode(compressed.body),source);assert.ok(compressed.body.length<source.length*.5);assert.match(compressed.headers.vary,/Accept-Encoding/i)
    const hit=await get('/',{'Accept-Encoding':encoding,'If-None-Match':compressed.headers.etag});assert.equal(hit.status,304);assert.equal(hit.body.length,0)
    const head=await get('/',{'Accept-Encoding':encoding},'HEAD');assert.equal(head.status,200);assert.equal(head.headers.etag,compressed.headers.etag);assert.equal(head.body.length,0)
  }
  const noCompression=await get('/',{'Accept-Encoding':'gzip;q=0, br;q=0'});assert.equal(noCompression.headers['content-encoding'],undefined)
  assert.equal((await get('/',{'Accept-Encoding':'identity;q=0, *;q=0'})).status,406)
  const image=await get('/assets/art.webp',{'Accept-Encoding':'br,gzip'});assert.equal(image.status,200);assert.equal(image.headers['content-type'],'image/webp');assert.equal(image.headers['content-encoding'],undefined);assert.deepEqual(image.body,await readFile(new URL(art,root)))
  const part=await get('/assets/test.mp3',{Range:'bytes=100-199'});assert.equal(part.status,206);assert.equal(part.headers['content-range'],`bytes 100-199/${audio.length}`);assert.deepEqual(part.body,audio.subarray(100,200));assert.equal(part.headers['accept-ranges'],'bytes');
  const suffix=await get('/assets/test.mp3',{Range:'bytes=-32'});assert.equal(suffix.status,206);assert.deepEqual(suffix.body,audio.subarray(-32));assert.equal((await get('/assets/test.mp3',{Range:`bytes=${audio.length}-`})).status,416);
  const cached=await get('/assets/art.webp',{'If-None-Match':image.headers.etag});assert.equal(cached.status,304);assert.equal(cached.body.length,0)
  const dateHit=await get('/assets/art.webp',{'If-Modified-Since':image.headers['last-modified']});assert.equal(dateHit.status,304)
  const precedence=await get('/assets/art.webp',{'If-Modified-Since':image.headers['last-modified'],'If-None-Match':'"different"'});assert.equal(precedence.status,200)
  const newWorld=Buffer.concat([source,Buffer.from('\n')]);await writeFile(join(dir,'world.anyo.json'),newWorld)
  const changed=await get('/',{'If-None-Match':plain.headers.etag});assert.equal(changed.status,200);assert.notEqual(changed.headers.etag,plain.headers.etag);assert.deepEqual(changed.body,newWorld)
  assert.equal((await get('/scripts/secret.txt')).status,404);assert.equal((await get('/missing')).headers['cache-control'],'no-store')
  const options=await get('/',{},'OPTIONS');assert.equal(options.status,204);assert.match(options.headers['access-control-allow-headers'],/If-None-Match/i)
  assert.equal(plain.headers['access-control-allow-origin'],'*');assert.match(plain.headers['access-control-expose-headers'],/ETag/i)
  console.log('Loading HTTP checks PASS: gzip/Brotli byte-exact round trips, HEAD, identity negotiation, conditional 304, changed-world invalidation, unchanged WebP, CORS and private-path rejection.')
} finally {
  if(child && child.exitCode===null){const exited=new Promise(ok=>child.once('exit',ok));child.kill();await exited}
  await rm(dir,{recursive:true,force:true})
}
