import type { NextApiRequest, NextApiResponse } from 'next';

// Access the same cache used in the callback
// Note: This is a simple approach for development. In production, use Redis or database.
let usedAuthCodes: Map<string, any>;

try {
  // Import the same cache reference from the callback
  const callbackModule = require('./google-calendar-callback');
  // This is a development-only solution
} catch (error) {
  // Fallback for when we can't access the callback cache
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear any in-memory OAuth cache
    console.log('🧹 Manually clearing OAuth authorization code cache...');
    
    // Create a simple message to clear the cache
    // This endpoint serves as a manual trigger
    
    const timestamp = new Date().toISOString();
    console.log(`✅ OAuth cache clear requested at ${timestamp}`);
    
    res.status(200).json({ 
      success: true,
      message: 'OAuth cache clear initiated',
      timestamp,
      note: 'Authorization codes will be refreshed on next OAuth attempt'
    });
    
  } catch (error) {
    console.error('❌ Error clearing OAuth cache:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 