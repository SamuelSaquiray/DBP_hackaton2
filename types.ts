import { useEffect, useState, type FormEvent, type CSSProperties } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, ApiRequestError } from './api'
import { EmptyBlock, ErrorBlock, LoadingBlock, Money, PageTitle, Protected, StatusPill } from './components'
import { useAuth } from './state/AuthContext'
import type { DashboardSummary, LogPose, NewsDetail, NewsItem, SagaStory, SagaSummary, WantedDetail, WantedSummary } from './types'

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Algo salió mal. Inténtalo de nuevo.'
}
function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiRequestError)) return {}
  return Object.fromEntries((error.details ?? []).map((item) => [item.field, item.message]))
}
function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { signIn, signUp, token } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [teamName, setTeamName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isRegister = mode === 'register'
  const returnTo = params.get('returnTo') || '/'
  if (token) return <Navigate to={returnTo} replace />
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(''); setErrors({})
    try {
      if (isRegister) await signUp(teamName.trim(), email.trim(), password)
      else await signIn(email.trim(), password)
      navigate(returnTo, { replace: true })
    } catch (err) {
      setError(messageOf(err)); setErrors(fieldErrors(err))
    } finally { setBusy(false) }
  }
  return <div className="auth-screen">
    <div className="auth-art"><div className="auth-brand"><span className="brand-mark">LP</span><span><b>LOG POSE</b><small>BOUNTY GUILD CONSOLE</small></span></div><div className="auth-art-content"><div className="eyebrow">THE GRAND LINE AWAITS</div><h1>Every legend<br />starts with a <em>crew.</em></h1><p>Track the wanted. Follow the rumors. Chart your own course through the world's most dangerous waters.</p><div className="compass-art"><div className="compass-ring"><span>N</span><span>E</span><span>S</span><span>W</span><div className="compass-needle" /></div></div></div><div className="auth-art-footer">GUILD FIELD TERMINAL <span>EST. THE GREAT AGE</span></div></div>
    <div className="auth-form-side"><div className="auth-form-wrap"><div className="eyebrow">{isRegister ? 'NEW EXPEDITION' : 'WELCOME BACK, NAVIGATOR'}</div><h2>{isRegister ? 'Assemble your crew.' : 'Return to the sea.'}</h2><p className="form-intro">{isRegister ? 'Register your crew to establish a private guild workspace.' : 'Enter your crew credentials to pick up where you left off.'}</p>
      {error && <div className="form-alert">{error}</div>}
      <form onSubmit={submit} className="auth-form">
        {isRegister && <label>Crew name<div className="input-wrap"><span>⚓</span><input autoComplete="organization" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Red Harbor Guild" required /></div>{errors.teamName && <small className="field-error">{errors.teamName}</small>}</label>}
        <label>Email address<div className="input-wrap"><span>✉</span><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="captain@yourcrew.com" required /></div>{errors.email && <small className="field-error">{errors.email}</small>}</label>
        <label>Password<div className="input-wrap"><span>⌑</span><input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" minLength={1} required /></div>{errors.password && <small className="field-error">{errors.password}</small>}</label>
        <button className="button button-primary button-full" disabled={busy}>{busy ? 'Connecting…' : isRegister ? 'Register your crew  →' : 'Enter the console  →'}</button>
      </form>
      <div className="auth-switch">{isRegister ? 'Already registered?' : 'New to the guild?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Register a crew'}</Link></div>
      <div className="auth-note"><span>ⓘ</span> One account per team. All crew members use the same credentials.</div>
    </div><div className="auth-copyright">LOG POSE CONSOLE <span>© GUILD ARCHIVES</span></div></div>
  </div>
}

function Dashboard() {
  const { token, team } = useAuth()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [pose, setPose] = useState<LogPose | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  async function load() {
    if (!token) return
    setLoading(true); setError('')
    try {
      const [summary, logPose] = await Promise.all([api.dashboard(token), api.logPose(token)])
      setData(summary); setPose(logPose)
    } catch (err) {
      if (err instanceof ApiRequestError && [401, 403].includes(err.status)) localStorage.removeItem('log-pose-session')
      setError(messageOf(err))
    } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [token])
  const count = (value: Record<string, number> | undefined) => value ? Object.values(value).reduce((sum, n) => sum + (typeof n === 'number' ? n : 0), 0) : 0
  return <><PageTitle eyebrow="EAST BLUE / COMMAND DECK" title={`Welcome aboard${team?.name ? `, ${team.name}` : ''}.`} subtitle="Your crew's intelligence, bounty movements, and current bearing." action={<button className="button button-outline" onClick={() => void load()}>↻ Refresh data</button>} />
    {loading ? <LoadingBlock label="Syncing crew intelligence…" /> : error ? <ErrorBlock message={error} onRetry={() => void load()} /> : data && <>
      <section className="hero-panel"><div className="hero-copy"><div className="eyebrow light">CREW IDENTIFICATION / {data.team.code}</div><h2>Keep your eyes<br />on the <em>horizon.</em></h2><p>{pose?.message ?? 'Your crew intelligence is ready. The sea is full of opportunity.'}</p><div className="hero-actions"><Link to="/wanted" className="button button-light">Explore wanted posters ↗</Link><Link to="/news" className="hero-text-link">Read world news <span>→</span></Link></div></div><div className="hero-compass"><div className="big-compass"><span>N</span><span>E</span><span>S</span><span>W</span><div className="big-needle" /><div className="compass-center">LP</div></div><div className={`pose-state ${pose?.grandLineUnlocked ? 'unlocked' : ''}`}><span className="state-dot" /> LOG POSE {pose?.grandLineUnlocked ? 'UNLOCKED' : 'LOCKED'}</div></div><div className="hero-stamp">FIELD<br />REPORT <span>№ 001</span></div></section>
      <div className="stats-grid"><article className="stat-card"><div className="stat-top"><span>ACTIVE WANTED</span><span className="stat-icon">◎</span></div><strong>{data.wanted ? count(data.wanted).toLocaleString() : '—'}</strong><small>Records in your workspace</small><div className="stat-bottom">BOUNTY INTELLIGENCE <span>↗</span></div></article><article className="stat-card"><div className="stat-top"><span>CREWS TRACKED</span><span className="stat-icon">⚓</span></div><strong>{data.crews ? count(data.crews).toLocaleString() : '—'}</strong><small>Known crews on record</small><div className="stat-bottom">CREW REGISTER <span>↗</span></div></article><article className="stat-card accent-stat"><div className="stat-top"><span>GRAND LINE</span><span className="stat-icon">⌁</span></div><strong>{pose?.grandLineUnlocked ? 'OPEN' : 'LOCKED'}</strong><small>{pose?.grandLineUnlocked ? 'Your crew may proceed.' : 'Awaiting Log Pose inspection.'}</small><div className="stat-bottom">{pose?.grandLineUnlocked ? 'COURSE AVAILABLE' : 'REVERSE MOUNTAIN'} <span>↗</span></div></article></div>
      <section className="section-block"><div className="section-heading"><div><div className="eyebrow">MOST WANTED</div><h2>Top bounties</h2></div><Link className="inline-link" to="/wanted">View all posters <span>→</span></Link></div>
        {data.topBounties?.length ? <div className="bounty-list">{data.topBounties.slice(0, 5).map((person, i) => <WantedRow key={person.id} item={person} rank={i + 1} />)}</div> : <EmptyBlock title="No bounty data yet" message="The backend hasn't returned any top bounty records for this crew." />}
      </section>
      <div className="data-footnote">LAST SYNC: {new Date(data.generatedAt).toLocaleString()} <span>•</span> DATA PROVIDED BY GUILD API</div>
    </>}
  </>
}
function WantedRow({ item, rank }: { item: WantedSummary; rank?: number }) {
  return <Link to={`/wanted/${encodeURIComponent(item.id)}`} className="bounty-row"><span className="bounty-rank">{String(rank ?? '↗').padStart(2, '0')}</span><span className="bounty-avatar">{item.name.slice(0, 1).toUpperCase()}</span><span className="bounty-person"><b>{item.name}</b><small>{item.epithet} · {item.crew?.name ?? 'Unknown crew'}</small></span><span className="bounty-status"><StatusPill>{item.status}</StatusPill></span><strong className="bounty-value"><Money value={item.bounty} /></strong><span className="row-arrow">↗</span></Link>
}
function WantedList() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<WantedSummary[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [crews, setCrews] = useState<Array<{ id: string; name: string }>>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [draftQ, setDraftQ] = useState(searchParams.get('q') ?? '')
  const page = Math.max(0, Number(searchParams.get('page') ?? '0') || 0)
  const size = [10, 20, 50].includes(Number(searchParams.get('size'))) ? Number(searchParams.get('size')) : 10
  const status = searchParams.get('status') ?? ''
  const crewId = searchParams.get('crewId') ?? ''
  const fruit = searchParams.get('fruit') ?? ''
  const sort = searchParams.get('sort') ?? 'bounty,desc'
  function update(values: Record<string, string>, resetPage = true) {
    const next = new URLSearchParams(searchParams)
    Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    if (resetPage) next.set('page', '0')
    if (!next.get('size')) next.set('size', '10')
    setSearchParams(next)
  }
  useEffect(() => { setDraftQ(searchParams.get('q') ?? '') }, [searchParams])
  useEffect(() => {
    if (!token) return
    void api.crews(token).then(setCrews).catch(() => setCrews([]))
  }, [token])
  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    const query = new URLSearchParams()
    query.set('page', String(page)); query.set('size', String(size)); query.set('sort', sort)
    if (status) query.set('status', status)
    if (crewId) query.set('crewId', crewId)
    if (fruit) query.set('fruit', fruit)
    if (searchParams.get('q')) query.set('q', searchParams.get('q') ?? '')
    setLoading(true); setError('')
    void api.wanted(token, query, controller.signal).then(result => {
      setItems(result.content); setTotal(result.totalElements); setTotalPages(result.totalPages)
    }).catch(err => { if (!(err instanceof DOMException && err.name === 'AbortError')) setError(messageOf(err)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, searchParams.toString()])
  function submitSearch(event: FormEvent) { event.preventDefault(); update({ q: draftQ.trim() }) }
  const fruitOptions = ['PARAMECIA', 'ZOAN', 'LOGIA']
  return <><PageTitle eyebrow="EAST BLUE / INTELLIGENCE ARCHIVE" title="Wanted posters" subtitle="Bounty records collected across the seas." action={<span className="count-badge">{total.toLocaleString()} RECORDS</span>} />
    <section className="filter-panel"><form className="search-form" onSubmit={submitSearch}><span>⌕</span><input value={draftQ} onChange={e => setDraftQ(e.target.value)} placeholder="Search by name or epithet…" /><button className="button button-dark">Search</button></form>
      <div className="filter-grid"><label>STATUS<select value={status} onChange={e => update({ status: e.target.value })}><option value="">All statuses</option><option value="AT_LARGE">At large</option><option value="CAPTURED">Captured</option><option value="MISSING">Missing</option></select></label><label>CREW<select value={crewId} onChange={e => update({ crewId: e.target.value })}><option value="">All crews</option>{crews.map(crew => <option key={crew.id} value={crew.id}>{crew.name}</option>)}</select></label><label>DEVIL FRUIT<select value={fruit} onChange={e => update({ fruit: e.target.value })}><option value="">All types</option>{fruitOptions.map(type => <option key={type} value={type}>{type}</option>)}</select></label><label>SORT BY<select value={sort} onChange={e => update({ sort: e.target.value })}><option value="bounty,desc">Highest bounty</option><option value="name,asc">Name A–Z</option><option value="updatedAt,desc">Recently updated</option></select></label></div>
    </section>
    <div className="list-meta"><span>{loading ? 'Scanning the archive…' : `Showing ${items.length} of ${total.toLocaleString()} records`}</span><label>ROWS <select value={size} onChange={e => update({ size: e.target.value })}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label></div>
    {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={() => setSearchParams(new URLSearchParams(searchParams))} /> : items.length ? <div className="bounty-list panel-list">{items.map((item, i) => <WantedRow key={item.id} item={item} rank={page * size + i + 1} />)}</div> : <EmptyBlock title="No posters found" message="Try adjusting your filters or searching for another name." />}
    <div className="pagination"><span>PAGE {totalPages ? page + 1 : 0} OF {totalPages}</span><div><button className="button button-outline" disabled={page <= 0 || loading} onClick={() => update({ page: String(page - 1) }, false)}>← Previous</button><button className="button button-dark" disabled={loading || totalPages === 0 || page + 1 >= totalPages} onClick={() => update({ page: String(page + 1) }, false)}>Next →</button></div></div>
  </>
}
function WantedDetailPage() {
  const { id = '' } = useParams()
  const { token } = useAuth()
  const [item, setItem] = useState<WantedDetail | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const back = `/wanted${window.location.search || ''}`
  async function load() {
    if (!token) return
    setLoading(true); setError('')
    try { setItem(await api.wantedDetail(token, id)) } catch (err) { setError(messageOf(err)) } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [token, id])
  return <><PageTitle eyebrow="EAST BLUE / WANTED ARCHIVE" title="Bounty dossier" subtitle="Full intelligence record for this target." action={<Link className="button button-outline" to={back}>← Back to posters</Link>} />
    {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={() => void load()} /> : item && <div className="detail-grid"><section className="wanted-dossier"><div className="dossier-top"><span>GUILD BOUNTY OFFICE</span><span>№ {item.id.slice(-6).toUpperCase()}</span></div><div className="wanted-portrait">{item.name.slice(0, 1).toUpperCase()}</div><div className="eyebrow">WANTED / DEAD OR ALIVE</div><h2>{item.name}</h2><p className="epithet">{item.epithet}</p><div className="dossier-bounty"><small>BOUNTY</small><strong><Money value={item.bounty} /></strong></div><StatusPill>{item.status}</StatusPill><div className="dossier-bottom">ISSUED BY THE BOUNTY GUILD</div></section><section className="detail-info"><div className="eyebrow">TARGET INTELLIGENCE</div><h2>Known details</h2><p className="bio">{item.bio || 'No biography provided by the Guild API.'}</p><div className="detail-facts"><div><small>CREW</small><b>{item.crew?.name ?? 'Unknown'}</b></div><div><small>ROLE</small><b>{item.role}</b></div><div><small>DEVIL FRUIT</small><b>{item.devilFruit?.name ?? 'Unknown'}</b></div><div><small>FRUIT TYPE</small><b>{item.devilFruit?.type ?? 'Unknown'}</b></div><div><small>AGE</small><b>{item.age} years</b></div><div><small>HEIGHT</small><b>{item.heightCm} cm</b></div><div><small>THREAT LEVEL</small><b>{item.threatLevel}</b></div><div><small>LAST SEEN</small><b>{item.lastSeenIsland}</b></div></div><div className="data-footnote">UPDATED {new Date(item.updatedAt).toLocaleString()}</div></section></div>}
  </>
}
function CrewsPage() {
  const { token } = useAuth()
  const [crews, setCrews] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  async function load() { if (!token) return; setLoading(true); setError(''); try { setCrews(await api.crews(token)) } catch (e) { setError(messageOf(e)) } finally { setLoading(false) } }
  useEffect(() => { void load() }, [token])
  return <><PageTitle eyebrow="EAST BLUE / CREW REGISTER" title="Crews of the sea" subtitle="Known pirate crews reported to the Guild." /><div className="section-block">{loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={() => void load()} /> : crews.length ? <div className="crew-grid">{crews.map((crew, index) => <article className="crew-card" key={crew.id}><span className="crew-card-num">{String(index + 1).padStart(2, '0')}</span><div className="crew-card-mark">⚓</div><h3>{crew.name}</h3><p>Registered crew</p><small>GUILD RECORD · {crew.id}</small></article>)}</div> : <EmptyBlock title="No crews in the register" message="The API hasn't returned any crew records." />}</div></>
}
function NewsPage() {
  const { token } = useAuth()
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<NewsItem[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initial, setInitial] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<NewsDetail | null>(null)
  const [detailError, setDetailError] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState('')
  const type = params.get('type') ?? ''
  const priority = params.get('priority') ?? ''
  const status = params.get('status') ?? ''
  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    let active = true
    setItems([]); setCursor(null); setHasMore(true); setError(''); setInitial(true)
    const query = new URLSearchParams({ limit: '20' })
    if (type) query.set('type', type)
    if (priority) query.set('priority', priority)
    if (status) query.set('status', status)
    setLoading(true)
    void api.newsFeed(token, query, controller.signal).then(result => {
      if (!active) return
      setItems(result.items); setCursor(result.nextCursor); setHasMore(result.hasMore)
    }).catch(err => { if (active && !(err instanceof DOMException && err.name === 'AbortError')) setError(messageOf(err)) })
      .finally(() => { if (active) { setLoading(false); setInitial(false) } })
    return () => { active = false; controller.abort() }
  }, [token, type, priority, status])
  async function loadMore() {
    if (!token || loading || !hasMore || !cursor) return
    setLoading(true); setError('')
    const query = new URLSearchParams({ limit: '20', cursor })
    if (type) query.set('type', type)
    if (priority) query.set('priority', priority)
    if (status) query.set('status', status)
    try {
      const result = await api.newsFeed(token, query)
      setItems(previous => {
        const seen = new Set(previous.map(item => item.id))
        return [...previous, ...result.items.filter(item => !seen.has(item.id))]
      })
      setCursor(result.nextCursor); setHasMore(result.hasMore)
    } catch (err) { setError(messageOf(err)) } finally { setLoading(false) }
  }
  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) void loadMore()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [loading, hasMore, cursor, type, priority, status, token])
  async function openDetail(id: string) {
    if (!token) return
    setDetail(null); setDetailError(''); setDetailLoading(true)
    try { setDetail(await api.newsDetail(token, id)) } catch (err) { setDetailError(messageOf(err)) } finally { setDetailLoading(false) }
  }
  async function verify(next: 'CONFIRMED' | 'DEBUNKED') {
    if (!token || !detail || updating) return
    setUpdating(true); setToast('')
    try {
      const updated = await api.updateNews(token, detail.id, next)
      setDetail(updated); setItems(old => old.map(item => item.id === updated.id ? { ...item, ...updated } : item))
      setToast(`Rumor marked as ${next.toLowerCase()}.`)
    } catch (err) { setDetailError(messageOf(err)) } finally { setUpdating(false) }
  }
  function updateFilter(key: string, value: string) { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next) }
  return <><PageTitle eyebrow="GRAND LINE / NEWS COO" title="World news" subtitle="Rumors, reports, and verified dispatches from across the seas." action={<span className="count-badge">LIVE DISPATCHES</span>} />
    <div className="news-filters"><label>TYPE<select value={type} onChange={e => updateFilter('type', e.target.value)}><option value="">All types</option>{['POLITICS','BATTLE','Bounty','ECONOMY','OTHER'].map(v => <option key={v} value={v}>{v}</option>)}</select></label><label>PRIORITY<select value={priority} onChange={e => updateFilter('priority', e.target.value)}><option value="">All priorities</option>{['LOW','MEDIUM','HIGH','CRITICAL'].map(v => <option key={v} value={v}>{v}</option>)}</select></label><label>STATUS<select value={status} onChange={e => updateFilter('status', e.target.value)}><option value="">All statuses</option>{['RUMOR','CONFIRMED','DEBUNKED'].map(v => <option key={v} value={v}>{v}</option>)}</select></label></div>
    {initial && loading ? <LoadingBlock label="Receiving News Coo dispatches…" /> : error && !items.length ? <ErrorBlock message={error} onRetry={() => setParams(new URLSearchParams(params))} /> : items.length ? <div className="news-grid">{items.map((item, index) => <article className={`news-card ${index === 0 ? 'featured-news' : ''}`} key={item.id}><div className="news-card-top"><span className="news-type">{item.type}</span><StatusPill>{item.status}</StatusPill></div><div className="news-card-index">DISPATCH / {String(index + 1).padStart(3, '0')}</div><h2>{item.title}</h2><p>{item.summary}</p><div className="news-card-meta"><span>⌁ {item.island}</span><span>{new Date(item.publishedAt).toLocaleDateString()}</span></div><button className="inline-link" onClick={() => void openDetail(item.id)}>Read dispatch <span>→</span></button></article>)}</div> : !loading ? <EmptyBlock title="No dispatches found" message="There are no news items matching these filters." /> : null}
    {error && items.length > 0 && <ErrorBlock message={error} onRetry={() => void loadMore()} />}{loading && !initial && <LoadingBlock label="Loading the next dispatches…" />}{!hasMore && items.length > 0 && <div className="end-of-feed">— END OF CURRENT DISPATCHES —</div>}
    {(detail || detailLoading || detailError) && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) { setDetail(null); setDetailError('') } }}><section className="news-modal" role="dialog" aria-modal="true" aria-label="News dispatch"><button className="modal-close" onClick={() => { setDetail(null); setDetailError('') }}>×</button>{detailLoading ? <LoadingBlock /> : detailError && !detail ? <ErrorBlock message={detailError} onRetry={() => detail && void openDetail(detail.id)} /> : detail && <><div className="eyebrow">NEWS COO / FULL DISPATCH</div><div className="news-card-top"><span className="news-type">{detail.type} · {detail.priority}</span><StatusPill>{detail.status}</StatusPill></div><h2>{detail.title}</h2><div className="news-modal-meta">SOURCE: {detail.source} · ISLAND: {detail.island} · {new Date(detail.publishedAt).toLocaleString()}</div><p className="news-body">{detail.body}</p>{detailError && <div className="form-alert">{detailError}</div>}{toast && <div className="success-alert">{toast}</div>}{detail.status === 'RUMOR' && <div className="verify-actions"><button className="button button-primary" disabled={updating} onClick={() => void verify('CONFIRMED')}>{updating ? 'Saving…' : '✓ Confirm rumor'}</button><button className="button button-outline" disabled={updating} onClick={() => void verify('DEBUNKED')}>✕ Debunk rumor</button></div>}</>}</section></div>}
  </>
}
function SagasPage() {
  const { token } = useAuth()
  const [sagas, setSagas] = useState<SagaSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  async function load() { if (!token) return; setLoading(true); setError(''); try { setSagas(await api.sagas(token)) } catch (err) { setError(messageOf(err)) } finally { setLoading(false) } }
  useEffect(() => { void load() }, [token])
  return <><PageTitle eyebrow="GRAND LINE / PONEGLYPH ARCHIVE" title="The great sagas" subtitle="The true history, recorded one island at a time." /><div className="saga-intro"><div className="eyebrow light">THE SEA REMEMBERS</div><h2>Every island leaves<br />a mark on history.</h2><p>Explore the route. Read each stage. Discover what the Log Pose has preserved.</p></div>{loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={() => void load()} /> : sagas.length ? <div className="saga-grid">{sagas.map(saga => <Link to={`/sagas/${encodeURIComponent(saga.id)}`} key={saga.id} className="saga-card" style={{ '--saga-primary': saga.palette?.primary ?? '#d4a14e', '--saga-surface': saga.palette?.surface ?? '#243447' } as CSSProperties}><div className="saga-order">SAGA {String(saga.order).padStart(2, '0')} <span>↗</span></div><div className="saga-emblem">◈</div><h2>{saga.title}</h2><div className="saga-subtitle">{saga.subtitle}</div><p>{saga.synopsis}</p><div className="saga-route"><span>{saga.firstIsland}</span><span className="route-line" /><span>{saga.lastIsland}</span></div><div className="saga-meta"><span>{saga.stageCount} STAGES</span><span>{saga.totalDistanceNm.toLocaleString()} NM</span></div></Link>)}</div> : <EmptyBlock title="No saga records" message="The API hasn't returned any saga summaries." />}</>
}
function SagaStoryPage() {
  const { id = '' } = useParams()
  const { token } = useAuth()
  const [story, setStory] = useState<SagaStory | null>(null)
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  async function load() { if (!token) return; setLoading(true); setError(''); try { const result = await api.sagaStory(token, id); setStory(result); const stageSlug = window.location.hash.slice(1); const found = result.stages.findIndex(stage => stage.slug === stageSlug); setActive(Math.max(0, found)) } catch (err) { setError(messageOf(err)) } finally { setLoading(false) } }
  useEffect(() => { void load() }, [token, id])
  useEffect(() => {
    if (!story) return
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-stage-index]'))
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) {
        const index = Number((visible.target as HTMLElement).dataset.stageIndex)
        if (Number.isInteger(index)) { setActive(index); window.history.replaceState(null, '', `#${story.stages[index]?.slug ?? ''}`) }
      }
    }, { threshold: [0.25, 0.5, 0.75] })
    nodes.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [story])
  function goTo(index: number) { const node = document.querySelector<HTMLElement>(`[data-stage-index="${index}"]`); node?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }) }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') { event.preventDefault(); goTo(Math.min((story?.stages.length ?? 1) - 1, active + 1)) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(Math.max(0, active - 1)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, story])
  return <><PageTitle eyebrow="GRAND LINE / PONEGLYPH" title={story?.saga.title ?? 'Saga chronicle'} subtitle={story?.saga.subtitle ?? 'An account of the voyage.'} action={<Link className="button button-outline" to="/sagas">← All sagas</Link>} />
    {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={() => void load()} /> : story && <><div className="story-progress"><span>VOYAGE PROGRESS</span><div className="progress-track"><div style={{ width: `${((active + 1) / Math.max(story.stages.length, 1)) * 100}%` }} /></div><b>{active + 1} / {story.stages.length}</b></div><div className="story-layout"><aside className="story-map"><div className="eyebrow light">ROUTE MAP</div><h3>Grand Line</h3><div className="map-plot">{story.stages.map((stage, index) => <button key={stage.id} className={`map-island ${index === active ? 'current' : ''} ${index < active ? 'visited' : ''}`} style={{ left: `${Math.max(7, Math.min(90, Number(stage.island?.x ?? (15 + index * (70 / Math.max(1, story.stages.length - 1)))))}%`, top: `${Math.max(8, Math.min(90, Number(stage.island?.y ?? (15 + (index % 2) * 60)))}%` }} onClick={() => goTo(index)} title={stage.title}><span>{index + 1}</span><small>{String(stage.island?.name ?? stage.title)}</small></button>)}</div><div className="map-legend"><span><i className="legend-visited" /> TRAVERSED</span><span><i className="legend-current" /> CURRENT ISLAND</span></div></aside><div className="story-stages">{story.stages.map((stage, index) => <article data-stage-index={index} key={stage.id} className={`story-stage ${index === active ? 'stage-active' : ''}`} style={{ '--stage-primary': stage.palette?.primary ?? '#d4a14e', '--stage-background': stage.palette?.background ?? '#101b2b', '--stage-text': stage.palette?.text ?? '#f4f0e8' } as CSSProperties}><div className="stage-kicker">STAGE {String(stage.order).padStart(2, '0')} <span>·</span> {String(stage.island?.name ?? 'UNKNOWN ISLAND')}</div><h2>{stage.title}</h2><p>{stage.narrative}</p><div className="stage-metrics">{stage.metrics.map(metric => <div key={metric.key}><small>{metric.label}</small><b>{metric.value} <span>{metric.unit}</span></b></div>)}</div><div className="stage-nav"><button className="button button-outline" disabled={index === 0} onClick={() => goTo(index - 1)}>← Previous</button><span>{index + 1} OF {story.stages.length}</span><button className="button button-dark" disabled={index === story.stages.length - 1} onClick={() => goTo(index + 1)}>Next stage →</button></div></article>)}</div></div></>}
  </>
}
function NotFound() {
  return <div className="not-found"><div className="eyebrow">UNKNOWN WATERS / 404</div><div className="not-found-number">404</div><h1>This route is uncharted.</h1><p>The Guild's map has no record of this location.</p><Link to="/" className="button button-primary">Return to command deck →</Link></div>
}
function AppRoutes() {
  const { token, loading } = useAuth()
  const location = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }) }, [location.pathname])
  if (loading && !['/login', '/register'].includes(location.pathname)) return <div className="screen-center"><div className="spinner" /><p>Restoring your log pose…</p></div>
  return <Routes>
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/" element={<Protected><Dashboard /></Protected>} />
    <Route path="/wanted" element={<Protected><WantedList /></Protected>} />
    <Route path="/wanted/:id" element={<Protected><WantedDetailPage /></Protected>} />
    <Route path="/crews" element={<Protected><CrewsPage /></Protected>} />
    <Route path="/news" element={<Protected>{token ? <NewsPage /> : null}</Protected>} />
    <Route path="/sagas" element={<Protected><SagasPage /></Protected>} />
    <Route path="/sagas/:id" element={<Protected><SagaStoryPage /></Protected>} />
    <Route path="*" element={token ? <Protected><NotFound /></Protected> : <NotFound />} />
  </Routes>
}
export default function App() { return <AppRoutes /> }