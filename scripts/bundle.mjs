import { bundleWorldDocument, validateWorldDocument } from '@blcklab/anyo'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadProjectAnyoDocument, makeProjectUrlsPortable, readRootWorld, rootSourceContext } from './anyo-documents.mjs'

const outputFile='dist/world.anyo.json'
const { document: world }=await readRootWorld()
if(world.version!=='0.9') throw new Error('Generated project expects Anyo World 0.9; found '+String(world.version))
const bundled=await bundleWorldDocument(world,{sourceContext:rootSourceContext,documentLoader:loadProjectAnyoDocument})
const portable=makeProjectUrlsPortable(bundled,outputFile)
validateWorldDocument(portable)
await mkdir(path.dirname(outputFile),{recursive:true})
await writeFile(outputFile,JSON.stringify(portable,null,2)+'\n')
console.log('Anyo standalone bundle: PASS')
console.log('Output:', outputFile)
