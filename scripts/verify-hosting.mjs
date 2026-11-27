import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

export async function verifyHosting(root, loaderOrigin, fetcher = fetch, { local = false } = {}) {
  const base = new URL(root)
  const origin = new URL(loaderOrigin)
  const loopback = u => ['localhost','127.0.0.1','[::1]'].includes(u.hostname)
  const allowed = u => u.protocol === 'https:' || (local && u.protocol === 'http:' && loopback(u))
  assert.ok(allowed(base) && allowed(origin), 'HTTPS required (use --local only for loopback tests)')
  assert.ok(!base.username && !base.password && !base.search && !base.hash, 'Invalid world root')
  assert.equal(origin.href, origin.origin + '/', 'Provide Loader origin only, not its path')
  if (!base.pathname.endsWith('/')) base.pathname += '/'
  let checks = 0
  const request = async (rel, type, from = origin.origin, range = false) => {
    const url = new URL(rel, base)
    assert.ok(url.origin === base.origin && url.pathname.startsWith(base.pathname), 'Unexpected asset path')
    const headers = { Origin: from, ...(range ? { Range: 'bytes=0-63' } : {}) }
    const res = await fetcher(url, { headers, redirect: 'error', signal: AbortSignal.timeout(20000) })
    try {
      assert.equal(res.status, range ? 206 : 200, `${rel}: HTTP ${res.status}`)
      assert.match(res.headers.get('content-type') ?? '', type, `${rel}: MIME type`)
      if (from === 'null' || from !== base.origin) {
        assert.ok(['*',from].includes(res.headers.get('access-control-allow-origin')), `${rel}: CORS for ${from}`)
      }
      if (range) {
        assert.match(res.headers.get('content-range') ?? '', /^bytes 0-63\/\d+$/, `${rel}: byte range`)
        assert.equal((await res.arrayBuffer()).byteLength,64,`${rel}: range body`)
      }
      checks++
      if (type.source.includes('json')) return await res.json()
    } finally { if (!res.bodyUsed) await res.body?.cancel() }
  }
  const json = /application\/json/i, js = /(?:application|text)\/(?:java|ecma)script/i
  const world = await request('world.anyo.json',json)
  assert.equal(world.revision,34,'Unexpected museum revision')
  const art = world.entities.find(e=>e.type==='image' && typeof e.src==='string' && e.src.endsWith('.webp'))
  assert.ok(art,'No artwork found')
  await request(art.src,/image\/webp/i)
  await request('web-surface/reception/index.html',/text\/html/i)
  await request('web-surface/reception/app.js',js,'null')
  await request('web-surface/reception/visitor-ui.mjs',js,'null')
  await request('web-surface/reception/destinations.json',json,'null')
  await request('web-surface/artwork-viewer/app.mjs',js,'null')
  await request('web-surface/artwork-viewer/catalog.json',json,'null')
  const sound = await request('assets/audio/soundscapes.json',json)
  for (const track of sound.tracks) {
    await request('assets/audio/'+track.file,/audio\/(?:mpeg|mp3)/i,origin.origin,true)
    if(track.waveform) await request('assets/audio/'+track.waveform,json)
  }
  for (const zone of sound.ambience.zones) await request('assets/audio/'+zone.file,/(?:audio|application)\/ogg/i,origin.origin,true)
  return checks
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [root, origin, flag] = process.argv.slice(2)
  if (!root || !origin || (flag && flag !== '--local')) throw Error('Usage: npm run verify:hosting -- <world-root> <loader-origin> [--local]')
  console.log(`Hosting smoke checks passed: ${await verifyHosting(root,origin,fetch,{local:flag==='--local'})}`)
}
