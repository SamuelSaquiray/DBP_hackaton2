import type {
  ApiError,
  AuthResponse,
  DashboardSummary,
  LogPose,
  MeResponse,
  NewsDetail,
  NewsFeed,
  NewsItem,
  SagaStory,
  SagaSummary,
  Team,
  WantedDetail,
  WantedPage,
} from './types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')
if (!BASE_URL) console.warn('Falta VITE_API_BASE_URL en el archivo .env')

export class ApiRequestError extends Error {
  status: number
  code: string
  traceId: string
  details: ApiError['details']
  retryAfterSeconds?: number
  current?: NewsDetail

  constructor(data: ApiError, fallbackStatus: number) {
    super(data.message || 'No se pudo completar la solicitud.')
    this.name = 'ApiRequestError'
    this.status = data.status || fallbackStatus
    this.code = data.code || 'UNKNOWN_ERROR'
    this.traceId = data.traceId || ''
    this.details = data.details
    this.retryAfterSeconds = data.retryAfterSeconds
    this.current = data.current
  }
}

type RequestOptions = {
  token?: string | null
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  signal?: AbortSignal
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.')
  }
  if (!response.ok) {
    let data: ApiError
    try {
      data = (await response.json()) as ApiError
    } catch {
      data = {
        status: response.status,
        code: 'HTTP_ERROR',
        message: 'Ocurrió un error inesperado.',
        traceId: '',
      }
    }
    throw new ApiRequestError(data, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  register: (teamName: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { teamName, email, password },
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  me: (token: string) => request<MeResponse>('/auth/me', { token }),
  dashboard: (token: string) => request<DashboardSummary>('/dashboard/summary', { token }),
  logPose: (token: string) => request<LogPose>('/log-pose', { token }),
  crews: (token: string) => request<Array<{ id: string; name: string }>>('/crews', { token }),
  wanted: (token: string, query: URLSearchParams, signal?: AbortSignal) =>
    request<WantedPage>(`/wanted?${query.toString()}`, { token, signal }),
  wantedDetail: (token: string, id: string, signal?: AbortSignal) =>
    request<WantedDetail>(`/wanted/${encodeURIComponent(id)}`, { token, signal }),
  newsFeed: (token: string, query: URLSearchParams, signal?: AbortSignal) =>
    request<NewsFeed>(`/news/feed?${query.toString()}`, { token, signal }),
  newsDetail: (token: string, id: string, signal?: AbortSignal) =>
    request<NewsDetail>(`/news/${encodeURIComponent(id)}`, { token, signal }),
  updateNews: (token: string, id: string, status: 'CONFIRMED' | 'DEBUNKED') =>
    request<NewsDetail>(`/news/${encodeURIComponent(id)}/status`, {
      token,
      method: 'PATCH',
      body: { status },
    }),
  sagas: (token: string) => request<SagaSummary[]>('/sagas', { token }),
  sagaStory: (token: string, id: string, signal?: AbortSignal) =>
    request<SagaStory>(`/sagas/${encodeURIComponent(id)}/story`, { token, signal }),
}
export type { Team }
