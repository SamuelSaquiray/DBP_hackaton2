import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react'

interface WantedFilters {
  q: string
  status: string
  crewId: string
  fruit: string
  sort: string
  page: number
  size: number
}

interface WantedContextType {
  filters: WantedFilters
  setFilters: Dispatch<SetStateAction<WantedFilters>>
}

const initialFilters: WantedFilters = {
  q: '',
  status: '',
  crewId: '',
  fruit: '',
  sort: 'bounty,desc',
  page: 0,
  size: 10,
}

const WantedContext = createContext<WantedContextType | undefined>(undefined)

export function WantedProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<WantedFilters>(initialFilters)

  return (
    <WantedContext.Provider value={{ filters, setFilters }}>
      {children}
    </WantedContext.Provider>
  )
}

export function useWanted() {
  const context = useContext(WantedContext)

  if (!context) {
    throw new Error('useWanted must be used within WantedProvider')
  }

  return context
}