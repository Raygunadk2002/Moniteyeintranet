import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get the admin password from environment
  const envAdminPassword = process.env.ADMIN_PASSWORD
  const defaultPassword = 'admin123'
  const actualPassword = envAdminPassword || defaultPassword

  return res.status(200).json({
    hasEnvVariable: !!envAdminPassword,
    envPasswordLength: envAdminPassword ? envAdminPassword.length : 0,
    envPasswordFirstChar: envAdminPassword ? envAdminPassword.charAt(0) : 'N/A',
    envPasswordLastChar: envAdminPassword ? envAdminPassword.charAt(envAdminPassword.length - 1) : 'N/A',
    usingDefault: !envAdminPassword,
    actualPasswordLength: actualPassword.length,
    // Don't expose the actual password for security
    debug: {
      message: 'Check if environment variable is properly set',
      expectedLength: 'MoniteyeAdmin2025!'.length, // 18 characters
      actualLength: actualPassword.length
    }
  })
} 