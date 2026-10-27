import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from './state/AuthContext'
import type { ReactNode } from 'react'

export function Shell({ children }: { children: ReactNode }) {
  const { team, user, signOut, token } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">LP</span>
          <span>
            <b>LOG POSE</b>
            <small>BOUNTY GUILD CONSOLE</small>
          </span>
        </Link>
        <div className="nav-label">
          EAST BLUE <span className="tiny-dot" />
        </div>
        <nav className="nav-list">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>⌂</span> Overview
          </NavLink>
          <NavLink
            to="/wanted"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>◎</span> Wanted posters
          </NavLink>
          <NavLink to="/crews" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>⚓</span> Crews
          </NavLink>
        </nav>
        <div className="nav-label grand-label">
          GRAND LINE <span className="lock-label">⌑</span>
        </div>
        <nav className="nav-list">
          <NavLink to="/news" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>✉</span> World news
          </NavLink>
          <NavLink to="/sagas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>◈</span> Poneglyphs
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="team-chip">
            <span className="team-avatar">☠</span>
            <span>
              <b>{team?.name ?? 'Your crew'}</b>
              <small>{team?.code ?? 'NO TEAM CODE'}</small>
            </span>
          </div>
          <button
            className="logout-button"
            onClick={() => {
              signOut()
              navigate('/login')
            }}
          >
            ↗ <span>Sign out</span>
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            GUILD CONSOLE <span>/</span> <strong>{team?.code ?? 'EAST BLUE'}</strong>
          </div>
          <div className="user-mini">
            <span className="online-dot" /> {user?.name ?? 'Navigator'}{' '}
            <span className="user-avatar">{(user?.name ?? 'N').slice(0, 1).toUpperCase()}</span>
          </div>
        </header>
        <div className="page-content">{children}</div>
        <footer className="footer">
          <span>LOG POSE CONSOLE</span>
          <span>THE SEA IS WIDE. KEEP YOUR BEARING.</span>
        </footer>
      </main>
    </div>
  )
}

export function Protected({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  const navigate = useNavigate()
  if (loading)
    return (
      <div className="screen-center">
        <div className="spinner" />
        <p>Restoring your log pose…</p>
      </div>
    )
  if (!token) {
    const returnTo = window.location.pathname + window.location.search
    navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true })
    return null
  }
  return <Shell>{children}</Shell>
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
export function LoadingBlock({ label = 'Charting the waters…' }: { label?: string }) {
  return (
    <div className="loading-block">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  )
}
export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-block">
      <span className="error-symbol">!</span>
      <div>
        <b>We lost the signal</b>
        <p>{message}</p>
        {onRetry && (
          <button className="button button-dark" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
export function EmptyBlock({ title, message }: { title: string; message: string }) {
  return (
    <div className="empty-block">
      <div className="empty-icon">⌁</div>
      <b>{title}</b>
      <p>{message}</p>
    </div>
  )
}
export function Money({
  value,
}: {
  value: number
}) {

  return value +' BERR';
  
}
export function StatusPill({ children }: { children: ReactNode }) {
  const value = String(children).toLowerCase().replaceAll('_', ' ')
  return <span className={`status-pill status-${value.replaceAll(' ', '-')}`}>{value}</span>
}
