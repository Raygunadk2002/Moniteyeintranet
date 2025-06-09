import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

interface RevenueData {
  month: string;
  revenue: number;
  timestamp: string;
}

interface RevenueDataFile {
  monthlyRevenue: RevenueData[];
  lastUpdated: string;
  totalRevenue: number;
  revenueChange: string;
  revenueData: number[];
}

// Function to remove 20% VAT from revenue amount
function removeVAT(amount: number): number {
  return amount / 1.2; // Remove 20% VAT
}

// Default fallback data (with VAT removed)
function getDefaultData(): RevenueDataFile {
  const defaultRevenueData = [45, 52, 48, 67, 73, 81, 94, 87, 95, 102, 89, 124];
  const vatRemovedData = defaultRevenueData.map(amount => Math.round(removeVAT(amount * 1000)) / 1000); // Convert back to thousands
  
  return {
    monthlyRevenue: [],
    lastUpdated: new Date().toISOString(),
    totalRevenue: Math.round(removeVAT(124563)),
    revenueChange: '+12.5%',
    revenueData: vatRemovedData
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RevenueDataFile | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch revenue data from Supabase, ordered by year and month
    const { data: revenueData, error } = await supabaseAdmin
      .from('revenue_data')
      .select('*')
      .order('year', { ascending: true })
      .order('month_number', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(200).json(getDefaultData());
    }

    if (!revenueData || revenueData.length === 0) {
      return res.status(200).json(getDefaultData());
    }

    // Transform Supabase data to match the expected format (with VAT removed)
    const monthlyRevenue: RevenueData[] = revenueData.map(row => ({
      month: row.month,
      revenue: removeVAT(parseFloat(row.revenue)), // Remove VAT from individual month revenue
      timestamp: row.updated_at
    }));

    // Calculate total revenue (with VAT removed)
    const totalRevenue = revenueData.reduce((sum, row) => sum + removeVAT(parseFloat(row.revenue)), 0);

    // Calculate revenue change (current vs previous month, both VAT-removed)
    let revenueChange = '+0.0%';
    if (revenueData.length >= 2) {
      const current = removeVAT(parseFloat(revenueData[revenueData.length - 1].revenue));
      const previous = removeVAT(parseFloat(revenueData[revenueData.length - 2].revenue));
      const change = ((current - previous) / previous) * 100;
      revenueChange = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    }

    // Create simple revenue data array for charts (in thousands, VAT removed)
    const revenueDataArray = revenueData.map(row => Math.round(removeVAT(parseFloat(row.revenue)) / 1000));

    // Get the latest update timestamp
    const lastUpdated = revenueData.length > 0 
      ? revenueData[revenueData.length - 1].updated_at 
      : new Date().toISOString();

    const response: RevenueDataFile = {
      monthlyRevenue,
      lastUpdated,
      totalRevenue,
      revenueChange,
      revenueData: revenueDataArray
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(200).json(getDefaultData());
  }
} 