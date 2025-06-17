import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const authCookie = req.cookies['moniteye-auth']
  const sitePassword = process.env.SITE_PASSWORD || 'moniteye2024'
  
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    environment: {
      hasPassword: !!process.env.SITE_PASSWORD,
      passwordLength: sitePassword.length,
      passwordPreview: sitePassword.substring(0, 3) + '***',
      host: req.headers.host,
      protocol: req.headers['x-forwarded-proto'] || 'http',
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
    },
    authentication: {
      hasCookie: !!authCookie,
      cookieValue: authCookie || 'not_set',
      isAuthenticated: authCookie === 'authenticated',
      allCookies: Object.keys(req.cookies)
    }
  })
} 