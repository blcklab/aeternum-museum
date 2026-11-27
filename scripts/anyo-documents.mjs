import { readFile, realpath } from 'node:fs/promises'
import path from 'node:path'

const PROJECT_PROTOCOL = 'anyo-project:'
const PROJECT_HOST = 'root'
const PROJECT_BASE = 'anyo-project://root/'
const projectRoot = await realpath(path.resolve('.'))
const projectRootPrefix = projectRoot.endsWith(path.sep) ? projectRoot : projectRoot + path.sep

export const rootWorldUrl = new URL('world.anyo.json', PROJECT_BASE).href
export const rootSourceContext = Object.freeze({ documentUrl: rootWorldUrl, baseUrl: PROJECT_BASE })

function insideProject(file) {
  return file === projectRoot || file.startsWith(projectRootPrefix)
}

function projectPathFromUrl(rawUrl) {
  const url = new URL(rawUrl)
  if (url.protocol !== PROJECT_PROTOCOL || url.hostname !== PROJECT_HOST) {
    throw new Error('Generated Anyo tooling resolves local project imports only: ' + rawUrl)
  }
  if (url.search || url.hash) throw new Error('Local Anyo object imports may not contain query strings or fragments: ' + rawUrl)
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '')
  const candidate = path.resolve(projectRoot, relative)
  if (!insideProject(candidate)) throw new Error('Anyo import escapes the generated project root: ' + rawUrl)
  return candidate
}

export async function readRootWorld() {
  const sourceText = await readFile(path.join(projectRoot, 'world.anyo.json'), 'utf8')
  return { document: JSON.parse(sourceText), sourceText }
}

export async function loadProjectAnyoDocument(request) {
  const candidate = projectPathFromUrl(request.url)
  const actual = await realpath(candidate)
  if (!insideProject(actual)) throw new Error('Anyo import resolves outside the generated project root: ' + request.url)
  const sourceText = await readFile(actual, 'utf8')
  let document
  try { document = JSON.parse(sourceText) }
  catch (error) { throw new Error('Invalid JSON in ' + request.url + ': ' + (error instanceof Error ? error.message : String(error))) }
  return { document, documentUrl: request.url, sourceText }
}

function portableProjectString(value, outputFile) {
  let url
  try { url = new URL(value) } catch { return value }
  if (url.protocol !== PROJECT_PROTOCOL || url.hostname !== PROJECT_HOST) return value
  const relativeProjectPath = decodeURIComponent(url.pathname).replace(/^\/+/, '')
  const target = path.resolve(projectRoot, relativeProjectPath)
  if (!insideProject(target)) throw new Error('Bundled URL escapes the generated project root: ' + value)
  const outputDirectory = path.dirname(path.resolve(projectRoot, outputFile))
  let relative = path.relative(outputDirectory, target).split(path.sep).join('/')
  if (!relative.startsWith('.')) relative = './' + relative
  return relative + url.search + url.hash
}

export function makeProjectUrlsPortable(value, outputFile = 'dist/world.anyo.json') {
  if (typeof value === 'string') return portableProjectString(value, outputFile)
  if (Array.isArray(value)) return value.map(entry => makeProjectUrlsPortable(entry, outputFile))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, makeProjectUrlsPortable(entry, outputFile)]))
  }
  return value
}
