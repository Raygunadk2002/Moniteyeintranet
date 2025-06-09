import { NextApiRequest, NextApiResponse } from 'next';

const PIPEDRIVE_API_KEY = '6bb2f9bd5f09ec3205c6d5150bd3eb609351e681';
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Fetch deals from Pipedrive API with pagination to get recent deals
    let allDeals: any[] = [];
    let start = 0;
    const limit = 500;
    let hasMoreData = true;

    // Fetch multiple pages to ensure we get recent deals
    while (hasMoreData && start < 2000) { // Limit to 4 pages (2000 deals max) to avoid infinite loops
      const dealsResponse = await fetch(
        `${PIPEDRIVE_BASE_URL}/deals?api_token=${PIPEDRIVE_API_KEY}&start=${start}&limit=${limit}&status=all_not_deleted`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!dealsResponse.ok) {
        throw new Error(`Pipedrive API error: ${dealsResponse.status}`);
      }

      const dealsData = await dealsResponse.json();
      
      if (!dealsData.success || !dealsData.data || dealsData.data.length === 0) {
        hasMoreData = false;
        break;
      }

      allDeals = allDeals.concat(dealsData.data);
      
      // If we got less than the limit, we've reached the end
      if (dealsData.data.length < limit) {
        hasMoreData = false;
      } else {
        start += limit;
      }
    }
    
    if (allDeals.length === 0) {
      console.log('No deals data available');
      return res.status(200).json({
        newDealsCount: 0,
        newDealsValue: 0,
        error: 'No deals data available'
      });
    }

    console.log(`Total deals found: ${allDeals.length}`);

    // Filter deals created in the last 30 days
    const recentDeals = allDeals.filter((deal: any) => {
      if (!deal.add_time) return false;
      const dealDate = new Date(deal.add_time);
      return dealDate >= thirtyDaysAgo;
    });

    // Calculate total value of recent deals
    const totalValue = recentDeals.reduce((sum: number, deal: any) => {
      return sum + (deal.value || 0);
    }, 0);

    console.log(`Found ${recentDeals.length} deals in last 30 days with total value: ${totalValue}`);

    res.status(200).json({
      newDealsCount: recentDeals.length,
      newDealsValue: totalValue,
      currency: recentDeals.length > 0 ? recentDeals[0].currency : 'USD',
      deals: recentDeals.map((deal: any) => ({
        id: deal.id,
        title: deal.title,
        value: deal.value,
        currency: deal.currency,
        add_time: deal.add_time,
        status: deal.status
      }))
    });

  } catch (error) {
    console.error('Pipedrive API error:', error);
    res.status(500).json({
      newDealsCount: 0,
      newDealsValue: 0,
      error: 'Failed to fetch Pipedrive data'
    });
  }
} 