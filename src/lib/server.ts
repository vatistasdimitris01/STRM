import {spawn, type ChildProcess} from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import {type MediaResult} from './tmdb.js'

const MOVIE_PLAYER_DIR = path.resolve('/Users/vatistasdimitris/out/movie-player')
const PORT = 3000

let playerProcess: ChildProcess | null = null

async function isPortOpen(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const req = http.get(`http://127.0.0.1:${port}`, {timeout: 500}, () => {
      req.destroy()
      resolve(true)
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
  })
}

async function waitForServer(port: number, timeoutMs = 15000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen(port)) return true
    await new Promise(r => setTimeout(r, 300))
  }
  return false
}

export async function ensurePlayerRunning(): Promise<void> {
  if (await isPortOpen(PORT)) return

  if (!fs.existsSync(path.join(MOVIE_PLAYER_DIR, '.next'))) {
    throw new Error(`movie-player not built at ${MOVIE_PLAYER_DIR}`)
  }

  playerProcess = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: MOVIE_PLAYER_DIR,
    stdio: 'ignore',
    detached: true,
  })
  playerProcess.unref()

  const started = await waitForServer(PORT)
  if (!started) {
    throw new Error(`movie-player failed to start on port ${PORT}`)
  }
}

export function getPlayerUrl(result: MediaResult): string {
  const type = result.media_type === 'movie' ? 'movie' : 'tv'
  return `http://localhost:${PORT}/movies?id=${result.id}&type=${type}`
}
