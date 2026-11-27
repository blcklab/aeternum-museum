import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { validateCharacterAssets } from './character-assets.mjs'
const dir = new URL('../assets/animations/', import.meta.url)
for (const [file, preview, previewClip] of [['animations.json','alphaPreview','idle'],['independent.json','soloPreview','walk']]) {
  const catalog = JSON.parse(await readFile(new URL(file, dir),'utf8'))
  assert.deepEqual(Object.keys(catalog.clips).sort(), ['idle','jump','walk'])
  for (const name of ['idle','jump','walk']) assert.equal(catalog.clips[name].src, `./${name}.vrma`)
  for (const action of ['walk','walkBackward','strafeLeft','strafeRight','run']) assert.equal(catalog.actions[action].clip,'walk')
  assert.equal(catalog.actions.idle.clip,'idle')
  assert.equal(catalog.actions.jump.clip,'jump')
  assert.equal(catalog.actions.jump.loop,'once')
  assert.equal(catalog.actions[preview].clip,previewClip)
}
assert.deepEqual((await readdir(dir)).filter(n=>n.endsWith('.vrma')).sort(),['idle.vrma','jump.vrma','walk.vrma'])
assert.deepEqual(await validateCharacterAssets(), {avatars:2,catalogs:2,clips:6,declared:true})
console.log('Three-clip locomotion mapping and character binaries: PASS')

assert.equal(JSON.parse(await readFile(new URL('../assets/avatars/avatars.json',import.meta.url),'utf8')).default,null)
console.log('Optional avatar default: PASS')
