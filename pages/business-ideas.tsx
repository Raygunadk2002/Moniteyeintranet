import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import BusinessIdeaForm from '../components/BusinessIdeaForm';
import BusinessIdeaList from '../components/BusinessIdeaList';
import RevenueModelingEngine from '../components/RevenueModelingEngine';

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
  createdAt: string;
  updatedAt: string;
}

export default function BusinessIdeas() {
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdea | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'modeling'>('list');
  const [editingIdea, setEditingIdea] = useState<BusinessIdea | null>(null);

  // Load ideas from localStorage on component mount
  useEffect(() => {
    const savedIdeas = localStorage.getItem('businessIdeas');
    if (savedIdeas) {
      try {
        setIdeas(JSON.parse(savedIdeas));
      } catch (error) {
        console.error('Error loading business ideas:', error);
      }
    }
  }, []);

  // Save ideas to localStorage whenever ideas change
  useEffect(() => {
    localStorage.setItem('businessIdeas', JSON.stringify(ideas));
  }, [ideas]);

  const handleSaveIdea = (ideaData: Omit<BusinessIdea, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    
    if (editingIdea) {
      // Update existing idea
      const updatedIdea: BusinessIdea = {
        ...editingIdea,
        ...ideaData,
        updatedAt: now
      };
      setIdeas(prev => prev.map(idea => idea.id === editingIdea.id ? updatedIdea : idea));
      setEditingIdea(null);
    } else {
      // Create new idea
      const newIdea: BusinessIdea = {
        ...ideaData,
        id: `idea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };
      setIdeas(prev => [...prev, newIdea]);
    }
    
    setActiveTab('list');
  };

  const handleEditIdea = (idea: BusinessIdea) => {
    setEditingIdea(idea);
    setActiveTab('form');
  };

  const handleDeleteIdea = (ideaId: string) => {
    if (confirm('Are you sure you want to delete this business idea?')) {
      setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
      if (selectedIdea?.id === ideaId) {
        setSelectedIdea(null);
      }
    }
  };

  const handleModelRevenue = (idea: BusinessIdea) => {
    setSelectedIdea(idea);
    setActiveTab('modeling');
  };

  const handleUpdateRevenueModel = (ideaId: string, revenueModel: any) => {
    setIdeas(prev => prev.map(idea => 
      idea.id === ideaId 
        ? { ...idea, revenueModel, updatedAt: new Date().toISOString() }
        : idea
    ));
  };

  return (
    <Layout>
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6">
          <div className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Business Idea Manager</h1>
            <p className="text-gray-600 mt-1">Capture, evaluate, and model revenue for your business ideas</p>
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
                <button
                  onClick={() => setActiveTab('modeling')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'modeling'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📊 Revenue Model: {selectedIdea.name}
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="max-w-7xl mx-auto">
            {activeTab === 'list' && (
              <BusinessIdeaList
                ideas={ideas}
                onEdit={handleEditIdea}
                onDelete={handleDeleteIdea}
                onModelRevenue={handleModelRevenue}
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
          </div>
        </div>
      </div>
    </Layout>
  );
} 