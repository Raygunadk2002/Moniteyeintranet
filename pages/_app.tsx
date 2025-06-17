import type { AppProps } from 'next/app'
import '../styles/globals.css'
// import { AuthProvider } from '../contexts/AuthContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    // Temporarily disabled new auth system - use old password login at /login
    <Component {...pageProps} />
  )
} 