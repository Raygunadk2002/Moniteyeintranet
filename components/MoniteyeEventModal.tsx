import React, { useState, useEffect } from 'react';
import { MoniteyeEvent } from '../pages/api/moniteye-events';

interface MoniteyeEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: MoniteyeEvent) => void;
  editEvent?: MoniteyeEvent | null;
  selectedDate?: string;
}

const MoniteyeEventModal: React.FC<MoniteyeEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editEvent,
  selectedDate
}) => {
  const [formData, setFormData] = useState<MoniteyeEvent>({
    title: '',
    description: '',
    start_date: selectedDate || new Date().toISOString().split('T')[0],
    end_date: selectedDate || new Date().toISOString().split('T')[0],
    all_day: true,
    event_type: 'company',
    created_by: 'Admin', // You can make this dynamic based on logged-in user
    location: '',
    attendees: [],
  });

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  useEffect(() => {
    if (editEvent) {
      setFormData(editEvent);
      if (!editEvent.all_day) {
        const startDateTime = new Date(editEvent.start_date);
        const endDateTime = new Date(editEvent.end_date);
        setStartTime(startDateTime.toTimeString().slice(0, 5));
        setEndTime(endDateTime.toTimeString().slice(0, 5));
      }
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        start_date: selectedDate,
        end_date: selectedDate,
      }));
    }
  }, [editEvent, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalStartDate = formData.start_date;
    let finalEndDate = formData.end_date;

    if (!formData.all_day) {
      finalStartDate = `${formData.start_date}T${startTime}:00.000Z`;
      finalEndDate = `${formData.end_date}T${endTime}:00.000Z`;
    }

    const eventToSave: MoniteyeEvent = {
      ...formData,
      start_date: finalStartDate,
      end_date: finalEndDate,
    };

    onSave(eventToSave);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      start_date: selectedDate || new Date().toISOString().split('T')[0],
      end_date: selectedDate || new Date().toISOString().split('T')[0],
      all_day: true,
      event_type: 'company',
      created_by: 'Admin',
      location: '',
      attendees: [],
    });
    setStartTime('09:00');
    setEndTime('17:00');
    onClose();
  };

  const eventTypeColors = {
    company: 'bg-blue-100 text-blue-800',
    meeting: 'bg-green-100 text-green-800',
    holiday: 'bg-red-100 text-red-800',
    announcement: 'bg-yellow-100 text-yellow-800',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editEvent ? 'Edit Moniteye Event' : 'Create Moniteye Event'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter event title..."
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value as MoniteyeEvent['event_type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="company">🏢 Company Event</option>
                <option value="meeting">🤝 Meeting</option>
                <option value="holiday">🎉 Holiday</option>
                <option value="announcement">📢 Announcement</option>
              </select>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.all_day}
                onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
                All Day Event
              </label>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date.split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {!formData.all_day && (
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date.split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {!formData.all_day && (
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                  />
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter location..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter event description..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {editEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MoniteyeEventModal; 