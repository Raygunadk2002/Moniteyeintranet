import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Clear the authentication cookie
  res.setHeader('Set-Cookie', 'moniteye-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict')
  
  return res.status(200).json({ 
    success: true, 
    message: 'Logged out successfully' 
  })
} 