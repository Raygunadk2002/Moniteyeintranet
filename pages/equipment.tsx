import React, { useState, useCallback, useEffect } from "react";
import Layout from "../components/Layout";

interface Equipment {
  id: string;
  equipment_id: string;
  name: string;
  category_id: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_cost?: number;
  warranty_expiry?: string;
  location_id: string;
  status: 'active' | 'maintenance' | 'retired' | 'lost';
  condition_rating?: number;
  last_calibration_date?: string;
  next_calibration_due?: string;
  calibration_frequency_months?: number;
  notes?: string;
  specifications?: any;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string; description?: string; icon: string };
  location?: { id: string; name: string; address?: string };
}

interface EquipmentCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  count?: number;
}

interface EquipmentLocation {
  id: string;
  name: string;
  address?: string;
  count?: number;
}

interface UploadResult {
  success: boolean;
  message?: string;
  recordsProcessed?: number;
  successfulImports?: number;
  failedImports?: number;
  detectedFormat?: string;
  summary?: string;
  error?: string;
  suggestions?: string[];
  errors?: string[];
}

export default function Equipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [locations, setLocations] = useState<EquipmentLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload states
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // New equipment form
  const [newEquipment, setNewEquipment] = useState({
    equipment_id: '',
    name: '',
    category_id: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_expiry: '',
    location_id: '',
    status: 'active' as Equipment['status'],
    condition_rating: '',
    notes: ''
  });

  // Summary stats
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    retired: 0,
    calibrationDueSoon: 0,
    overdueCalibrations: 0
  });

  // Load equipment data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/equipment');
      if (!response.ok) {
        throw new Error('Failed to fetch equipment');
      }
      
      const data = await response.json();
      
      setEquipment(data.equipment || []);
      setCategories(data.categories || []);
      setLocations(data.locations || []);
      setSummary(data.summary || {});
    } catch (error) {
      console.error('Error loading equipment:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter equipment
  const filteredEquipment = equipment.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || item.location_id === selectedLocation;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesLocation && matchesStatus && matchesSearch;
  });

  // Add equipment
  const addEquipment = useCallback(async () => {
    if (!newEquipment.equipment_id.trim() || !newEquipment.name.trim() || 
        !newEquipment.category_id || !newEquipment.location_id) return;

    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEquipment,
          purchase_cost: newEquipment.purchase_cost ? parseFloat(newEquipment.purchase_cost) : undefined,
          condition_rating: newEquipment.condition_rating ? parseInt(newEquipment.condition_rating) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create equipment');
      }

      await loadData();
      setNewEquipment({
        equipment_id: '', name: '', category_id: '', manufacturer: '', model: '',
        serial_number: '', purchase_date: '', purchase_cost: '', warranty_expiry: '',
        location_id: '', status: 'active', condition_rating: '', notes: ''
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating equipment:', error);
      alert(error instanceof Error ? error.message : 'Failed to create equipment');
    }
  }, [newEquipment, loadData]);

  // Update equipment
  const updateEquipment = useCallback(async () => {
    if (!editingEquipment) return;

    try {
      const response = await fetch('/api/equipment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEquipment),
      });

      if (!response.ok) {
        throw new Error('Failed to update equipment');
      }

      await loadData();
      setEditingEquipment(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating equipment:', error);
    }
  }, [editingEquipment, loadData]);

  // Delete equipment
  const deleteEquipment = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;

    try {
      const response = await fetch(`/api/equipment?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete equipment');
      }

      await loadData();
    } catch (error) {
      console.error('Error deleting equipment:', error);
    }
  }, [loadData]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-equipment', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: data.message,
          recordsProcessed: data.recordsProcessed,
          successfulImports: data.successfulImports,
          failedImports: data.failedImports,
          detectedFormat: data.detectedFormat,
          summary: data.summary,
        });
        await loadData(); // Refresh data
      } else {
        setUploadResult({
          success: false,
          error: data.error,
          suggestions: data.suggestions,
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: 'Upload failed. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-gray-100 text-gray-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get condition rating color
  const getConditionColor = (rating?: number) => {
    if (!rating) return 'bg-gray-100 text-gray-800';
    if (rating >= 4) return 'bg-green-100 text-green-800';
    if (rating >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 bg-gray-50 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading equipment inventory...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Equipment Inventory</h1>
                <p className="text-gray-600 mt-1">Manage environmental monitoring equipment</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  📤 Upload CSV
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  ➕ Add Equipment
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">📊</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-lg font-semibold text-gray-900">{summary.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-semibold">✅</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Active</p>
                  <p className="text-lg font-semibold text-gray-900">{summary.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold">🔧</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Maintenance</p>
                  <p className="text-lg font-semibold text-gray-900">{summary.maintenance}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">📦</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Retired</p>
                  <p className="text-lg font-semibold text-gray-900">{summary.retired}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">⏰</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Cal. Due</p>
                  <p className="text-lg font-semibold text-gray-900">{summary.calibrationDueSoon}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 font-semibold">⚠️</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Overdue</p>
                  <p className="text-lg font-semibold text-gray-900">{summary.overdueCalibrations}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search equipment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Locations</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          </div>

          {/* Equipment List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Equipment ({filteredEquipment.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Condition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEquipment.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.equipment_id}
                          </div>
                          <div className="text-sm text-gray-500">{item.name}</div>
                          {item.manufacturer && (
                            <div className="text-xs text-gray-400">
                              {item.manufacturer} {item.model}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{item.category?.icon}</span>
                          <span className="text-sm text-gray-900">{item.category?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.location?.name}</div>
                        {item.location?.address && (
                          <div className="text-xs text-gray-500">{item.location.address}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.condition_rating && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConditionColor(item.condition_rating)}`}>
                            {item.condition_rating}/5
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingEquipment(item);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteEquipment(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredEquipment.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500">
                    <div className="text-4xl mb-4">📦</div>
                    <p className="text-lg font-medium">No equipment found</p>
                    <p className="text-sm">Try adjusting your filters or add some equipment.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add New Equipment</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment ID *</label>
                <input
                  type="text"
                  value={newEquipment.equipment_id}
                  onChange={(e) => setNewEquipment({...newEquipment, equipment_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MON-001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Equipment name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={newEquipment.category_id}
                  onChange={(e) => setNewEquipment({...newEquipment, category_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <select
                  value={newEquipment.location_id}
                  onChange={(e) => setNewEquipment({...newEquipment, location_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={newEquipment.manufacturer}
                  onChange={(e) => setNewEquipment({...newEquipment, manufacturer: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  value={newEquipment.model}
                  onChange={(e) => setNewEquipment({...newEquipment, model: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={newEquipment.serial_number}
                  onChange={(e) => setNewEquipment({...newEquipment, serial_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={newEquipment.purchase_date}
                  onChange={(e) => setNewEquipment({...newEquipment, purchase_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEquipment.purchase_cost}
                  onChange={(e) => setNewEquipment({...newEquipment, purchase_cost: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newEquipment.status}
                  onChange={(e) => setNewEquipment({...newEquipment, status: e.target.value as Equipment['status']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newEquipment.condition_rating}
                  onChange={(e) => setNewEquipment({...newEquipment, condition_rating: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={newEquipment.notes}
                onChange={(e) => setNewEquipment({...newEquipment, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={addEquipment}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Add Equipment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Upload Equipment CSV</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV/Excel file
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: CSV, Excel (.xlsx, .xls)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">📋 Expected Format</h3>
              <p className="text-sm text-blue-700 mb-2">
                Your file should contain columns for:
              </p>
              <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                <li><strong>Equipment ID</strong> (required): Unique identifier (e.g., MON-001)</li>
                <li><strong>Name</strong> (required): Equipment name/description</li>
                <li><strong>Category</strong> (optional): Equipment type</li>
                <li><strong>Location</strong> (optional): Installation location</li>
                <li><strong>Manufacturer, Model, Serial Number</strong> (optional)</li>
              </ul>
            </div>

            {uploadResult && (
              <div className={`rounded-md p-4 mb-4 ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`text-sm font-medium mb-2 ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {uploadResult.success ? '✅ Upload Successful' : '❌ Upload Failed'}
                </h3>
                <p className={`text-sm mb-2 ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {uploadResult.message || uploadResult.error}
                </p>
                
                {uploadResult.success && uploadResult.summary && (
                  <p className="text-sm text-green-700">{uploadResult.summary}</p>
                )}
                
                {uploadResult.detectedFormat && (
                  <p className="text-sm text-blue-700 mt-2">
                    <strong>Detected:</strong> {uploadResult.detectedFormat}
                  </p>
                )}
                
                {uploadResult.suggestions && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-red-800 mb-1">Suggestions:</h4>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                      {uploadResult.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setFile(null);
                  setUploadResult(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 