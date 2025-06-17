import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body

  if (!password) {
    return res.status(400).json({ error: 'Admin password is required' })
  }

  // Check admin password against environment variable
  const correctAdminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  // Debug logging (remove in production)
  console.log('Admin login attempt:', {
    receivedPasswordLength: password?.length,
    expectedPasswordLength: correctAdminPassword.length,
    passwordsMatch: password === correctAdminPassword,
    receivedFirstChar: password?.charAt(0),
    expectedFirstChar: correctAdminPassword.charAt(0),
    receivedLastChar: password?.charAt(password?.length - 1),
    expectedLastChar: correctAdminPassword.charAt(correctAdminPassword.length - 1)
  })

  if (password === correctAdminPassword) {
    return res.status(200).json({ 
      success: true, 
      message: 'Admin authentication successful' 
    })
  } else {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid admin password',
      debug: {
        receivedLength: password?.length,
        expectedLength: correctAdminPassword.length
      }
    })
  }
} 