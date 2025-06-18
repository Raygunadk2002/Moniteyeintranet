import React, { useState, useEffect } from 'react';
import { BusinessIdea } from '../pages/business-ideas';

interface BusinessIdeaFormProps {
  idea?: BusinessIdea | null;
  onSave: (idea: Omit<BusinessIdea, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const BUSINESS_MODELS = [
  'SAAS',
  'Hardware + SAAS',
  'Straight Sales',
  'Subscription Product',
  'Marketplace',
  'Services/Consulting',
  'Ad-Supported',
  'Licensing/IP',
  'Freemium',
  'Other'
] as const;

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-commerce',
  'Manufacturing',
  'Real Estate',
  'Food & Beverage',
  'Transportation',
  'Entertainment',
  'Consulting',
  'Construction',
  'Energy',
  'Agriculture',
  'Other'
];

const TARGET_MARKETS = [
  'B2B',
  'B2C',
  'Enterprise',
  'SME',
  'Government',
  'Non-profit',
  'Mixed'
];

const MARKET_SIZES = [
  'Local (<$1M)',
  'Regional ($1M-$10M)',
  'National ($10M-$100M)',
  'Global ($100M+)',
  'Unknown'
];

const COMPETITIVE_LANDSCAPES = [
  'No direct competitors',
  'Few competitors',
  'Moderate competition',
  'Highly competitive',
  'Saturated market'
];

export default function BusinessIdeaForm({ idea, onSave, onCancel }: BusinessIdeaFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    businessModel: 'SAAS' as BusinessIdea['businessModel'],
    targetMarket: '',
    initialStartupCost: 0,
    ongoingMonthlyCost: 0,
    ongoingAnnualCost: 0,
    tags: [] as string[],
    // Enhanced fields for advanced modeling
    marketSize: '',
    competitiveLandscape: '',
    uniqueValueProposition: '',
    expectedMonthlyRevenue: 0,
    expectedAnnualRevenue: 0,
    pricingStrategy: '',
    customerAcquisitionCost: 0,
    customerLifetimeValue: 0,
    timeToMarket: 0, // months
    teamSize: 0,
    keyRisks: '',
    successMetrics: '',
    fundingRequired: 0
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  // Populate form when editing an existing idea
  useEffect(() => {
    if (idea) {
      setFormData({
        name: idea.name,
        description: idea.description,
        industry: idea.industry,
        businessModel: idea.businessModel,
        targetMarket: idea.targetMarket,
        initialStartupCost: idea.initialStartupCost,
        ongoingMonthlyCost: idea.ongoingMonthlyCost,
        ongoingAnnualCost: idea.ongoingAnnualCost,
        tags: idea.tags,
        // Enhanced fields
        marketSize: (idea as any).marketSize || '',
        competitiveLandscape: (idea as any).competitiveLandscape || '',
        uniqueValueProposition: (idea as any).uniqueValueProposition || '',
        expectedMonthlyRevenue: (idea as any).expectedMonthlyRevenue || 0,
        expectedAnnualRevenue: (idea as any).expectedAnnualRevenue || 0,
        pricingStrategy: (idea as any).pricingStrategy || '',
        customerAcquisitionCost: (idea as any).customerAcquisitionCost || 0,
        customerLifetimeValue: (idea as any).customerLifetimeValue || 0,
        timeToMarket: (idea as any).timeToMarket || 0,
        teamSize: (idea as any).teamSize || 0,
        keyRisks: (idea as any).keyRisks || '',
        successMetrics: (idea as any).successMetrics || '',
        fundingRequired: (idea as any).fundingRequired || 0
      });
      
      // Show advanced fields if any advanced data exists
      const hasAdvancedData = (idea as any).marketSize || (idea as any).uniqueValueProposition || 
                             (idea as any).expectedMonthlyRevenue || (idea as any).pricingStrategy;
      setShowAdvancedFields(hasAdvancedData);
    }
  }, [idea]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.industry.trim()) {
      newErrors.industry = 'Industry is required';
    }

    if (!formData.targetMarket.trim()) {
      newErrors.targetMarket = 'Target market is required';
    }

    if (formData.initialStartupCost < 0) {
      newErrors.initialStartupCost = 'Initial startup cost cannot be negative';
    }

    if (formData.ongoingMonthlyCost < 0) {
      newErrors.ongoingMonthlyCost = 'Monthly cost cannot be negative';
    }

    if (formData.ongoingAnnualCost < 0) {
      newErrors.ongoingAnnualCost = 'Annual cost cannot be negative';
    }

    // Advanced field validations
    if (showAdvancedFields) {
      if (formData.expectedMonthlyRevenue < 0) {
        newErrors.expectedMonthlyRevenue = 'Expected monthly revenue cannot be negative';
      }

      if (formData.expectedAnnualRevenue < 0) {
        newErrors.expectedAnnualRevenue = 'Expected annual revenue cannot be negative';
      }

      if (formData.customerAcquisitionCost < 0) {
        newErrors.customerAcquisitionCost = 'Customer acquisition cost cannot be negative';
      }

      if (formData.customerLifetimeValue < 0) {
        newErrors.customerLifetimeValue = 'Customer lifetime value cannot be negative';
      }

      if (formData.timeToMarket < 0) {
        newErrors.timeToMarket = 'Time to market cannot be negative';
      }

      if (formData.teamSize < 0) {
        newErrors.teamSize = 'Team size cannot be negative';
      }

      if (formData.fundingRequired < 0) {
        newErrors.fundingRequired = 'Funding required cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {idea ? 'Edit Business Idea' : 'New Business Idea'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Fill in the details of your business concept. Advanced fields help pre-populate the modeling engine.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter business name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry *
            </label>
            <select
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.industry ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
            {errors.industry && <p className="text-red-500 text-xs mt-1">{errors.industry}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Describe your business idea..."
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        {/* Business Model & Target Market */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Model *
            </label>
            <select
              value={formData.businessModel}
              onChange={(e) => handleInputChange('businessModel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {BUSINESS_MODELS.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Market *
            </label>
            <select
              value={formData.targetMarket}
              onChange={(e) => handleInputChange('targetMarket', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.targetMarket ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select target market</option>
              {TARGET_MARKETS.map(market => (
                <option key={market} value={market}>{market}</option>
              ))}
            </select>
            {errors.targetMarket && <p className="text-red-500 text-xs mt-1">{errors.targetMarket}</p>}
          </div>
        </div>

        {/* Basic Financial Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Startup Cost (£)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.initialStartupCost}
              onChange={(e) => handleInputChange('initialStartupCost', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.initialStartupCost ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.initialStartupCost && <p className="text-red-500 text-xs mt-1">{errors.initialStartupCost}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Operating Cost (£)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.ongoingMonthlyCost}
              onChange={(e) => handleInputChange('ongoingMonthlyCost', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.ongoingMonthlyCost ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.ongoingMonthlyCost && <p className="text-red-500 text-xs mt-1">{errors.ongoingMonthlyCost}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Operating Cost (£)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.ongoingAnnualCost}
              onChange={(e) => handleInputChange('ongoingAnnualCost', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.ongoingAnnualCost ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.ongoingAnnualCost && <p className="text-red-500 text-xs mt-1">{errors.ongoingAnnualCost}</p>}
          </div>
        </div>

        {/* Advanced Fields Toggle */}
        <div className="border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => setShowAdvancedFields(!showAdvancedFields)}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {showAdvancedFields ? '▼' : '▶'} Advanced Business Modeling Fields
            <span className="ml-2 text-xs text-gray-500">
              (Optional - helps pre-populate advanced modeling)
            </span>
          </button>
        </div>

        {/* Advanced Fields */}
        {showAdvancedFields && (
          <div className="space-y-6 bg-blue-50 p-4 rounded-lg">
            {/* Market Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market Size
                </label>
                <select
                  value={formData.marketSize}
                  onChange={(e) => handleInputChange('marketSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select market size</option>
                  {MARKET_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competitive Landscape
                </label>
                <select
                  value={formData.competitiveLandscape}
                  onChange={(e) => handleInputChange('competitiveLandscape', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select competitive landscape</option>
                  {COMPETITIVE_LANDSCAPES.map(landscape => (
                    <option key={landscape} value={landscape}>{landscape}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unique Value Proposition
              </label>
              <textarea
                value={formData.uniqueValueProposition}
                onChange={(e) => handleInputChange('uniqueValueProposition', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What makes your business unique?"
              />
            </div>

            {/* Revenue Projections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Monthly Revenue (£)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.expectedMonthlyRevenue}
                  onChange={(e) => handleInputChange('expectedMonthlyRevenue', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.expectedMonthlyRevenue ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.expectedMonthlyRevenue && <p className="text-red-500 text-xs mt-1">{errors.expectedMonthlyRevenue}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Annual Revenue (£)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.expectedAnnualRevenue}
                  onChange={(e) => handleInputChange('expectedAnnualRevenue', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.expectedAnnualRevenue ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.expectedAnnualRevenue && <p className="text-red-500 text-xs mt-1">{errors.expectedAnnualRevenue}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pricing Strategy
              </label>
              <textarea
                value={formData.pricingStrategy}
                onChange={(e) => handleInputChange('pricingStrategy', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your pricing approach..."
              />
            </div>

            {/* Customer Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Acquisition Cost (£)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.customerAcquisitionCost}
                  onChange={(e) => handleInputChange('customerAcquisitionCost', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.customerAcquisitionCost ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.customerAcquisitionCost && <p className="text-red-500 text-xs mt-1">{errors.customerAcquisitionCost}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Lifetime Value (£)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.customerLifetimeValue}
                  onChange={(e) => handleInputChange('customerLifetimeValue', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.customerLifetimeValue ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.customerLifetimeValue && <p className="text-red-500 text-xs mt-1">{errors.customerLifetimeValue}</p>}
              </div>
            </div>

            {/* Business Planning */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time to Market (months)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.timeToMarket}
                  onChange={(e) => handleInputChange('timeToMarket', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.timeToMarket ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.timeToMarket && <p className="text-red-500 text-xs mt-1">{errors.timeToMarket}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Size
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.teamSize}
                  onChange={(e) => handleInputChange('teamSize', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.teamSize ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.teamSize && <p className="text-red-500 text-xs mt-1">{errors.teamSize}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funding Required (£)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fundingRequired}
                  onChange={(e) => handleInputChange('fundingRequired', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.fundingRequired ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.fundingRequired && <p className="text-red-500 text-xs mt-1">{errors.fundingRequired}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Risks
              </label>
              <textarea
                value={formData.keyRisks}
                onChange={(e) => handleInputChange('keyRisks', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What are the main risks to this business?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Success Metrics
              </label>
              <textarea
                value={formData.successMetrics}
                onChange={(e) => handleInputChange('successMetrics', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="How will you measure success?"
              />
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a tag..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {idea ? 'Update Idea' : 'Save Idea'}
          </button>
        </div>
      </form>
    </div>
  );
} 