import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Business Ideas API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { search, industry, businessModel, userId } = req.query;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from('business_ideas_with_models')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (industry && industry !== 'all') {
      query = query.eq('industry', industry);
    }
    if (businessModel && businessModel !== 'all') {
      query = query.eq('business_model', businessModel);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching business ideas:', error);
      return res.status(500).json({ error: 'Failed to fetch business ideas' });
    }

    // Transform the data to match the frontend interface
    const transformedData = data?.map(idea => ({
      id: idea.id,
      name: idea.name,
      description: idea.description,
      industry: idea.industry,
      businessModel: idea.business_model,
      targetMarket: idea.target_market,
      initialStartupCost: parseFloat(idea.initial_startup_cost || 0),
      ongoingMonthlyCost: parseFloat(idea.ongoing_monthly_cost || 0),
      ongoingAnnualCost: parseFloat(idea.ongoing_annual_cost || 0),
      tags: idea.tags || [],
      
      // Enhanced fields
      marketSize: idea.market_size,
      competitiveLandscape: idea.competitive_landscape,
      uniqueValueProposition: idea.unique_value_proposition,
      expectedMonthlyRevenue: parseFloat(idea.expected_monthly_revenue || 0),
      expectedAnnualRevenue: parseFloat(idea.expected_annual_revenue || 0),
      pricingStrategy: idea.pricing_strategy,
      customerAcquisitionCost: parseFloat(idea.customer_acquisition_cost || 0),
      customerLifetimeValue: parseFloat(idea.customer_lifetime_value || 0),
      timeToMarket: idea.time_to_market || 0,
      teamSize: idea.team_size || 0,
      keyRisks: idea.key_risks,
      successMetrics: idea.success_metrics,
      fundingRequired: parseFloat(idea.funding_required || 0),
      
      createdAt: idea.created_at,
      updatedAt: idea.updated_at,
      createdBy: idea.created_by,
      
      // Model status
      hasRevenueModel: idea.has_revenue_model,
      hasAdvancedModel: idea.has_advanced_model,
      revenueModelCreatedAt: idea.revenue_model_created_at,
      advancedModelCreatedAt: idea.advanced_model_created_at
    })) || [];

    return res.status(200).json({
      success: true,
      data: transformedData,
      count: transformedData.length
    });

  } catch (error) {
    console.error('Error in GET handler:', error);
    return res.status(500).json({ error: 'Failed to fetch business ideas' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  const ideaData = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (!ideaData.name || !ideaData.description || !ideaData.industry) {
    return res.status(400).json({ error: 'Name, description, and industry are required' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('business_ideas')
      .insert({
        name: ideaData.name,
        description: ideaData.description,
        industry: ideaData.industry,
        business_model: ideaData.businessModel || 'Other',
        target_market: ideaData.targetMarket || '',
        initial_startup_cost: ideaData.initialStartupCost || 0,
        ongoing_monthly_cost: ideaData.ongoingMonthlyCost || 0,
        ongoing_annual_cost: ideaData.ongoingAnnualCost || 0,
        tags: ideaData.tags || [],
        
        // Enhanced fields
        market_size: ideaData.marketSize,
        competitive_landscape: ideaData.competitiveLandscape,
        unique_value_proposition: ideaData.uniqueValueProposition,
        expected_monthly_revenue: ideaData.expectedMonthlyRevenue || 0,
        expected_annual_revenue: ideaData.expectedAnnualRevenue || 0,
        pricing_strategy: ideaData.pricingStrategy,
        customer_acquisition_cost: ideaData.customerAcquisitionCost || 0,
        customer_lifetime_value: ideaData.customerLifetimeValue || 0,
        time_to_market: ideaData.timeToMarket || 0,
        team_size: ideaData.teamSize || 0,
        key_risks: ideaData.keyRisks,
        success_metrics: ideaData.successMetrics,
        funding_required: ideaData.fundingRequired || 0,
        
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating business idea:', error);
      return res.status(500).json({ error: 'Failed to create business idea' });
    }

    return res.status(201).json({
      success: true,
      data: data,
      message: 'Business idea created successfully'
    });

  } catch (error) {
    console.error('Error in POST handler:', error);
    return res.status(500).json({ error: 'Failed to create business idea' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id, userId } = req.query;
  const ideaData = req.body;

  if (!id || !userId) {
    return res.status(400).json({ error: 'ID and User ID are required' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('business_ideas')
      .update({
        name: ideaData.name,
        description: ideaData.description,
        industry: ideaData.industry,
        business_model: ideaData.businessModel,
        target_market: ideaData.targetMarket,
        initial_startup_cost: ideaData.initialStartupCost,
        ongoing_monthly_cost: ideaData.ongoingMonthlyCost,
        ongoing_annual_cost: ideaData.ongoingAnnualCost,
        tags: ideaData.tags,
        
        // Enhanced fields
        market_size: ideaData.marketSize,
        competitive_landscape: ideaData.competitiveLandscape,
        unique_value_proposition: ideaData.uniqueValueProposition,
        expected_monthly_revenue: ideaData.expectedMonthlyRevenue,
        expected_annual_revenue: ideaData.expectedAnnualRevenue,
        pricing_strategy: ideaData.pricingStrategy,
        customer_acquisition_cost: ideaData.customerAcquisitionCost,
        customer_lifetime_value: ideaData.customerLifetimeValue,
        time_to_market: ideaData.timeToMarket,
        team_size: ideaData.teamSize,
        key_risks: ideaData.keyRisks,
        success_metrics: ideaData.successMetrics,
        funding_required: ideaData.fundingRequired
      })
      .eq('id', id)
      .eq('created_by', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating business idea:', error);
      return res.status(500).json({ error: 'Failed to update business idea' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Business idea not found or access denied' });
    }

    return res.status(200).json({
      success: true,
      data: data,
      message: 'Business idea updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT handler:', error);
    return res.status(500).json({ error: 'Failed to update business idea' });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id, userId } = req.query;

  if (!id || !userId) {
    return res.status(400).json({ error: 'ID and User ID are required' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('business_ideas')
      .delete()
      .eq('id', id)
      .eq('created_by', userId);

    if (error) {
      console.error('Error deleting business idea:', error);
      return res.status(500).json({ error: 'Failed to delete business idea' });
    }

    return res.status(200).json({
      success: true,
      message: 'Business idea deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return res.status(500).json({ error: 'Failed to delete business idea' });
  }
} 