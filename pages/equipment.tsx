import React, { useState, useCallback, useEffect, useMemo } from "react";
import Layout from "../components/Layout";
import Link from "next/link";

// Gantt Chart Component
interface GanttChartProps {
  equipment: Equipment[];
}

const GanttChart: React.FC<GanttChartProps> = ({ equipment }) => {
  // Filter equipment that has warranty_expiry (project end dates)
  const equipmentWithDates = equipment.filter(item => 
    item.warranty_expiry && new Date(item.warranty_expiry) > new Date()
  );

  if (equipmentWithDates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-lg font-medium">No deployment timeline data</p>
          <p className="text-sm">Equipment needs project end dates to show in Gantt chart.</p>
        </div>
      </div>
    );
  }

  // Calculate date range
  const today = new Date();
  const dates = equipmentWithDates.map(item => new Date(item.warranty_expiry!));
  const minDate = new Date(Math.min(today.getTime(), ...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Generate month labels
  const months: Date[] = [];
  const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (current <= maxDate) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'retired': return 'bg-gray-500';
      case 'lost': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const calculateBarWidth = (startDate: Date, endDate: Date) => {
    const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const itemDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max((itemDays / totalDays) * 100, 2); // Minimum 2% width
  };

  const calculateBarOffset = (startDate: Date) => {
    const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const offsetDays = (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    return (offsetDays / totalDays) * 100;
  };

  return (
    <div className="overflow-x-auto">
      {/* Timeline Header */}
      <div className="mb-4">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <div className="w-64 flex-shrink-0">Equipment</div>
          <div className="flex-1 grid grid-cols-12 gap-1 text-center">
            {months.slice(0, 12).map((month, index) => (
              <div key={index} className="text-xs">
                {month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              </div>
            ))}
          </div>
        </div>
        
        {/* Current date indicator */}
        <div className="flex items-center">
          <div className="w-64 flex-shrink-0"></div>
          <div className="flex-1 relative">
            <div 
              className="absolute top-0 w-0.5 h-full bg-red-500 z-10"
              style={{ left: `${calculateBarOffset(today)}%` }}
            >
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Rows */}
      <div className="space-y-2">
        {equipmentWithDates.map((item) => {
          const startDate = today;
          const endDate = item.warranty_expiry ? 
            new Date(item.warranty_expiry) : 
            item.next_calibration_due ? 
              new Date(item.next_calibration_due) : 
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default to 1 year from now
          const barWidth = calculateBarWidth(startDate, endDate);
          const barOffset = calculateBarOffset(startDate);
          
          const endDateLabel = item.warranty_expiry ? 
            'Off Hire' : 
            item.next_calibration_due ? 
              'Calibration Due' : 
              'No End Date';
          
          return (
            <div key={item.serial_number} className="flex items-center">
              {/* Equipment Info */}
              <div className="w-64 flex-shrink-0 pr-4">
                <Link href={`/equipment/${encodeURIComponent(item.serial_number)}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                  {item.name}
                </Link>
                <div className="text-xs text-gray-500">
                  {item.equipment_id} • {formatLocation(item.current_location || item.location_id)}
                </div>
                <div className="text-xs text-gray-400">
                  {endDateLabel}: {formatDate(item.warranty_expiry || item.next_calibration_due)}
                </div>
              </div>
              
              {/* Timeline Bar */}
              <div className="flex-1 relative h-8 bg-gray-100 rounded">
                <div
                  className={`absolute top-1 bottom-1 rounded ${getStatusColor(item.status)} opacity-80`}
                  style={{
                    left: `${barOffset}%`,
                    width: `${barWidth}%`
                  }}
                >
                  <div className="px-2 py-1 text-xs text-white font-medium truncate">
                    {item.status === 'maintenance' ? 'At Calibration' : 
                     item.status === 'active' && item.current_location?.toLowerCase().includes('office') ? 'In Stock' :
                     'On Site'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>On Site</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>At Calibration</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>In Stock</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 bg-red-500"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

interface Equipment {
  serial_number: string; // Primary key - REQUIRED
  equipment_id?: string; // Optional user-defined ID
  name: string;
  category_id: string;
  manufacturer?: string;
  model?: string;
  purchase_date?: string;
  purchase_cost?: number;
  warranty_expiry?: string; // This serves as the end date/off hire date
  location_id: string;
  status: 'active' | 'maintenance' | 'retired' | 'lost';
  condition_rating?: number;
  last_calibration_date?: string;
  next_calibration_due?: string; // This is the key field for calibration tracking
  calibration_frequency_months?: number;
  notes?: string;
  specifications?: any;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string; description?: string; icon: string };
  location?: { id: string; name: string; address?: string };
  current_location?: string;
  current_location_id?: string;
  last_moved?: string;
}

interface EquipmentCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
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

// Helper function to get calibration status color
const getCalibrationStatus = (calibrationDate: string | null | undefined) => {
  if (!calibrationDate) return { color: 'text-gray-500', bgColor: 'bg-gray-50', status: 'No Date' };
  
  const today = new Date();
  const dueDate = new Date(calibrationDate);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { color: 'text-red-800', bgColor: 'bg-red-100', status: 'Overdue' };
  } else if (diffDays <= 60) { // Within 2 months (60 days)
    return { color: 'text-yellow-800', bgColor: 'bg-yellow-100', status: 'Due Soon' };
  } else {
    return { color: 'text-green-800', bgColor: 'bg-green-100', status: 'Current' };
  }
};

// Helper function to format date
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const formatLocation = (location: string | null | undefined) => {
  if (!location) return 'Unknown';
  
  // Convert kebab-case or snake_case to Title Case
  return location
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export default function Equipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [selectedEquipmentForAttachment, setSelectedEquipmentForAttachment] = useState<Equipment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'gantt'>('table');
  
  // Sorting state
  const [sortField, setSortField] = useState<keyof Equipment | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{serial_number: string, field: string} | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Upload states
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // New equipment form - serial_number is now required and primary
  const [newEquipment, setNewEquipment] = useState({
    serial_number: '', // REQUIRED - Primary key
    equipment_id: '', // Optional
    name: '',
    category_id: '',
    manufacturer: '',
    model: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_expiry: '',
    location_id: '',
    status: 'active' as Equipment['status'],
    condition_rating: '',
    notes: ''
  });

  // Calculate summary stats from equipment data in real-time
  const summary = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const total = equipment.length;
    const active = equipment.filter(item => item.status === 'active').length;
    const maintenance = equipment.filter(item => item.status === 'maintenance').length;
    const retired = equipment.filter(item => item.status === 'retired').length;
    const lost = equipment.filter(item => item.status === 'lost').length;
    
    // Calculate calibration due soon (within 30 days)
    const calibrationDueSoon = equipment.filter(item => {
      if (!item.next_calibration_due) return false;
      const dueDate = new Date(item.next_calibration_due);
      return dueDate > now && dueDate <= thirtyDaysFromNow;
    }).length;
    
    // Calculate overdue calibrations
    const overdueCalibrations = equipment.filter(item => {
      if (!item.next_calibration_due) return false;
      const dueDate = new Date(item.next_calibration_due);
      return dueDate < now;
    }).length;
    
    return {
      total,
      active,
      maintenance,
      retired,
      lost,
      calibrationDueSoon,
      overdueCalibrations
    };
  }, [equipment]);

  // Load equipment data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Add cache busting to ensure fresh data
      const response = await fetch(`/api/equipment?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch equipment');
      }
      
      const data = await response.json();
      
      setEquipment(data.equipment || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sorting function
  const handleSort = (field: keyof Equipment) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Inline editing functions
  const startEditing = (serial_number: string, field: string, currentValue: string) => {
    setEditingCell({ serial_number, field });
    setEditingValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    try {
      const response = await fetch('/api/equipment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial_number: editingCell.serial_number,
          [editingCell.field]: editingValue
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update equipment');
      }

      await loadData();
      setEditingCell(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error updating equipment:', error);
      alert('Failed to update equipment');
    }
  };

  // Filter and sort equipment
  const filteredAndSortedEquipment = useMemo(() => {
    let filtered = equipment.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
      const matchesLocation = selectedLocation === 'all' || 
        (item.current_location || item.location_id) === selectedLocation;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesLocation && matchesStatus && matchesSearch;
    });

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
        if (bValue == null) return sortDirection === 'asc' ? -1 : 1;
        
        // Handle dates
        if (sortField === 'next_calibration_due' || sortField === 'warranty_expiry' || sortField === 'purchase_date') {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        }
        
        // Handle strings (case insensitive)
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [equipment, selectedCategory, selectedLocation, selectedStatus, searchTerm, sortField, sortDirection]);

  // Filter equipment
  const filteredEquipment = filteredAndSortedEquipment;

  // Filter equipment for Gantt chart (use end dates or calibration dates)
  const equipmentWithDates = filteredEquipment.filter(item => {
    const hasEndDate = item.warranty_expiry && new Date(item.warranty_expiry) > new Date();
    const hasCalibrationDate = item.next_calibration_due && new Date(item.next_calibration_due) > new Date();
    return hasEndDate || hasCalibrationDate;
  });

  // Add equipment - serial_number is now required
  const addEquipment = useCallback(async () => {
    if (!newEquipment.serial_number.trim() || !newEquipment.name.trim() || 
        !newEquipment.category_id || !newEquipment.location_id) {
      alert('Serial number, name, category, and location are required');
      return;
    }

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
        serial_number: '', equipment_id: '', name: '', category_id: '', manufacturer: '', model: '',
        purchase_date: '', purchase_cost: '', warranty_expiry: '',
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

  // Handle PDF upload for equipment attachments
  const handlePDFUpload = async (file: File, equipment: Equipment) => {
    if (!file || !equipment.serial_number || !equipment.equipment_id) {
      alert('Missing required information for upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('equipment_id', equipment.equipment_id);
    formData.append('serial_number', equipment.serial_number);
    formData.append('description', `PDF attachment for ${equipment.name}`);

    try {
      const response = await fetch('/api/equipment-attachments', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert('PDF uploaded successfully!');
        // You could refresh attachments list here
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      alert('Failed to upload PDF. Please try again.');
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

  // Sortable header component
  const SortableHeader = ({ field, children, className = "" }: { 
    field: keyof Equipment; 
    children: React.ReactNode; 
    className?: string;
  }) => (
    <th 
      scope="col" 
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          <span className="text-gray-400">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  // Editable cell component for dates
  const EditableCell = ({ 
    value, 
    serial_number, 
    field, 
    type = "text",
    className = ""
  }: {
    value: string | null | undefined;
    serial_number: string;
    field: string;
    type?: string;
    className?: string;
  }) => {
    const isEditing = editingCell?.serial_number === serial_number && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type={type}
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEditing();
            }}
            autoFocus
          />
          <button
            onClick={saveEdit}
            className="text-green-600 hover:text-green-800 text-xs"
          >
            ✓
          </button>
          <button
            onClick={cancelEditing}
            className="text-red-600 hover:text-red-800 text-xs"
          >
            ✕
          </button>
        </div>
      );
    }

    const displayValue = type === 'date' ? formatDate(value) : (value || 'N/A');
    const editableValue = type === 'date' && value ? value.split('T')[0] : (value || ''); // Format for date input
    
    return (
      <div 
        className={`cursor-pointer hover:bg-gray-50 rounded px-2 py-1 border border-transparent hover:border-gray-300 transition-colors ${className}`}
        onClick={() => startEditing(serial_number, field, editableValue)}
        title={`Click to edit ${field.replace('_', ' ')}`}
      >
        <div className="flex items-center justify-between">
          <span>{displayValue}</span>
          <span className="text-gray-400 text-xs opacity-0 group-hover:opacity-100 ml-2">✏️</span>
        </div>
        {type === 'date' && field === 'next_calibration_due' && value && (
          <div className="text-xs mt-1">
            {getCalibrationStatus(value).status}
          </div>
        )}
      </div>
    );
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
                  onClick={loadData}
                  disabled={loading}
                  className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  🔄 {loading ? 'Refreshing...' : 'Refresh'}
                </button>
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
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
                  <p className="text-sm font-medium text-gray-500" title="Calibration due within 30 days">Cal. Due</p>
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
                  <p className="text-sm font-medium text-gray-500" title="Calibration overdue">Overdue</p>
                  <p className="text-lg font-semibold text-gray-900">{summary.overdueCalibrations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 font-semibold">❌</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Lost</p>
                  <p className="text-lg font-semibold text-gray-900">{summary.lost}</p>
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
                  {/* Generate location options from actual equipment locations */}
                  {Array.from(new Set(equipment.map(item => item.current_location || item.location_id).filter(Boolean)))
                    .sort()
                    .map(location => (
                      <option key={location} value={location}>
                        {location}
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

          {/* View Toggle */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Equipment ({filteredEquipment.length})
              </h2>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 Table View
                </button>
                <button
                  onClick={() => setViewMode('gantt')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'gantt' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Gantt Chart
                </button>
              </div>
            </div>
          </div>

          {/* Equipment List */}
          {viewMode === 'table' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Equipment Table</h3>
                  <div className="text-sm text-gray-500">
                    💡 Click column headers to sort • Click dates to edit inline
                  </div>
                </div>
              </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableHeader field="serial_number">Serial Number</SortableHeader>
                    <SortableHeader field="equipment_id">Equipment ID</SortableHeader>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment Details
                    </th>
                    <SortableHeader field="name">Name</SortableHeader>
                    <SortableHeader field="next_calibration_due">Calibration Due</SortableHeader>
                    <SortableHeader field="warranty_expiry">Off Hire Date</SortableHeader>
                    <SortableHeader field="location_id">Location</SortableHeader>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEquipment.map((item) => (
                    <tr key={item.serial_number} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={`/equipment/${encodeURIComponent(item.serial_number)}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          {item.serial_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {item.equipment_id || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.manufacturer} {item.model}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EditableCell
                          value={item.next_calibration_due}
                          serial_number={item.serial_number}
                          field="next_calibration_due"
                          type="date"
                          className={(() => {
                            const calibrationStatus = getCalibrationStatus(item.next_calibration_due);
                            return `text-sm px-2 py-1 rounded-md ${calibrationStatus.bgColor} ${calibrationStatus.color}`;
                          })()}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EditableCell
                          value={item.warranty_expiry}
                          serial_number={item.serial_number}
                          field="warranty_expiry"
                          type="date"
                          className="text-sm text-gray-900"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatLocation(item.current_location || item.location_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link 
                            href={`/equipment/${encodeURIComponent(item.serial_number)}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => {
                              setEditingEquipment(item);
                              setShowEditModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEquipmentForAttachment(item);
                              setShowAttachmentModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Files
                          </button>
                        </div>
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
          ) : (
            /* Gantt Chart View */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Equipment Deployment Timeline</h3>
                <p className="text-sm text-gray-600 mt-1">Shows equipment deployment periods based on project end dates</p>
              </div>
              
              <div className="p-6">
                <GanttChart equipment={equipmentWithDates} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add New Equipment</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number *</label>
                <input
                  type="text"
                  value={newEquipment.serial_number}
                  onChange={(e) => setNewEquipment({...newEquipment, serial_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., AQ2000-001"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment ID</label>
                <input
                  type="text"
                  value={newEquipment.equipment_id}
                  onChange={(e) => setNewEquipment({...newEquipment, equipment_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MON-001 (optional)"
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
                  required
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
                <input
                  type="text"
                  value={newEquipment.location_id}
                  onChange={(e) => setNewEquipment({...newEquipment, location_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter location (e.g., Office, Warehouse, Site A)"
                  required
                />
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
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={addEquipment}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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

      {/* PDF Attachment Modal */}
      {showAttachmentModal && selectedEquipmentForAttachment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                PDF Attachments - {selectedEquipmentForAttachment.serial_number}
              </h2>
              <button
                onClick={() => {
                  setShowAttachmentModal(false);
                  setSelectedEquipmentForAttachment(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Equipment Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {selectedEquipmentForAttachment.name}</div>
                  <div><strong>Serial:</strong> {selectedEquipmentForAttachment.serial_number}</div>
                  <div><strong>Current Location:</strong> {selectedEquipmentForAttachment.current_location || selectedEquipmentForAttachment.location?.name}</div>
                  <div><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedEquipmentForAttachment.status)}`}>{selectedEquipmentForAttachment.status}</span></div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Upload New PDF</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePDFUpload(file, selectedEquipmentForAttachment);
                    }
                  }}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Select a PDF file to upload (max 10MB)
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Existing Attachments</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">
                  📎 No attachments yet. Upload a PDF to get started.
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowAttachmentModal(false);
                  setSelectedEquipmentForAttachment(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 