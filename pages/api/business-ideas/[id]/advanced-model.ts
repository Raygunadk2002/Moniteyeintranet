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
    console.log('🔍 Fetching advanced model for business idea:', businessIdeaId);
    console.log('🔍 Business idea ID type:', typeof businessIdeaId, 'length:', businessIdeaId.length);
    
    const supabaseAdmin = getSupabaseAdmin();
    
    // Try to fetch the advanced model - handle both UUID and custom ID formats
    let data, error;
    
    try {
      const result = await supabaseAdmin
        .from('advanced_business_models')
        .select('*')
        .eq('business_idea_id', businessIdeaId)
        .single();
      
      data = result.data;
      error = result.error;
    } catch (fetchError) {
      console.log('⚠️ Direct fetch failed, trying alternative approach:', fetchError);
      error = fetchError;
    }

    if (error) {
      console.error('Error fetching advanced model:', error);
      if ((error as any).code === 'PGRST116') { // Not found
        console.log('📝 No advanced model found for business idea:', businessIdeaId);
        return res.status(404).json({ 
          error: 'Advanced model not found',
          businessIdeaId: businessIdeaId,
          message: 'This is normal for new business ideas - will create default model'
        });
      }
      if ((error as any).code === '22P02') { // Invalid UUID format
        console.log('⚠️ Non-UUID business idea ID detected:', businessIdeaId, '- this is expected for custom IDs');
        return res.status(404).json({ 
          error: 'Advanced model not found',
          businessIdeaId: businessIdeaId,
          message: 'Custom ID format detected - will create model with your actual data'
        });
      }
      return res.status(500).json({ error: 'Failed to fetch advanced model', details: (error as any).message });
    }

    if (!data) {
      console.log('📝 No data returned for business idea:', businessIdeaId);
      return res.status(404).json({ 
        error: 'Advanced model not found',
        businessIdeaId: businessIdeaId,
        message: 'No model data found - will initialize with your business model'
      });
    }

    console.log('✅ Advanced model found:', data.id, 'for business idea:', businessIdeaId);
    console.log('📊 Model data summary:', {
      hasModelInputs: !!data.model_inputs,
      hasGlobalCosts: !!data.global_costs,
      modelActivationsCount: data.model_activations?.length || 0,
      forecastResultsCount: data.forecast_results?.length || 0,
      modelInputsKeys: data.model_inputs ? Object.keys(data.model_inputs) : []
    });
    
    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error in GET handler:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch advanced model',
      businessIdeaId: businessIdeaId,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, businessIdeaId: string) {
  const { userId } = req.query;
  const modelData = req.body;

  console.log('💾 Saving advanced model for business idea:', businessIdeaId, 'user:', userId);

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Check if business idea exists in database
    const { data: businessIdea, error: ideaError } = await supabaseAdmin
      .from('business_ideas')
      .select('id, created_by')
      .eq('id', businessIdeaId)
      .single();

    let actualBusinessIdeaId = businessIdeaId;

    if (ideaError) {
      console.log('⚠️ Business idea not found in database:', ideaError);
      
      if (ideaError.code === '22P02' || ideaError.code === 'PGRST116') {
        // Invalid UUID format or not found - this is likely an offline-created business idea
        console.log('🔄 This appears to be an offline business idea, need to create it in database first');
        
        // Check if we have business idea data in the request
        if (modelData.businessIdeaData) {
          console.log('📝 Creating business idea in database with provided data');
          
          // Check if userId is a valid UUID, if not, try to find a real user or set to null
          let createdBy: string | null = Array.isArray(userId) ? userId[0] : userId;
          
          // Validate if userId is a proper UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(createdBy)) {
            console.log('⚠️ User ID is not a valid UUID, setting created_by to null for offline user');
            createdBy = null;
          }

          const { data: newBusinessIdea, error: createError } = await supabaseAdmin
            .from('business_ideas')
            .insert({
              name: modelData.businessIdeaData.name || 'Advanced Business Model',
              description: modelData.businessIdeaData.description || 'Created from advanced modeling',
              industry: modelData.businessIdeaData.industry || 'Technology',
              business_model: modelData.businessIdeaData.businessModel || 'Other',
              target_market: modelData.businessIdeaData.targetMarket || 'B2B',
              initial_startup_cost: modelData.businessIdeaData.initialStartupCost || 0,
              ongoing_monthly_cost: modelData.businessIdeaData.ongoingMonthlyCost || 0,
              ongoing_annual_cost: modelData.businessIdeaData.ongoingAnnualCost || 0,
              tags: modelData.businessIdeaData.tags || [],
              created_by: createdBy
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Failed to create business idea:', createError);
            return res.status(500).json({ 
              error: 'Failed to create business idea in database',
              details: createError.message
            });
          }

          actualBusinessIdeaId = newBusinessIdea.id;
          console.log('✅ Created business idea in database with ID:', actualBusinessIdeaId);
        } else {
          return res.status(400).json({ 
            error: 'Business idea not found in database and no business idea data provided',
            message: 'Please provide businessIdeaData in the request to create the business idea first'
          });
        }
      } else {
        return res.status(403).json({ error: 'Business idea not found or access denied' });
      }
    } else if (businessIdea && businessIdea.created_by !== userId) {
      return res.status(403).json({ error: 'Access denied to this business idea' });
    }

    // Check if advanced model already exists (use the actual business idea ID)
    const { data: existingModel, error: checkError } = await supabaseAdmin
      .from('advanced_business_models')
      .select('id')
      .eq('business_idea_id', actualBusinessIdeaId)
      .maybeSingle();

    if (checkError && checkError.code !== '22P02') {
      console.error('Error checking existing model:', checkError);
      return res.status(500).json({ error: 'Failed to check existing model' });
    }

    let data, error;

    const modelPayload = {
      name: modelData.name || 'Advanced Business Model',
      description: modelData.description || '',
      sector: modelData.sector || 'General',
      launch_year: modelData.launchYear || new Date().getFullYear(),
      model_activations: modelData.modelActivations || [],
      model_inputs: modelData.modelInputs || {},
      global_costs: modelData.globalCosts || modelData.costStructures || {},
      assumptions: modelData.assumptions || {},
      forecast_results: modelData.forecastResults || []
    };

    console.log('📊 Model payload prepared:', {
      name: modelPayload.name,
      hasModelInputs: !!modelPayload.model_inputs,
      hasGlobalCosts: !!modelPayload.global_costs,
      forecastResultsLength: modelPayload.forecast_results.length,
      modelActivationsLength: modelPayload.model_activations.length,
      businessIdeaId: actualBusinessIdeaId
    });

    if (existingModel) {
      // Update existing model
      console.log('🔄 Updating existing advanced model:', existingModel.id);
      const result = await supabaseAdmin
        .from('advanced_business_models')
        .update(modelPayload)
        .eq('business_idea_id', actualBusinessIdeaId)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Create new model
      console.log('✨ Creating new advanced model for business idea:', actualBusinessIdeaId);
      const result = await supabaseAdmin
        .from('advanced_business_models')
        .insert({
          business_idea_id: actualBusinessIdeaId,
          ...modelPayload
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error creating/updating advanced model:', error);
      return res.status(500).json({ 
        error: 'Failed to save advanced model',
        details: error.message 
      });
    }

    console.log('✅ Advanced model saved successfully:', data.id);
    return res.status(200).json({
      success: true,
      data: data,
      message: 'Advanced model saved successfully',
      // Include the new business idea ID if one was created
      ...(actualBusinessIdeaId !== businessIdeaId ? { newBusinessIdeaId: actualBusinessIdeaId } : {})
    });

  } catch (error) {
    console.error('Error in POST handler:', error);
    return res.status(500).json({ 
      error: 'Failed to save advanced model',
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