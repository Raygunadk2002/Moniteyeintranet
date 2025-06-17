import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServer } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, role = 'employee', department } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  const supabase = getSupabaseServer()

  try {
    // Create invitation using the database function
    const { data, error } = await supabase
      .rpc('create_invitation', {
        invite_email: email,
        invite_role: role,
        invite_department: department
      })

    if (error) {
      console.error('Error creating invitation:', error)
      return res.status(400).json({ error: error.message })
    }

    const invitationData = data[0]
    
    // In a real app, you'd send an email here
    // For now, we'll return the invitation link
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/login?invite=${invitationData.invitation_token}`

    return res.status(200).json({
      success: true,
      invitation_id: invitationData.invitation_id,
      invite_url: inviteUrl,
      message: 'Invitation created successfully'
    })

  } catch (error) {
    console.error('Error creating invitation:', error)
    return res.status(500).json({ error: 'Failed to create invitation' })
  }
} 