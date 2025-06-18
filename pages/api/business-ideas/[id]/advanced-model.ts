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
    console.error('Advanced Model API Error:', error);
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
      .from('advanced_business_models')
      .select('*')
      .eq('business_idea_id', businessIdeaId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching advanced model:', error);
      return res.status(500).json({ error: 'Failed to fetch advanced model' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Advanced model not found' });
    }

    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error in GET handler:', error);
    return res.status(500).json({ error: 'Failed to fetch advanced model' });
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

    // Check if an advanced model already exists for this business idea
    const { data: existingModel } = await supabaseAdmin
      .from('advanced_business_models')
      .select('id')
      .eq('business_idea_id', businessIdeaId)
      .single();

    let data, error;

    if (existingModel) {
      // Update existing model
      const result = await supabaseAdmin
        .from('advanced_business_models')
        .update({
          name: modelData.name || 'Advanced Business Model',
          description: modelData.description || '',
          sector: modelData.sector || 'General',
          launch_year: modelData.launchYear || new Date().getFullYear(),
          model_activations: modelData.modelActivations || [],
          model_inputs: modelData.modelInputs || {},
          global_costs: modelData.costStructures || {},
          assumptions: modelData.assumptions || {},
          forecast_results: modelData.forecastResults || []
        })
        .eq('business_idea_id', businessIdeaId)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Create new model
      const result = await supabaseAdmin
        .from('advanced_business_models')
        .insert({
          business_idea_id: businessIdeaId,
          name: modelData.name || 'Advanced Business Model',
          description: modelData.description || '',
          sector: modelData.sector || 'General',
          launch_year: modelData.launchYear || new Date().getFullYear(),
          model_activations: modelData.modelActivations || [],
          model_inputs: modelData.modelInputs || {},
          global_costs: modelData.costStructures || {},
          assumptions: modelData.assumptions || {},
          forecast_results: modelData.forecastResults || []
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error creating advanced model:', error);
      return res.status(500).json({ error: 'Failed to create advanced model' });
    }

    return res.status(200).json({
      success: true,
      data: data,
      message: 'Advanced model saved successfully'
    });

  } catch (error) {
    console.error('Error in POST handler:', error);
    return res.status(500).json({ error: 'Failed to create advanced model' });
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
      .from('advanced_business_models')
      .update({
        name: modelData.name || 'Advanced Business Model',
        description: modelData.description || '',
        sector: modelData.sector || 'General',
        launch_year: modelData.launchYear || new Date().getFullYear(),
        model_activations: modelData.modelActivations,
        model_inputs: modelData.modelInputs,
        global_costs: modelData.costStructures,
        assumptions: modelData.assumptions,
        forecast_results: modelData.forecastResults
      })
      .eq('business_idea_id', businessIdeaId)
      .select()
      .single();

    if (error) {
      console.error('Error updating advanced model:', error);
      return res.status(500).json({ error: 'Failed to update advanced model' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Advanced model not found' });
    }

    return res.status(200).json({
      success: true,
      data: data,
      message: 'Advanced model updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT handler:', error);
    return res.status(500).json({ error: 'Failed to update advanced model' });
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
      .from('advanced_business_models')
      .delete()
      .eq('business_idea_id', businessIdeaId);

    if (error) {
      console.error('Error deleting advanced model:', error);
      return res.status(500).json({ error: 'Failed to delete advanced model' });
    }

    return res.status(200).json({
      success: true,
      message: 'Advanced model deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return res.status(500).json({ error: 'Failed to delete advanced model' });
  }
} 