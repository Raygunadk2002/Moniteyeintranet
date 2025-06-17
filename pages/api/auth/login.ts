import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body

  if (!password) {
    return res.status(400).json({ error: 'Password is required' })
  }

  // Check password against environment variable
  const correctPassword = process.env.SITE_PASSWORD || 'moniteye2024'

  if (password === correctPassword) {
    return res.status(200).json({ 
      success: true, 
      message: 'Authentication successful' 
    })
  } else {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid password' 
    })
  }
} 