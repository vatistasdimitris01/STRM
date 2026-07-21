const TMDB_BASE = 'https://api.themoviedb.org/3'
const CONFIG_URL = 'https://strm.sh/api/config'

let cachedApiKey = ''
let cachedReadToken = ''

async function loadCredentials(): Promise<{apiKey: string; readToken: string}> {
  if (cachedApiKey && cachedReadToken) {
    return {apiKey: cachedApiKey, readToken: cachedReadToken}
  }

  const res = await fetch(CONFIG_URL, {cache: 'no-store'})
  if (!res.ok) throw new Error('Failed to fetch credentials')
  const data = await res.json()
  cachedApiKey = data.tmdbApiKey || ''
  cachedReadToken = data.tmdbReadAccessToken || ''
  return {apiKey: cachedApiKey, readToken: cachedReadToken}
}

export type MediaResult = {
  id: number
  title: string
  name: string
  media_type: 'movie' | 'tv'
  release_date?: string
  first_air_date?: string
  overview?: string
  vote_average?: number
  poster_path?: string | null
  backdrop_path?: string | null
}

export type SearchResponse = {
  results: MediaResult[]
  total_results: number
}

export async function searchTMDB(query: string): Promise<MediaResult[]> {
  const {readToken} = await loadCredentials()
  const url = `${TMDB_BASE}/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=1`
  const res = await fetch(url, {
    headers: {Authorization: `Bearer ${readToken}`},
  })
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`)
  const data: SearchResponse = await res.json()
  return data.results
    .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 20)
}

export async function getDetails(id: number, type: 'movie' | 'tv'): Promise<MediaResult & {seasons?: {season_number: number; episode_count: number; name: string}[]}> {
  const {apiKey} = await loadCredentials()
  const res = await fetch(`${TMDB_BASE}/${type}/${id}?api_key=${apiKey}&language=en-US`)
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`)
  return res.json()
}

export function mediaTitle(r: MediaResult): string {
  return r.title || r.name || 'Unknown'
}

export function mediaYear(r: MediaResult): string {
  const d = r.release_date || r.first_air_date || ''
  return d ? d.slice(0, 4) : '—'
}

export function mediaType(r: MediaResult): string {
  return r.media_type === 'movie' ? 'Movie' : 'Series'
}
