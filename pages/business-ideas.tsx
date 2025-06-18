import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import RoleBasedAccessControl from '../components/RoleBasedAccessControl';
import BusinessIdeaForm from '../components/BusinessIdeaForm';
import BusinessIdeaList from '../components/BusinessIdeaList';
import RevenueModelingEngine from '../components/RevenueModelingEngine';
import AdvancedBusinessModelingEngine from '../components/AdvancedBusinessModelingEngine';
import { supabase } from '../lib/supabase';

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

  // Get current user and load ideas from Supabase
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          await loadBusinessIdeas(user.id);
        } else {
          // Fallback to localStorage for non-authenticated users
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
          id: `idea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    if (!userId) {
      // Fallback to localStorage for non-authenticated users
      setIdeas(prev => prev.map(idea => 
        idea.id === ideaId 
          ? { ...idea, advancedModel, updatedAt: new Date().toISOString() }
          : idea
      ));
      return;
    }

    try {
      const response = await fetch(`/api/business-ideas/${ideaId}/advanced-model?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(advancedModel),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIdeas(prev => prev.map(idea => 
            idea.id === ideaId 
              ? { ...idea, advancedModel, updatedAt: new Date().toISOString() }
              : idea
          ));
        }
      }
    } catch (error) {
      console.error('Error saving advanced model:', error);
      alert('Failed to save advanced model. Please try again.');
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