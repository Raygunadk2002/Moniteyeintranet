import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AuthLogin() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main login page since new auth system is disabled
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  )
} 