import React, { useState, useEffect, useCallback } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Layout from "../components/Layout";
import MoniteyeEventModal from '../components/MoniteyeEventModal';
import { MoniteyeEvent } from './api/moniteye-events';
// Force deployment refresh - ensure latest fixes are deployed

interface Holiday {
  id: number;
  name: string;
  date: string;
  country: string;
  type: string;
}

interface EmployeeHoliday {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  dateRange: string;
  status: string;
  type: string;
  duration: number;
  reason: string;
  approved: boolean;
}

interface EmployeeCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  location?: string;
  attendees?: string[];
  organizer: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'public' | 'private' | 'confidential';
  calendarType: 'google' | 'outlook' | 'ical' | 'exchange';
  employeeName: string;
  employeeId: string;
}

interface EmployeeCalendar {
  id: string;
  employeeId: string;
  employeeName: string;
  email: string;
  calendarType: 'google' | 'outlook' | 'ical' | 'exchange';
  calendarId?: string;
  isActive: boolean;
  lastSync?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    type: 'public' | 'employee' | 'meeting' | 'appointment';
    description?: string;
    employeeName?: string;
    duration?: number;
    reason?: string;
    location?: string;
    calendarType?: string;
    attendees?: string[];
    eventType?: string;
    moniteyeEvent?: boolean;
    moniteyeEventData?: MoniteyeEvent;
  };
}

// Enhanced logging utility for production debugging
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[CALENDAR-DEBUG ${timestamp}] ${message}`, data || '');
};

export default function Calendar() {
  logDebug('Calendar component initializing');

  const [currentDate, setCurrentDate] = useState<Date | null>(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [employeeHolidays, setEmployeeHolidays] = useState<EmployeeHoliday[]>([]);
  const [employeeCalendarEvents, setEmployeeCalendarEvents] = useState<EmployeeCalendarEvent[]>([]);
  const [employeeCalendars, setEmployeeCalendars] = useState<EmployeeCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [calendarEventsLoading, setCalendarEventsLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showPrivateEvents, setShowPrivateEvents] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [connectingEmployees, setConnectingEmployees] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  // Moniteye Events State
  const [moniteyeEvents, setMoniteyeEvents] = useState<MoniteyeEvent[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MoniteyeEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  logDebug('Initial state set', {
    currentDate: currentDate?.toISOString(),
    selectedEmployees,
    loading,
    calendarEventsLoading
  });

  // Initialize date only on client-side to avoid hydration mismatch
  useEffect(() => {
    console.log('📅 Initializing calendar with current date');
    setCurrentDate(new Date());
  }, []);

  // Additional fallback - force initialization if currentDate is still null after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!currentDate) {
        console.log('⚠️ Fallback: Force setting currentDate after delay');
        setCurrentDate(new Date());
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentDate]);

  // Define sync function early so it can be used in effects
  const handleSyncCalendars = async () => {
    try {
      setCalendarEventsLoading(true);
      setAlertMessage({ type: 'info', message: 'Syncing calendar data...' });
      
      // Refresh employee calendars first
      const calendarsResponse = await fetch('/api/employee-calendar-subscriptions');
      if (calendarsResponse.ok) {
        const calendarsData = await calendarsResponse.json();
        setEmployeeCalendars(calendarsData.calendars || []);
        
        // Update selected employees to include any newly active ones
        const activeEmployees = calendarsData.calendars
          .filter((cal: EmployeeCalendar) => cal.isActive)
          .map((cal: EmployeeCalendar) => cal.employeeId);
        setSelectedEmployees(activeEmployees);
        
        console.log('🔄 Updated employee selection after sync:', activeEmployees);
      }
      
      // Use the new fetchCalendarEvents function
      await fetchCalendarEvents();
      
      setAlertMessage({ type: 'success', message: 'Calendar data synced successfully!' });
    } catch (error) {
      console.error('❌ Failed to sync calendars:', error);
      setAlertMessage({ type: 'error', message: 'Failed to sync calendar data. Please try again.' });
    }
  };

  // Define connect function early so it can be used in effects
  const handleConnectCalendar = async (employeeId: string) => {
    try {
      // Track connecting state
      setConnectingEmployees(prev => new Set(prev).add(employeeId));
      
      // Show connecting message
      setAlertMessage({ type: 'info', message: `Connecting calendar for ${employeeId}...` });
      
      // Add timestamp to ensure fresh OAuth session
      const timestamp = Date.now();
      
      // Direct redirect to OAuth endpoint - no JSON response needed
      window.location.href = `/api/google-calendar-oauth?employeeId=${employeeId}&t=${timestamp}`;
    } catch (error) {
      console.error('Failed to initiate calendar connection:', error);
      setConnectingEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(employeeId);
        return newSet;
      });
      setAlertMessage({ type: 'error', message: `Failed to start calendar connection for ${employeeId}` });
    }
  };

  // Moniteye Events Functions
  const fetchMoniteyeEvents = async () => {
    try {
      const response = await fetch('/api/moniteye-events');
      if (response.ok) {
        const data = await response.json();
        setMoniteyeEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch Moniteye events:', error);
    }
  };

  const handleSaveMoniteyeEvent = async (eventData: MoniteyeEvent) => {
    try {
      const url = editingEvent ? `/api/moniteye-events?id=${editingEvent.id}` : '/api/moniteye-events';
      const method = editingEvent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        await fetchMoniteyeEvents(); // Refresh events
        setIsEventModalOpen(false);
        setEditingEvent(null);
        setAlertMessage({ 
          type: 'success', 
          message: `Event ${editingEvent ? 'updated' : 'created'} successfully!` 
        });
      } else {
        throw new Error('Failed to save event');
      }
    } catch (error) {
      console.error('Failed to save Moniteye event:', error);
      setAlertMessage({ type: 'error', message: 'Failed to save event' });
    }
  };

  const handleDeleteMoniteyeEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/moniteye-events?id=${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMoniteyeEvents(); // Refresh events
        setAlertMessage({ type: 'success', message: 'Event deleted successfully!' });
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error('Failed to delete Moniteye event:', error);
      setAlertMessage({ type: 'error', message: 'Failed to delete event' });
    }
  };

  // Handle URL parameters for success/error messages and auto-retry
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    const autoRetry = urlParams.get('auto_retry');
    
    if (error) {
      setAlertMessage({ type: 'error', message: error });
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success) {
      setAlertMessage({ type: 'success', message: success });
      // Clear URL parameters and refresh data
      window.history.replaceState({}, document.title, window.location.pathname);
      handleSyncCalendars();
    }
    
    // Handle auto-retry for fresh OAuth flow
    if (autoRetry) {
      setAlertMessage({ type: 'info', message: `Starting fresh OAuth flow for ${autoRetry}...` });
      setTimeout(() => {
        handleConnectCalendar(autoRetry);
      }, 2000); // Give user time to see the message
      // Clear the auto_retry parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Auto-clear alert messages after 5 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

    // Fetch holidays on component mount
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch('/api/timetastic');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setHolidays(data.holidays || []);
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
        setHolidays([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
    fetchMoniteyeEvents(); // Also fetch Moniteye events on mount
  }, []);

  // Fetch employee holidays
  useEffect(() => {
    const fetchEmployeeHolidays = async () => {
      try {
        const response = await fetch('/api/employee-holidays');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setEmployeeHolidays(data.holidays || []);
      } catch (error) {
        console.error('Failed to fetch employee holidays:', error);
        setEmployeeHolidays([]);
      } finally {
        setEmployeeLoading(false);
      }
    };

    fetchEmployeeHolidays();
  }, []);

  // Fetch employee calendar subscriptions
  useEffect(() => {
    const fetchEmployeeCalendars = async () => {
      try {
        const response = await fetch('/api/employee-calendar-subscriptions');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setEmployeeCalendars(data.calendars || []);
        
        // Auto-select all active employees
        const activeEmployees = data.calendars
          .filter((cal: EmployeeCalendar) => cal.isActive)
          .map((cal: EmployeeCalendar) => cal.employeeId);
        setSelectedEmployees(activeEmployees);
        
        console.log('✅ Employee calendars loaded:', {
          total: data.calendars.length,
          active: activeEmployees.length,
          activeEmployees
        });
      } catch (error) {
        console.error('Failed to fetch employee calendars:', error);
        setEmployeeCalendars([]);
      } finally {
        setEmployeeLoading(false);
      }
    };

    fetchEmployeeCalendars();
  }, []);

  // Memoized function to fetch calendar events - prevents unnecessary re-renders
  const fetchCalendarEvents = useCallback(async () => {
    logDebug('fetchCalendarEvents called', { selectedEmployees, loading: calendarEventsLoading });
    
    if (selectedEmployees.length === 0) {
      logDebug('No employees selected, skipping fetch');
      setCalendarEvents([]);
      setCalendarEventsLoading(false);
      return;
    }

    try {
      setCalendarEventsLoading(true);
      setError(null);
      logDebug('Starting calendar events fetch for employees', selectedEmployees);

      const promises = selectedEmployees.map(async (employeeId) => {
        logDebug(`Fetching events for employee: ${employeeId}`);
        const response = await fetch(`/api/simple-calendar-integration?employeeId=${employeeId}`);
        logDebug(`Response status for ${employeeId}:`, response.status);
        
        if (!response.ok) {
          logDebug(`Error response for ${employeeId}:`, {
            status: response.status,
            statusText: response.statusText
          });
          throw new Error(`Failed to fetch events for ${employeeId}: ${response.statusText}`);
        }
        
        const data = await response.json();
        logDebug(`Data received for ${employeeId}:`, {
          success: data.success,
          totalEvents: data.totalEvents,
          eventsLength: data.events?.length
        });
        
        return data.events || [];
      });

      const results = await Promise.all(promises);
      const allEvents = results.flat();
      
      logDebug('All calendar events fetched successfully', {
        totalEvents: allEvents.length,
        eventsByEmployee: results.map((events, index) => ({
          employee: selectedEmployees[index],
          count: events.length
        }))
      });

      setCalendarEvents(allEvents);
      setCalendarEventsLoading(false);
      setError(null);
      
    } catch (error) {
      logDebug('Error fetching calendar events:', error);
      console.error('Calendar fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch calendar events');
      setCalendarEventsLoading(false);
    }
  }, [selectedEmployees]);

  // Define consistent color scheme for employees
  const getEmployeeColor = (employeeName: string) => {
    const employeeColors: Record<string, { bg: string; border: string }> = {
      'Alex Keal': { bg: '#3b82f6', border: '#2563eb' }, // Blue
      'Mark Richardson': { bg: '#10b981', border: '#059669' }, // Green
      'Mark Nash': { bg: '#f59e0b', border: '#d97706' }, // Amber
      'Mark Nockles': { bg: '#f59e0b', border: '#d97706' }, // Amber (alias for Mark Nash)
      'Richard Booth': { bg: '#8b5cf6', border: '#7c3aed' }, // Purple
      'R Booth': { bg: '#8b5cf6', border: '#7c3aed' }, // Purple (alias for Richard Booth)
      'Mark R': { bg: '#10b981', border: '#059669' }, // Green (alias for Mark Richardson)
      'Mark N': { bg: '#f59e0b', border: '#d97706' }, // Amber (alias for Mark Nash)
    };

    // Default color for unknown employees
    const defaultColor = { bg: '#6b7280', border: '#4b5563' };
    
    return employeeColors[employeeName] || defaultColor;
  };

  // Convert holidays, employee holidays, calendar events, and Moniteye events to FullCalendar events
  useEffect(() => {
    const events: CalendarEvent[] = [];

    // Add public holidays - consistent green color
    holidays.forEach((holiday) => {
      events.push({
        id: `holiday-${holiday.id}`,
        title: `🎉 ${holiday.name}`,
        start: holiday.date,
        backgroundColor: '#16a34a', // Consistent green for all holidays
        borderColor: '#15803d',
        textColor: '#ffffff',
        extendedProps: {
          type: 'public',
          description: holiday.name,
        },
      });
    });

    // Add Moniteye global events - using distinct colors based on event type
    moniteyeEvents.forEach((event) => {
      const getMoniteyeEventStyle = (eventType: string) => {
        switch (eventType) {
          case 'company':
            return { bg: '#1e40af', border: '#1e3a8a' }; // Dark blue
          case 'meeting':
            return { bg: '#059669', border: '#047857' }; // Dark green
          case 'holiday':
            return { bg: '#dc2626', border: '#b91c1c' }; // Red
          case 'announcement':
            return { bg: '#d97706', border: '#b45309' }; // Orange
          default:
            return { bg: '#6b7280', border: '#4b5563' }; // Gray
        }
      };

      const style = getMoniteyeEventStyle(event.event_type);
      const icon = event.event_type === 'company' ? '🏢' :
                   event.event_type === 'meeting' ? '🤝' :
                   event.event_type === 'holiday' ? '🎉' :
                   event.event_type === 'announcement' ? '📢' : '📅';

      events.push({
        id: `moniteye-${event.id}`,
        title: `${icon} ${event.title}`,
        start: event.start_date,
        end: event.all_day ? undefined : event.end_date,
        backgroundColor: style.bg,
        borderColor: style.border,
        textColor: '#ffffff',
        extendedProps: {
          type: 'meeting',
          description: event.description,
          location: event.location,
          eventType: event.event_type,
          moniteyeEvent: true,
          moniteyeEventData: event,
        },
      });
    });

    // Add employee holidays (time off) - using employee-specific colors
    employeeHolidays.forEach((holiday) => {
      if (holiday.approved) {
        const employeeColor = getEmployeeColor(holiday.employeeName);
        
        // Slightly modify color based on holiday type
        let backgroundColor = employeeColor.bg;
        let borderColor = employeeColor.border;
        
        if (holiday.type === 'Sick Leave') {
          backgroundColor = '#ef4444'; // Red for sick leave
          borderColor = '#dc2626';
        }

        events.push({
          id: `employee-holiday-${holiday.id}`,
          title: `🏖️ ${holiday.employeeName} - ${holiday.type}`,
          start: holiday.startDate,
          end: holiday.duration > 1 ? holiday.endDate : undefined,
          backgroundColor,
          borderColor,
          textColor: '#ffffff',
          extendedProps: {
            type: 'employee',
            employeeName: holiday.employeeName,
            description: `${holiday.type}${holiday.reason ? ` - ${holiday.reason}` : ''}`,
            duration: holiday.duration,
            reason: holiday.reason,
          },
        });
      }
    });

    // Add employee calendar events (meetings, appointments, etc.) - using employee-specific colors
    employeeCalendarEvents.forEach((event) => {
      const employeeColor = getEmployeeColor(event.employeeName);
      
      // Use employee-specific colors instead of calendar type colors
      const backgroundColor = employeeColor.bg;
      const borderColor = employeeColor.border;

      const icon = event.visibility === 'private' ? '🔒' : 
                   event.isAllDay ? '📅' : '⏰';

      events.push({
        id: `calendar-event-${event.id}`,
        title: `${icon} ${event.title}`,
        start: event.startDateTime,
        end: event.isAllDay ? undefined : event.endDateTime,
        backgroundColor,
        borderColor,
        textColor: '#ffffff',
        extendedProps: {
          type: event.visibility === 'private' ? 'appointment' : 'meeting',
          employeeName: event.employeeName,
          description: event.description,
          location: event.location,
          calendarType: event.calendarType,
          attendees: event.attendees,
        },
      });
    });

    setCalendarEvents(events);
  }, [holidays, employeeHolidays, employeeCalendarEvents, moniteyeEvents]);

  // Helper function to get upcoming holidays
  const getUpcomingHolidays = () => {
    if (!currentDate) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    return holidays
      .filter(holiday => {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate >= today && holidayDate <= oneYearFromNow;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Helper function to get upcoming employee holidays
  const getUpcomingEmployeeHolidays = () => {
    if (!currentDate) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sixMonthsFromNow = new Date(today);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    return employeeHolidays
      .filter(holiday => {
        const startDate = new Date(holiday.startDate);
        startDate.setHours(0, 0, 0, 0);
        return startDate >= today && startDate <= sixMonthsFromNow && holiday.approved;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  // Helper function to get upcoming calendar events
  const getUpcomingCalendarEvents = () => {
    if (!currentDate) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    return employeeCalendarEvents
      .filter(event => {
        const eventDate = new Date(event.startDateTime);
        return eventDate >= today && eventDate <= sevenDaysFromNow;
      })
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
      .slice(0, 10); // Limit to 10 events
  };

  // Handle event click
  const handleEventClick = (clickInfo: any) => {
    const { event } = clickInfo;
    const props = event.extendedProps;
    
    // Check if this is a Moniteye event
    if (props.moniteyeEvent && props.moniteyeEventData) {
      const shouldEdit = confirm(
        `📅 ${event.title}\n\n` +
        `${props.description ? `📝 ${props.description}\n` : ''}` +
        `${props.location ? `📍 ${props.location}\n` : ''}` +
        `\nClick OK to edit this event, or Cancel to close.`
      );
      
      if (shouldEdit) {
        setEditingEvent(props.moniteyeEventData);
        setIsEventModalOpen(true);
      }
      return;
    }

    // For other events, show info
    let message = `${event.title}\n\n`;
    if (props.type === 'public') {
      message += `Public Holiday: ${props.description}`;
    } else if (props.type === 'employee') {
      message += `Employee: ${props.employeeName}\n`;
      message += `Type: ${props.description}\n`;
      if (props.duration > 1) {
        message += `Duration: ${props.duration} days`;
      }
    } else if (props.type === 'meeting' || props.type === 'appointment') {
      message += `Employee: ${props.employeeName}\n`;
      if (props.description) {
        message += `Description: ${props.description}\n`;
      }
      if (props.location) {
        message += `Location: ${props.location}\n`;
      }
      if (props.attendees && props.attendees.length > 0) {
        message += `Attendees: ${props.attendees.slice(0, 3).join(', ')}${props.attendees.length > 3 ? '...' : ''}`;
      }
    }
    
    alert(message);
  };

  // Handle date click for creating new Moniteye events
  const handleDateClick = (dateInfo: any) => {
    setSelectedDate(dateInfo.dateStr);
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  // Handle employee selection change
  const handleEmployeeSelectionChange = (employeeId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  // Handle disconnect calendar
  const handleDisconnectCalendar = async (employeeId: string) => {
    if (!confirm('Are you sure you want to disconnect this calendar?')) {
      return;
    }
    
    try {
      // TODO: Implement disconnect API endpoint
      console.log('Disconnecting calendar for:', employeeId);
      // For now, just refresh the data
      await handleSyncCalendars();
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
    }
  };

  // Auto-refresh calendar events periodically (every 5 minutes)
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      if (selectedEmployees.length > 0) {
        console.log('🔄 Auto-refreshing calendar events...');
        fetchCalendarEvents();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]); // Remove fetchCalendarEvents from deps to prevent loop

  // Fetch employee calendar events when component is ready or selectedEmployees changes
  useEffect(() => {
    // Only fetch if we have selected employees and employee loading is complete
    if (!employeeLoading && selectedEmployees.length > 0) {
      console.log('📅 Fetching calendar events due to employee change');
      fetchCalendarEvents();
    }
  }, [employeeLoading, selectedEmployees.length]); // Remove fetchCalendarEvents from deps to prevent loop

  // Refetch when showPrivateEvents changes
  useEffect(() => {
    if (!employeeLoading && selectedEmployees.length > 0) {
      console.log('📅 Fetching calendar events due to privacy setting change');
      fetchCalendarEvents();
    }
  }, [showPrivateEvents, employeeLoading]); // Remove fetchCalendarEvents from deps to prevent loop

  // Trigger calendar events refresh when lastRefresh changes
  useEffect(() => {
    if (lastRefresh && selectedEmployees.length > 0) {
      console.log('🔄 Triggering refresh from lastRefresh change');
      fetchCalendarEvents();
    }
  }, [lastRefresh]); // Remove fetchCalendarEvents from deps to prevent loop

  // Log component mounting and state changes for debugging
  useEffect(() => {
    console.log('📅 Calendar component mounted/updated:', {
      currentDate: !!currentDate,
      employeeLoading,
      calendarEventsLoading,
      selectedEmployees: selectedEmployees.length,
      employeeCalendarEvents: employeeCalendarEvents.length,
      calendarEvents: calendarEvents.length
    });
  }, [currentDate, employeeLoading, calendarEventsLoading, selectedEmployees.length, employeeCalendarEvents.length, calendarEvents.length]);

  // Enhanced component initialization with detailed logging
  useEffect(() => {
    logDebug('Component mount useEffect triggered');
    
    // Initialize current date if not set
    if (!currentDate) {
      logDebug('Setting current date to today');
      setCurrentDate(new Date());
    }

    // Set loading to false after initial setup
    logDebug('Setting initial loading to false');
    setLoading(false);

    return () => {
      logDebug('Component unmounting');
    };
  }, []);

  // Enhanced calendar events fetch effect
  useEffect(() => {
    logDebug('Calendar events fetch useEffect triggered', {
      currentDate: currentDate?.toISOString(),
      selectedEmployeesLength: selectedEmployees.length,
      loading
    });

    if (currentDate && !loading) {
      logDebug('Conditions met, calling fetchCalendarEvents');
      fetchCalendarEvents();
    } else {
      logDebug('Conditions not met for fetchCalendarEvents', {
        hasCurrentDate: !!currentDate,
        loading
      });
    }
  }, [currentDate, selectedEmployees]);

  // Enhanced Moniteye events fetch effect
  useEffect(() => {
    logDebug('Moniteye events fetch useEffect triggered');
    
    const fetchMoniteyeEvents = async () => {
      try {
        logDebug('Fetching Moniteye events');
        const response = await fetch('/api/moniteye-events');
        logDebug('Moniteye events response status:', response.status);
        
        if (response.ok) {
          const events = await response.json();
          logDebug('Moniteye events fetched successfully', { count: events.length });
          setMoniteyeEvents(events);
        } else {
          logDebug('Failed to fetch Moniteye events', {
            status: response.status,
            statusText: response.statusText
          });
        }
      } catch (error) {
        logDebug('Error fetching Moniteye events:', error);
        console.error('Error fetching Moniteye events:', error);
      }
    };

    fetchMoniteyeEvents();
  }, []);

  // Fallback useEffect to ensure currentDate gets initialized
  useEffect(() => {
    logDebug('Fallback currentDate useEffect triggered');
    
    const timer = setTimeout(() => {
      if (!currentDate) {
        logDebug('Fallback: setting current date after timeout');
        setCurrentDate(new Date());
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentDate]);

  // Enhanced auto-refresh effect
  useEffect(() => {
    logDebug('Auto-refresh useEffect triggered', { autoRefreshEnabled });
    
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      logDebug('Auto-refresh triggered, fetching calendar events');
      fetchCalendarEvents();
    }, 30000); // Refresh every 30 seconds

    return () => {
      logDebug('Clearing auto-refresh interval');
      clearInterval(interval);
    };
  }, [autoRefreshEnabled]);

  // Enhanced loading condition with detailed logging
  logDebug('Render logic check', {
    loading,
    calendarEventsLoading,
    hasCurrentDate: !!currentDate,
    shouldShowLoading: loading && calendarEventsLoading
  });

  // Show loading state only if data is still loading
  if (loading && calendarEventsLoading) {
    logDebug('Showing loading state');
    return (
      <Layout>
        <div className="flex-1 bg-gray-50 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading calendar...</p>
            <p className="text-sm text-gray-500 mt-2">Fetching calendar data...</p>
            <p className="text-xs text-gray-400 mt-1">Debug: loading={loading.toString()}, calendarEventsLoading={calendarEventsLoading.toString()}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentDate) {
    logDebug('No current date set, showing date loading state');
    return (
      <Layout>
        <div className="flex-1 bg-gray-50 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Initializing calendar...</p>
            <p className="text-sm text-gray-500 mt-2">Setting up date...</p>
          </div>
        </div>
      </Layout>
    );
  }

  logDebug('Rendering main calendar component', {
    currentDate: currentDate.toISOString(),
    calendarEventsCount: calendarEvents.length,
    moniteyeEventsCount: moniteyeEvents.length,
    selectedEmployeesCount: selectedEmployees.length,
    error
  });

  return (
    <Layout>
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6">
          <div className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Team Calendar</h1>
            <p className="text-gray-600 mt-1">View and manage team schedules, holidays, and employee calendars</p>
          </div>

          {/* Alert Messages */}
          {alertMessage && (
            <div className={`mb-6 p-4 rounded-lg border ${
              alertMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              alertMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">
                    {alertMessage.type === 'success' ? '✅' :
                     alertMessage.type === 'error' ? '❌' : 'ℹ️'}
                  </span>
                  <span className="font-medium">{alertMessage.message}</span>
                </div>
                <button 
                  onClick={() => setAlertMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              {alertMessage.type === 'error' && (
                <div className="mt-2 text-sm opacity-80">
                  💡 Try clearing your browser cache or using a different browser if the issue persists.
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Calendar */}
            <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full mr-1"></div>
                    <span>Holidays</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                    <span>Alex Keal</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                    <span>Mark Richardson</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mr-1"></div>
                    <span>Mark Nash</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                    <span>Richard Booth</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                    <span>Sick Leave</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-800 rounded-full mr-1"></div>
                    <span>Moniteye Events</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDate(new Date().toISOString().split('T')[0]);
                      setEditingEvent(null);
                      setIsEventModalOpen(true);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    ➕ Add Event
                  </button>
                  <button
                    onClick={handleSyncCalendars}
                    disabled={calendarEventsLoading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    {calendarEventsLoading ? 'Syncing...' : '🔄 Sync'}
                  </button>
                </div>
              </div>

              {/* FullCalendar */}
              <div className="calendar-container">
                <style jsx global>{`
                  .fc {
                    font-family: inherit;
                  }
                  .fc-theme-standard .fc-popover {
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                  }
                  .fc-theme-standard .fc-popover-header {
                    background: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                  }
                  .fc-button-primary {
                    background-color: #3b82f6 !important;
                    border-color: #3b82f6 !important;
                    color: white !important;
                  }
                  .fc-button-primary:hover {
                    background-color: #2563eb !important;
                    border-color: #2563eb !important;
                  }
                  .fc-button-primary:focus {
                    box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25) !important;
                  }
                  .fc-today-button:disabled {
                    background-color: #6b7280 !important;
                    border-color: #6b7280 !important;
                  }
                  .fc-day-today {
                    background-color: #dbeafe !important;
                  }
                  .fc-event {
                    cursor: pointer;
                    font-size: 0.75rem;
                    border-radius: 4px;
                    padding: 2px 4px;
                  }
                  .fc-event:hover {
                    opacity: 0.8;
                  }
                  .fc-daygrid-event {
                    margin-bottom: 1px;
                  }
                  .fc-toolbar-title {
                    color: #1f2937;
                    font-weight: 600;
                  }
                  .fc-col-header-cell {
                    background-color: #f9fafb;
                    font-weight: 500;
                    color: #4b5563;
                  }
                  .fc-scrollgrid {
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    overflow: hidden;
                  }
                `}</style>
                
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  events={calendarEvents}
                  eventClick={handleEventClick}
                  dateClick={handleDateClick}
                  selectable={true}
                  height="auto"
                  firstDay={0}
                  weekends={true}
                  eventDisplay="block"
                  dayMaxEvents={4}
                  moreLinkClick="popover"
                  eventMouseEnter={(info) => {
                    info.el.style.transform = 'scale(1.02)';
                    info.el.style.zIndex = '1000';
                  }}
                  eventMouseLeave={(info) => {
                    info.el.style.transform = 'scale(1)';
                    info.el.style.zIndex = 'auto';
                  }}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-80 space-y-6">
              {/* Employee Calendar Subscriptions */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  👥 Employee Calendars
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {employeeCalendars.filter(cal => cal.isActive).length} connected
                  </span>
                </h3>
                
                <div className="space-y-3 mb-4">
                  {employeeCalendars.map((calendar) => (
                    <div key={calendar.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{calendar.employeeName}</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              Google Calendar
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{calendar.email}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {calendar.isActive ? (
                          <>
                            <span className="flex items-center text-xs text-green-600">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                              Connected
                            </span>
                            <button
                              onClick={() => handleDisconnectCalendar(calendar.employeeId)}
                              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex items-center text-xs text-gray-500">
                              <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                              Not Connected
                            </span>
                            <button
                              onClick={() => handleConnectCalendar(calendar.employeeId)}
                              disabled={connectingEmployees.has(calendar.employeeId)}
                              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                            >
                              {connectingEmployees.has(calendar.employeeId) ? 'Connecting...' : 'Connect'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showPrivateEvents}
                        onChange={(e) => setShowPrivateEvents(e.target.checked)}
                        className="rounded"
                      />
                      <span>Show private events</span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={autoRefreshEnabled}
                          onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                          className="rounded"
                        />
                        <span>Auto-refresh</span>
                      </label>
                      <div className="text-xs text-gray-500">
                        Last refresh: {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleSyncCalendars}
                      disabled={calendarEventsLoading}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      <span>🔄</span>
                      <span>{calendarEventsLoading ? 'Syncing...' : 'Sync All'}</span>
                    </button>
                    
                    <div className="text-xs text-gray-500">
                      {employeeCalendars.filter(cal => cal.isActive).length} of {employeeCalendars.length} calendars connected
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Calendar Events */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold mb-4">📅 Upcoming Events</h3>
                {calendarEventsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading events...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {getUpcomingCalendarEvents().length > 0 ? (
                      getUpcomingCalendarEvents().map((event) => {
                        const eventDate = new Date(event.startDateTime);
                        const today = new Date();
                        const isToday = eventDate.toDateString() === today.toDateString();
                        
                        return (
                          <div key={event.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                            <div className="font-medium text-sm">{event.title}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              👤 {event.employeeName}
                            </div>
                            <div className="text-xs text-gray-600">
                              📅 {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              {isToday && ' - Today!'}
                            </div>
                            {event.location && (
                              <div className="text-xs text-gray-500 mt-1">
                                📍 {event.location}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No upcoming events in the next 7 days
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Upcoming Holidays */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold mb-4">🎉 Upcoming Public Holidays</h3>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading holidays...</p>
                  </div>
                ) : (
                  <div 
                    className="space-y-3 max-h-64 overflow-y-auto pr-2" 
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#d1d5db #f9fafb'
                    }}
                  >
                    {getUpcomingHolidays().length > 0 ? (
                      getUpcomingHolidays().slice(0, 5).map((holiday) => {
                        const holidayDate = new Date(holiday.date);
                        const isToday = currentDate ? holidayDate.toDateString() === currentDate.toDateString() : false;
                        const daysDiff = currentDate ? Math.ceil((holidayDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)) : 0;
                        
                        return (
                          <div key={holiday.id} className={`flex items-center p-3 rounded-lg border-l-4 ${
                            holiday.country === 'US' ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'
                          }`}>
                            <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${
                              holiday.country === 'US' ? 'bg-red-500' : 'bg-green-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{holiday.name}</div>
                              <div className="text-xs text-gray-600">
                                {holidayDate.toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                                {isToday && ' - Today!'}
                                {!isToday && daysDiff > 0 && ` - in ${daysDiff} day${daysDiff === 1 ? '' : 's'}`}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm">No upcoming holidays</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Team Holidays & Leave */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  🏖️ Team Time Off
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {getUpcomingEmployeeHolidays().length}
                  </span>
                </h3>
                {employeeLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading team holidays...</p>
                  </div>
                ) : (
                  <div 
                    className="space-y-3 max-h-64 overflow-y-auto pr-2" 
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#d1d5db #f9fafb'
                    }}
                  >
                    {getUpcomingEmployeeHolidays().length > 0 ? (
                      getUpcomingEmployeeHolidays().slice(0, 5).map((holiday) => {
                        const startDate = new Date(holiday.startDate);
                        const isToday = currentDate ? startDate.toDateString() === currentDate.toDateString() : false;
                        const daysDiff = currentDate ? Math.ceil((startDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)) : 0;
                        
                        return (
                          <div key={holiday.id} className={`p-3 rounded-lg border-l-4 shadow-sm ${
                            holiday.type === 'Holiday' ? 'bg-blue-50 border-blue-400' : 
                            holiday.type === 'Sick Leave' ? 'bg-red-50 border-red-400' : 
                            'bg-gray-50 border-gray-400'
                          }`}>
                            <div className="flex items-start">
                              <div className={`w-3 h-3 rounded-full mr-3 mt-1 flex-shrink-0 ${
                                holiday.type === 'Holiday' ? 'bg-blue-500' : 
                                holiday.type === 'Sick Leave' ? 'bg-red-500' : 
                                'bg-gray-500'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{holiday.employeeName}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  📅 {holiday.dateRange} • {holiday.type}
                                  {holiday.duration > 1 && ` • ${holiday.duration} day${holiday.duration === 1 ? '' : 's'}`}
                                </div>
                                {holiday.reason && (
                                  <div className="text-xs text-gray-500 mt-1 bg-white/50 px-2 py-1 rounded">
                                    💬 {holiday.reason}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 mt-1 font-medium">
                                  {isToday && '🚀 Starting today!'}
                                  {!isToday && daysDiff > 0 && `⏰ Starting in ${daysDiff} day${daysDiff === 1 ? '' : 's'}`}
                                  {!isToday && daysDiff === 0 && '🚀 Starting today'}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 bg-white rounded-lg text-center">
                        <div className="text-gray-400 text-4xl mb-2">📅</div>
                        <p className="text-gray-500 text-sm font-medium">No team holidays scheduled</p>
                        <p className="text-gray-400 text-xs mt-1">for the next 6 months</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Moniteye Event Modal */}
      <MoniteyeEventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
          setSelectedDate('');
        }}
        onSave={handleSaveMoniteyeEvent}
        editEvent={editingEvent}
        selectedDate={selectedDate}
      />
    </Layout>
  );
} 