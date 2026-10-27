import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './state/AuthContext'
import App from './App'
import './index.css'
import { WantedProvider } from './state/WantedContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WantedProvider>
        <App />
        </WantedProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)