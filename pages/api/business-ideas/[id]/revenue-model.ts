import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; // business idea id

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, id as string);
      case 'POST':
        return await handlePost(req, res, id as string);
      case 'PUT':
        return await handlePut(req, res, id as string);
      case 'DELETE':
        return await handleDelete(req, res, id as string);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Revenue Model API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, businessIdeaId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('revenue_models')
      .select('*')
      .eq('business_idea_id', businessIdeaId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching revenue model:', error);
      return res.status(500).json({ error: 'Failed to fetch revenue model' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Revenue model not found' });
    }

    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error in GET handler:', error);
    return res.status(500).json({ error: 'Failed to fetch revenue model' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, businessIdeaId: string) {
  const { userId } = req.query;
  const modelData = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Verify the business idea belongs to the user
    const { data: businessIdea, error: ideaError } = await supabaseAdmin
      .from('business_ideas')
      .select('id')
      .eq('id', businessIdeaId)
      .eq('created_by', userId)
      .single();

    if (ideaError || !businessIdea) {
      return res.status(403).json({ error: 'Business idea not found or access denied' });
    }

    // Use upsert to handle both create and update
    const { data, error } = await supabaseAdmin
      .from('revenue_models')
      .upsert({
        business_idea_id: businessIdeaId,
        business_model: modelData.businessModel,
        parameters: modelData.parameters || {},
        growth_assumptions: modelData.growthAssumptions || {},
        forecast: modelData.forecast || {}
      }, {
        onConflict: 'business_idea_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving revenue model:', error);
      return res.status(500).json({ 
        error: 'Failed to save revenue model',
        details: error.message 
      });
    }

    return res.status(200).json({
      success: true,
      data: data,
      message: 'Revenue model saved successfully'
    });

  } catch (error) {
    console.error('Error in POST handler:', error);
    return res.status(500).json({ 
      error: 'Failed to save revenue model',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, businessIdeaId: string) {
  const { userId } = req.query;
  const modelData = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Verify the business idea belongs to the user
    const { data: businessIdea, error: ideaError } = await supabaseAdmin
      .from('business_ideas')
      .select('id')
      .eq('id', businessIdeaId)
      .eq('created_by', userId)
      .single();

    if (ideaError || !businessIdea) {
      return res.status(403).json({ error: 'Business idea not found or access denied' });
    }

    const { data, error } = await supabaseAdmin
      .from('revenue_models')
      .update({
        business_model: modelData.businessModel,
        parameters: modelData.parameters,
        growth_assumptions: modelData.growthAssumptions,
        forecast: modelData.forecast
      })
      .eq('business_idea_id', businessIdeaId)
      .select()
      .single();

    if (error) {
      console.error('Error updating revenue model:', error);
      return res.status(500).json({ error: 'Failed to update revenue model' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Revenue model not found' });
    }

    return res.status(200).json({
      success: true,
      data: data,
      message: 'Revenue model updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT handler:', error);
    return res.status(500).json({ error: 'Failed to update revenue model' });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, businessIdeaId: string) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Verify the business idea belongs to the user
    const { data: businessIdea, error: ideaError } = await supabaseAdmin
      .from('business_ideas')
      .select('id')
      .eq('id', businessIdeaId)
      .eq('created_by', userId)
      .single();

    if (ideaError || !businessIdea) {
      return res.status(403).json({ error: 'Business idea not found or access denied' });
    }

    const { error } = await supabaseAdmin
      .from('revenue_models')
      .delete()
      .eq('business_idea_id', businessIdeaId);

    if (error) {
      console.error('Error deleting revenue model:', error);
      return res.status(500).json({ error: 'Failed to delete revenue model' });
    }

    return res.status(200).json({
      success: true,
      message: 'Revenue model deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return res.status(500).json({ error: 'Failed to delete revenue model' });
  }
} 