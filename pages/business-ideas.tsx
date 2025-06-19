import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import RoleBasedAccessControl from '../components/RoleBasedAccessControl';
import BusinessIdeaForm from '../components/BusinessIdeaForm';
import BusinessIdeaList from '../components/BusinessIdeaList';
import RevenueModelingEngine from '../components/RevenueModelingEngine';
import AdvancedBusinessModelingEngine from '../components/AdvancedBusinessModelingEngine';

export interface BusinessIdea {
  id: string;
  name: string;
  description: string;
  industry: string;
  businessModel: 'SAAS' | 'Hardware + SAAS' | 'Straight Sales' | 'Subscription Product' | 'Marketplace' | 'Other';
  targetMarket: string;
  initialStartupCost: number;
  ongoingMonthlyCost: number;
  ongoingAnnualCost: number;
  tags: string[];
  revenueModel?: any;
  advancedModel?: any;
  createdAt: string;
  updatedAt: string;
}

export default function BusinessIdeas() {
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdea | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'modeling' | 'advanced'>('list');
  const [editingIdea, setEditingIdea] = useState<BusinessIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user from localStorage (custom auth system)
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        console.log('🔍 Getting current user from localStorage...');
        const userData = localStorage.getItem('moniteye-user');
        
        if (userData) {
          const user = JSON.parse(userData);
          console.log('👤 Current user from localStorage:', { 
            hasUser: !!user, 
            userId: user?.id,
            userEmail: user?.email 
          });
          
          if (user && user.id) {
            console.log('✅ Setting userId to:', user.id);
            setUserId(user.id);
            await loadBusinessIdeas(user.id);
          } else {
            console.log('❌ Invalid user data in localStorage, using localStorage for ideas');
            loadFromLocalStorage();
          }
        } else {
          console.log('❌ No authenticated user found, using localStorage');
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  const loadBusinessIdeas = async (currentUserId: string) => {
    try {
      const response = await fetch(`/api/business-ideas?userId=${currentUserId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIdeas(result.data);
        }
      } else {
        console.error('Failed to load business ideas from API');
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading business ideas:', error);
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    const savedIdeas = localStorage.getItem('businessIdeas');
    if (savedIdeas) {
      try {
        setIdeas(JSON.parse(savedIdeas));
      } catch (error) {
        console.error('Error loading business ideas from localStorage:', error);
      }
    }
  };

  // Save to localStorage as backup (still useful for offline scenarios)
  useEffect(() => {
    if (ideas.length > 0) {
      localStorage.setItem('businessIdeas', JSON.stringify(ideas));
    }
  }, [ideas]);

  const handleSaveIdea = async (ideaData: Omit<BusinessIdea, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) {
      // Fallback to localStorage for non-authenticated users
      const now = new Date().toISOString();
      
      if (editingIdea) {
        const updatedIdea: BusinessIdea = {
          ...editingIdea,
          ...ideaData,
          updatedAt: now
        };
        setIdeas(prev => prev.map(idea => idea.id === editingIdea.id ? updatedIdea : idea));
        setEditingIdea(null);
      } else {
        const newIdea: BusinessIdea = {
          ...ideaData,
          id: `idea-${Date.now()}-${btoa(Date.now().toString()).substr(10, 9)}`,
          createdAt: now,
          updatedAt: now
        };
        setIdeas(prev => [...prev, newIdea]);
      }
      
      setActiveTab('list');
      return;
    }

    try {
      if (editingIdea) {
        // Update existing idea
        const response = await fetch(`/api/business-ideas?id=${editingIdea.id}&userId=${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ideaData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setIdeas(prev => prev.map(idea => 
              idea.id === editingIdea.id 
                ? { ...ideaData, id: editingIdea.id, createdAt: editingIdea.createdAt, updatedAt: result.data.updated_at }
                : idea
            ));
            setEditingIdea(null);
          }
        }
      } else {
        // Create new idea
        const response = await fetch(`/api/business-ideas?userId=${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ideaData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const newIdea: BusinessIdea = {
              ...ideaData,
              id: result.data.id,
              createdAt: result.data.created_at,
              updatedAt: result.data.updated_at
            };
            setIdeas(prev => [...prev, newIdea]);
          }
        }
      }
      
      setActiveTab('list');
    } catch (error) {
      console.error('Error saving business idea:', error);
      alert('Failed to save business idea. Please try again.');
    }
  };

  const handleEditIdea = (idea: BusinessIdea) => {
    setEditingIdea(idea);
    setActiveTab('form');
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!confirm('Are you sure you want to delete this business idea?')) {
      return;
    }

    if (!userId) {
      // Fallback to localStorage for non-authenticated users
      setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
      if (selectedIdea?.id === ideaId) {
        setSelectedIdea(null);
      }
      return;
    }

    try {
      const response = await fetch(`/api/business-ideas?id=${ideaId}&userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
          if (selectedIdea?.id === ideaId) {
            setSelectedIdea(null);
          }
        }
      } else {
        throw new Error('Failed to delete business idea');
      }
    } catch (error) {
      console.error('Error deleting business idea:', error);
      alert('Failed to delete business idea. Please try again.');
    }
  };

  const handleModelRevenue = (idea: BusinessIdea) => {
    setSelectedIdea(idea);
    setActiveTab('modeling');
  };

  const handleAdvancedModeling = (idea: BusinessIdea) => {
    setSelectedIdea(idea);
    setActiveTab('advanced');
  };

  const handleUpdateRevenueModel = async (ideaId: string, revenueModel: any) => {
    if (!userId) {
      // Fallback to localStorage for non-authenticated users
      setIdeas(prev => prev.map(idea => 
        idea.id === ideaId 
          ? { ...idea, revenueModel, updatedAt: new Date().toISOString() }
          : idea
      ));
      return;
    }

    try {
      const response = await fetch(`/api/business-ideas/${ideaId}/revenue-model?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(revenueModel),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIdeas(prev => prev.map(idea => 
            idea.id === ideaId 
              ? { ...idea, revenueModel, updatedAt: new Date().toISOString() }
              : idea
          ));
        }
      }
    } catch (error) {
      console.error('Error saving revenue model:', error);
      alert('Failed to save revenue model. Please try again.');
    }
  };

  const handleUpdateAdvancedModel = async (ideaId: string, advancedModel: any) => {
    console.log('🎯 PARENT: handleUpdateAdvancedModel called with:', {
      ideaId,
      userId,
      userIdType: typeof userId,
      userIdLength: userId?.length,
      hasAdvancedModel: !!advancedModel,
      advancedModelKeys: advancedModel ? Object.keys(advancedModel) : []
    });

    if (!userId) {
      console.log('⚠️ No userId found, saving to localStorage only');
      console.log('🔍 DEBUG: userId state details:', {
        userId,
        userIdType: typeof userId,
        userIdStringified: JSON.stringify(userId),
        loading
      });
      // Fallback to localStorage for non-authenticated users
      setIdeas(prev => prev.map(idea => 
        idea.id === ideaId 
          ? { ...idea, advancedModel, updatedAt: new Date().toISOString() }
          : idea
      ));
      return;
    }

    try {
      console.log('🚀 Saving advanced model for idea:', ideaId, 'with data:', {
        name: advancedModel.name,
        hasModelInputs: !!advancedModel.modelInputs,
        hasGlobalCosts: !!advancedModel.globalCosts,
        forecastResultsLength: advancedModel.forecastResults?.length || 0,
        userId: userId
      });

      // Find the business idea to include its data in case it needs to be created in the database
      const businessIdea = ideas.find(idea => idea.id === ideaId);
      const requestPayload = {
        ...advancedModel,
        // Include business idea data for offline ideas that need to be created in database
        businessIdeaData: businessIdea ? {
          name: businessIdea.name,
          description: businessIdea.description,
          industry: businessIdea.industry,
          businessModel: businessIdea.businessModel,
          targetMarket: businessIdea.targetMarket,
          initialStartupCost: businessIdea.initialStartupCost,
          ongoingMonthlyCost: businessIdea.ongoingMonthlyCost,
          ongoingAnnualCost: businessIdea.ongoingAnnualCost,
          tags: businessIdea.tags
        } : undefined
      };

      const response = await fetch(`/api/business-ideas/${ideaId}/advanced-model?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Save operation was not successful');
      }

      console.log('✅ Advanced model saved successfully:', result);
      
      // Update the business idea with the advanced model
      // If a new business idea was created in the database, we might need to update the ID
      setIdeas(prev => prev.map(idea => 
        idea.id === ideaId 
          ? { 
              ...idea, 
              advancedModel, 
              updatedAt: new Date().toISOString(),
              // If the API returned a new business idea ID, update it
              ...(result.newBusinessIdeaId ? { id: result.newBusinessIdeaId } : {})
            }
          : idea
      ));
    } catch (error) {
      console.error('Error saving advanced model:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to save advanced model: ${errorMessage}`);
      throw error; // Re-throw to allow the calling function to handle it
    }
  };

  return (
    <RoleBasedAccessControl moduleName="Business Ideas" requiredRole="manager">
      <Layout>
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6">
          <div className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Business Idea Manager</h1>
            <p className="text-gray-600 mt-1">Capture, evaluate, and model revenue for your business ideas with advanced multi-model forecasting</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('list')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💡 Ideas ({ideas.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('form');
                  setEditingIdea(null);
                }}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'form'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ➕ {editingIdea ? 'Edit Idea' : 'New Idea'}
              </button>
              {selectedIdea && (
                <>
                  <button
                    onClick={() => setActiveTab('modeling')}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'modeling'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📊 Simple Model: {selectedIdea.name}
                  </button>
                  <button
                    onClick={() => setActiveTab('advanced')}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'advanced'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🚀 Advanced Model: {selectedIdea.name}
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading business ideas...</span>
              </div>
            ) : activeTab === 'list' && (
              <BusinessIdeaList
                ideas={ideas}
                onEdit={handleEditIdea}
                onDelete={handleDeleteIdea}
                onModelRevenue={handleModelRevenue}
                onAdvancedModeling={handleAdvancedModeling}
              />
            )}

            {activeTab === 'form' && (
              <BusinessIdeaForm
                idea={editingIdea}
                onSave={handleSaveIdea}
                onCancel={() => {
                  setActiveTab('list');
                  setEditingIdea(null);
                }}
              />
            )}

            {activeTab === 'modeling' && selectedIdea && (
              <RevenueModelingEngine
                idea={selectedIdea}
                onUpdateModel={(revenueModel) => handleUpdateRevenueModel(selectedIdea.id, revenueModel)}
                onBack={() => setActiveTab('list')}
              />
            )}

            {activeTab === 'advanced' && selectedIdea && (
              <AdvancedBusinessModelingEngine
                idea={selectedIdea}
                userId={userId}
                onUpdateModel={(advancedModel) => handleUpdateAdvancedModel(selectedIdea.id, advancedModel)}
                onBack={() => setActiveTab('list')}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
    </RoleBasedAccessControl>
  );
} 