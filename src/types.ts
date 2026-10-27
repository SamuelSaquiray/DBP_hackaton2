export type User = {
  id: string;
  name: string;
  email: string 
  }
export type Team = { code: string; name: string }
export type AuthResponse = {
  token: string
  tokenType: string
  expiresAt: string
  user: User
  team: Team
}
export type MeResponse = { user: User; team: Team; expiresAt: string }
export type LogPose = {
  status: 'LOCKED' | 'UNLOCKED'
  grandLineUnlocked: boolean
  unlockedAt: string | null
  message: string
}
export type CrewRef = { id: string; name: string }
export type DevilFruit = { name: string; type: string }
export type WantedSummary = {
  id: string
  name: string
  epithet: string
  bounty: number
  status: 'AT_LARGE' | 'CAPTURED' | 'MISSING'
  crew: CrewRef
  role: string
  devilFruit: DevilFruit
  threatLevel: string
  lastSeenIsland: string
  updatedAt: string
}
export type WantedDetail = WantedSummary & {
  age: number
  heightCm: number
  bio: string
  lastSeen: { island?: string; [key: string]: unknown }
  bountyHistory: Array<{ amount?: number; date?: string; [key: string]: unknown }>
}
export type WantedPage = {
  content: WantedSummary[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}
export type DashboardSummary = {
  team: Team
  wanted: { [key: string]: number }
  crews: { [key: string]: number }
  topBounties: WantedSummary[]
  generatedAt: string
}
export type NewsItem = {
  id: string
  type: string
  priority: string
  status: 'RUMOR' | 'CONFIRMED' | 'DEBUNKED'
  title: string
  summary: string
  source: string
  island: string
  relatedWanted: WantedSummary | null
  publishedAt: string
  updatedAt: string
  verifiedAt: string | null
}
export type NewsDetail = NewsItem & { body: string }
export type NewsFeed = { items: NewsItem[]; nextCursor: string | null; hasMore: boolean }
export type Palette = {
  background: string
  surface: string
  primary: string
  accent: string
  text: string
}
export type SagaSummary = {
  id: string
  order: number
  title: string
  subtitle: string
  synopsis: string
  stageCount: number
  totalDistanceNm: number
  firstIsland: string
  lastIsland: string
  palette: Palette
}
export type SagaStage = {
  id: string
  order: number
  slug: string
  title: string
  narrative: string
  island: { name?: string; x?: number; y?: number; [key: string]: unknown }
  palette: Palette
  metrics: Array<{ key: string; label: string; value: number | string; unit: string }>
}
export type SagaStory = { saga: SagaSummary; map: Record<string, unknown>; stages: SagaStage[] }
export type ApiError = {
  status: number
  code: string
  message: string
  traceId: string
  details?: Array<{ field: string; message: string }>
  retryAfterSeconds?: number
  current?: NewsDetail
}
