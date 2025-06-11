import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Scopes for calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  if (method === 'GET') {
    const { code, state, error } = query;

    if (error) {
      return res.status(400).json({ error: 'Authorization failed', details: error });
    }

    if (code) {
      // Handle OAuth callback with authorization code
      try {
        const { tokens } = await oauth2Client.getToken(code as string);
        oauth2Client.setCredentials(tokens);

        // Get user info to identify the employee
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        const employeeData = {
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
          authorizedAt: new Date().toISOString()
        };

        // In production, save tokens to database
        // For now, return success with employee data
        console.log('Google Calendar authorized for:', employeeData.email);

        // Store in your database here
        // await saveEmployeeCalendarTokens(employeeData);

        res.status(200).json({
          success: true,
          message: 'Google Calendar access authorized successfully!',
          employee: {
            email: employeeData.email,
            name: employeeData.name,
            picture: employeeData.picture
          }
        });

      } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        res.status(500).json({ error: 'Failed to get access token' });
      }
    } else {
      // Generate authorization URL
      const employeeId = query.employeeId as string;
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        state: employeeId // Pass employee ID to track who's authorizing
      });

      res.redirect(authUrl);
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
} 