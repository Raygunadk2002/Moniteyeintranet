import React, { useState } from 'react';
import { BusinessIdea } from '../pages/business-ideas';

interface BusinessIdeaListProps {
  ideas: BusinessIdea[];
  onEdit: (idea: BusinessIdea) => void;
  onDelete: (ideaId: string) => void;
  onModelRevenue: (idea: BusinessIdea) => void;
}

export default function BusinessIdeaList({ ideas, onEdit, onDelete, onModelRevenue }: BusinessIdeaListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByModel, setFilterByModel] = useState('');
  const [filterByIndustry, setFilterByIndustry] = useState('');

  // Filter ideas based on search and filters
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         idea.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesModel = !filterByModel || idea.businessModel === filterByModel;
    const matchesIndustry = !filterByIndustry || idea.industry === filterByIndustry;
    
    return matchesSearch && matchesModel && matchesIndustry;
  });

  // Get unique values for filters
  const uniqueModels = Array.from(new Set(ideas.map(idea => idea.businessModel)));
  const uniqueIndustries = Array.from(new Set(ideas.map(idea => idea.industry)));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getBusinessModelColor = (model: string) => {
    const colors = {
      'SAAS': 'bg-blue-100 text-blue-800',
      'Hardware + SAAS': 'bg-purple-100 text-purple-800',
      'Straight Sales': 'bg-green-100 text-green-800',
      'Subscription Product': 'bg-yellow-100 text-yellow-800',
      'Marketplace': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[model as keyof typeof colors] || colors['Other'];
  };

  if (ideas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💡</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No business ideas yet</h3>
        <p className="text-gray-600 mb-6">
          Start by creating your first business idea to begin modeling potential revenue streams.
        </p>
        <div className="text-sm text-gray-500">
          Click the "New Idea" tab above to get started!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Ideas
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by name, description, or tags..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Business Model
            </label>
            <select
              value={filterByModel}
              onChange={(e) => setFilterByModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Models</option>
              {uniqueModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Industry
            </label>
            <select
              value={filterByIndustry}
              onChange={(e) => setFilterByIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Industries</option>
              {uniqueIndustries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
        </div>
        
        {(searchTerm || filterByModel || filterByIndustry) && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredIdeas.length} of {ideas.length} ideas
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterByModel('');
                setFilterByIndustry('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIdeas.map(idea => (
          <div key={idea.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                    {idea.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBusinessModelColor(idea.businessModel)}`}>
                    {idea.businessModel}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {idea.description}
              </p>

              {/* Key Info */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Industry:</span>
                  <span className="font-medium">{idea.industry}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Target:</span>
                  <span className="font-medium">{idea.targetMarket}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Startup Cost:</span>
                  <span className="font-medium">{formatCurrency(idea.initialStartupCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly Cost:</span>
                  <span className="font-medium">{formatCurrency(idea.ongoingMonthlyCost)}</span>
                </div>
              </div>

              {/* Tags */}
              {idea.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {idea.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {idea.tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{idea.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Revenue Model Status */}
              <div className="mb-4">
                {idea.revenueModel ? (
                  <div className="flex items-center text-sm text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Revenue model created
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                    No revenue model yet
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => onModelRevenue(idea)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  📊 Model
                </button>
                <button
                  onClick={() => onEdit(idea)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(idea.id)}
                  className="px-3 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50"
                >
                  🗑️
                </button>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created: {formatDate(idea.createdAt)}</span>
                  {idea.updatedAt !== idea.createdAt && (
                    <span>Updated: {formatDate(idea.updatedAt)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredIdeas.length === 0 && (searchTerm || filterByModel || filterByIndustry) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas match your filters</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterByModel('');
              setFilterByIndustry('');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
} 