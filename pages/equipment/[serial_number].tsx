import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Equipment {
  serial_number: string; // Primary key - REQUIRED
  equipment_id?: string; // Optional user-defined ID
  name: string;
  category_id: string;
  manufacturer?: string;
  model?: string;
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
  current_location?: string;
  current_location_id?: string;
  last_moved?: string;
}

interface EquipmentNote {
  id: string;
  serial_number: string; // Primary reference to equipment
  equipment_id?: string; // Optional backward compatibility
  note_text: string;
  author: string;
  created_at: string;
  updated_at: string;
}

interface LocationHistory {
  id: string;
  serial_number: string;
  equipment_id?: string;
  name: string;
  location_id: string;
  location_name: string;
  status: string;
  moved_at: string;
  moved_by?: string;
  notes?: string;
  valid_from?: string;
  valid_to?: string;
  is_current: boolean;
}

interface Attachment {
  id: string;
  serial_number: string; // Updated to reference serial_number
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  uploaded_by?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'maintenance': return 'bg-yellow-100 text-yellow-800';
    case 'retired': return 'bg-gray-100 text-gray-800';
    case 'lost': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getConditionColor = (rating: number) => {
  if (rating >= 4) return 'bg-green-100 text-green-800';
  if (rating >= 3) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export default function EquipmentDetail() {
  const router = useRouter();
  const { serial_number } = router.query;
  
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [notes, setNotes] = useState<EquipmentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingNote, setAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteAuthor, setNewNoteAuthor] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (serial_number && typeof serial_number === 'string') {
      loadEquipmentDetails();
    }
  }, [serial_number]);

  const loadEquipmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch equipment details
      const response = await fetch(`/api/equipment/${encodeURIComponent(serial_number as string)}`);
      if (!response.ok) {
        throw new Error('Equipment not found');
      }

      const data = await response.json();
      setEquipment(data);
      setLocationHistory(data.location_history || []);
      setAttachments(data.attachments || []);

      // Load notes for this equipment
      await loadNotes(serial_number as string);
    } catch (error) {
      console.error('Error loading equipment details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load equipment details');
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async (serialNumber: string) => {
    try {
      const response = await fetch(`/api/equipment-notes?serial_number=${encodeURIComponent(serialNumber)}`);
      if (response.ok) {
        const notesData = await response.json();
        setNotes(notesData);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      // Don't fail the whole page if notes don't load
    }
  };

  const startEditing = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveField = async () => {
    if (!equipment || !editingField) return;

    try {
      setSaving(true);
      
      // Convert value based on field type
      let processedValue: any = editValue;
      if (editingField === 'purchase_cost') {
        processedValue = editValue ? parseFloat(editValue) : null;
      } else if (editingField === 'condition_rating' || editingField === 'calibration_frequency_months') {
        processedValue = editValue ? parseInt(editValue) : null;
      }

      const response = await fetch(`/api/equipment/${encodeURIComponent(equipment.serial_number)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [editingField]: processedValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update equipment');
      }

      const updatedEquipment = await response.json();
      setEquipment(updatedEquipment);
      setEditingField(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating equipment:', error);
      alert('Failed to update equipment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/equipment-attachments/${attachment.id}/download`);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('Failed to download file');
    }
  };

  const startAddingNote = () => {
    setAddingNote(true);
    setNewNoteText('');
    setNewNoteAuthor('System User');
  };

  const cancelAddingNote = () => {
    setAddingNote(false);
    setNewNoteText('');
    setNewNoteAuthor('');
  };

  const saveNote = async () => {
    if (!equipment || !newNoteText.trim()) return;

    try {
      setSavingNote(true);
      const response = await fetch('/api/equipment-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serial_number: equipment.serial_number,
          equipment_id: equipment.equipment_id,
          note_text: newNoteText.trim(),
          author: newNoteAuthor || 'System User',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.needsSetup) {
          alert('Notes system needs setup. Please contact administrator to create the equipment_notes table.');
          return;
        }
        throw new Error('Failed to save note');
      }

      // Reload notes
      await loadNotes(equipment.serial_number);
      setAddingNote(false);
      setNewNoteText('');
      setNewNoteAuthor('');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/equipment-notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      // Remove the note from the local state
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  // Editable field component
  const EditableField = ({ 
    field, 
    value, 
    type = 'text', 
    options = null,
    className = '',
    displayValue = null 
  }: {
    field: string;
    value: any;
    type?: 'text' | 'number' | 'date' | 'select';
    options?: { value: string; label: string }[] | null;
    className?: string;
    displayValue?: string | null;
  }) => {
    const isEditing = editingField === field;
    const displayText = displayValue || (value || 'N/A');

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          {type === 'select' && options ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
            />
          )}
          <button
            onClick={saveField}
            disabled={saving}
            className="text-green-600 hover:text-green-800 text-sm"
            title="Save"
          >
            ✓
          </button>
          <button
            onClick={cancelEditing}
            disabled={saving}
            className="text-red-600 hover:text-red-800 text-sm"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <div 
        onClick={() => startEditing(field, value)}
        className={`cursor-pointer hover:bg-blue-50 hover:border-blue-200 border border-transparent rounded px-2 py-1 transition-colors ${className}`}
        title="Click to edit"
      >
        {displayText}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading equipment details...</p>
        </div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Equipment Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested equipment could not be found.'}</p>
          <Link href="/equipment" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Back to Equipment List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/equipment" className="text-blue-600 hover:text-blue-800">
                ← Back to Equipment
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                {equipment.name}
              </h1>
              <span className="text-sm text-gray-500">
                Serial: {equipment.serial_number}
                {equipment.equipment_id && ` • ID: ${equipment.equipment_id}`}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(equipment.status)}`}>
                {equipment.status}
              </span>
              {equipment.condition_rating && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(equipment.condition_rating)}`}>
                  Condition: {equipment.condition_rating}/5
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Helper text */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Click any field below to edit it inline.</strong> Changes are saved automatically when you click the checkmark.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Equipment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Serial Number</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{equipment.serial_number}</p>
                  <p className="text-xs text-gray-400 mt-1">Serial number cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Equipment ID</label>
                  <div className="mt-1">
                    <EditableField 
                      field="equipment_id" 
                      value={equipment.equipment_id} 
                      className="text-sm text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Name</label>
                  <div className="mt-1">
                    <EditableField 
                      field="name" 
                      value={equipment.name} 
                      className="text-sm text-gray-900 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <EditableField 
                      field="status" 
                      value={equipment.status}
                      type="select"
                      options={[
                        { value: 'active', label: 'Active' },
                        { value: 'maintenance', label: 'Maintenance' },
                        { value: 'retired', label: 'Retired' },
                        { value: 'lost', label: 'Lost' }
                      ]}
                      className={`text-sm px-2 py-1 rounded-md ${getStatusColor(equipment.status)}`}
                      displayValue={equipment.status}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Manufacturer</label>
                  <div className="mt-1">
                    <EditableField 
                      field="manufacturer" 
                      value={equipment.manufacturer} 
                      className="text-sm text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Model</label>
                  <div className="mt-1">
                    <EditableField 
                      field="model" 
                      value={equipment.model} 
                      className="text-sm text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Purchase Date</label>
                  <div className="mt-1">
                    <EditableField 
                      field="purchase_date" 
                      value={equipment.purchase_date} 
                      type="date"
                      className="text-sm text-gray-900"
                      displayValue={equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : null}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Purchase Cost</label>
                  <div className="mt-1">
                    <EditableField 
                      field="purchase_cost" 
                      value={equipment.purchase_cost} 
                      type="number"
                      className="text-sm text-gray-900"
                      displayValue={equipment.purchase_cost ? `£${equipment.purchase_cost.toLocaleString()}` : null}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Condition Rating</label>
                  <div className="mt-1">
                    <EditableField 
                      field="condition_rating" 
                      value={equipment.condition_rating} 
                      type="select"
                      options={[
                        { value: '1', label: '1 - Poor' },
                        { value: '2', label: '2 - Fair' },
                        { value: '3', label: '3 - Good' },
                        { value: '4', label: '4 - Very Good' },
                        { value: '5', label: '5 - Excellent' }
                      ]}
                      className={`text-sm px-2 py-1 rounded-md ${equipment.condition_rating ? getConditionColor(equipment.condition_rating) : ''}`}
                      displayValue={equipment.condition_rating ? `${equipment.condition_rating}/5` : null}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Current Location</label>
                  <div className="mt-1">
                    <EditableField 
                      field="location_id" 
                      value={equipment.location_id} 
                      className="text-sm text-gray-900"
                      displayValue={equipment.current_location || equipment.location_id}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Calibration & Dates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Calibration & Important Dates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Next Calibration Due</label>
                  <div className="mt-1">
                    <EditableField 
                      field="next_calibration_due" 
                      value={equipment.next_calibration_due} 
                      type="date"
                      className={`text-sm px-2 py-1 rounded-md ${
                        equipment.next_calibration_due ? (() => {
                          const today = new Date();
                          const dueDate = new Date(equipment.next_calibration_due);
                          const diffTime = dueDate.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (diffDays < 0) {
                            return 'bg-red-100 text-red-800';
                          } else if (diffDays <= 60) {
                            return 'bg-yellow-100 text-yellow-800';
                          } else {
                            return 'bg-green-100 text-green-800';
                          }
                        })() : ''
                      }`}
                      displayValue={equipment.next_calibration_due ? (() => {
                        const today = new Date();
                        const dueDate = new Date(equipment.next_calibration_due);
                        const diffTime = dueDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let statusText = '';
                        if (diffDays < 0) {
                          statusText = ` (${Math.abs(diffDays)} days overdue)`;
                        } else if (diffDays <= 60) {
                          statusText = ` (${diffDays} days remaining)`;
                        } else {
                          statusText = ` (${diffDays} days remaining)`;
                        }
                        
                        return new Date(equipment.next_calibration_due).toLocaleDateString() + statusText;
                      })() : null}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Off Hire Date</label>
                  <div className="mt-1">
                    <EditableField 
                      field="warranty_expiry" 
                      value={equipment.warranty_expiry} 
                      type="date"
                      className="text-sm text-gray-900"
                      displayValue={equipment.warranty_expiry ? new Date(equipment.warranty_expiry).toLocaleDateString() : null}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Calibration</label>
                  <div className="mt-1">
                    <EditableField 
                      field="last_calibration_date" 
                      value={equipment.last_calibration_date} 
                      type="date"
                      className="text-sm text-gray-900"
                      displayValue={equipment.last_calibration_date ? new Date(equipment.last_calibration_date).toLocaleDateString() : null}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Calibration Frequency (months)</label>
                  <div className="mt-1">
                    <EditableField 
                      field="calibration_frequency_months" 
                      value={equipment.calibration_frequency_months} 
                      type="number"
                      className="text-sm text-gray-900"
                      displayValue={equipment.calibration_frequency_months ? `${equipment.calibration_frequency_months} months` : null}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Equipment Notes</h2>
                {!addingNote && (
                  <button
                    onClick={startAddingNote}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    ➕ Add Note
                  </button>
                )}
              </div>
              
              {addingNote && (
                <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                      <textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Enter your note about this equipment..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                      <input
                        type="text"
                        value={newNoteAuthor}
                        onChange={(e) => setNewNoteAuthor(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={saveNote}
                      disabled={!newNoteText.trim() || savingNote}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                    >
                      {savingNote ? '💾 Saving...' : '💾 Save Note'}
                    </button>
                    <button
                      onClick={cancelAddingNote}
                      disabled={savingNote}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {note.author}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                          title="Delete note"
                        >
                          🗑️
                        </button>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {note.note_text}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 italic">
                      No notes added yet. Click "Add Note" to start logging information about this equipment.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Location History */}
            {locationHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Location History</h2>
                <div className="space-y-4">
                  {locationHistory.map((history, index) => (
                    <div key={history.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                      <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                        history.is_current ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {history.location_name}
                            {history.is_current && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(history.moved_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center space-x-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(history.status)}`}>
                            {history.status}
                          </span>
                          {history.moved_by && (
                            <p className="text-xs text-gray-500">Moved by: {history.moved_by}</p>
                          )}
                        </div>
                        {history.notes && (
                          <p className="mt-1 text-xs text-gray-600">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Current Location</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {equipment.current_location || equipment.location?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Calibration Due</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {equipment.next_calibration_due 
                      ? new Date(equipment.next_calibration_due).toLocaleDateString()
                      : 'Not scheduled'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Condition</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {equipment.condition_rating ? `${equipment.condition_rating}/5` : 'Not rated'}
                  </p>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">System Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{new Date(equipment.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{new Date(equipment.updated_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Serial Number</label>
                  <p className="text-gray-900 font-mono text-xs">{equipment.serial_number}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 