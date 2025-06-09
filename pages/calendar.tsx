import React, { useState, useEffect } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Layout from "../components/Layout";

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

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    type: 'public' | 'employee';
    description?: string;
    employeeName?: string;
    duration?: number;
    reason?: string;
  };
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [employeeHolidays, setEmployeeHolidays] = useState<EmployeeHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  
  // Initialize date only on client-side to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

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

  // Convert holidays and employee holidays to FullCalendar events
  useEffect(() => {
    const events: CalendarEvent[] = [];

    // Add public holidays
    holidays.forEach((holiday) => {
      events.push({
        id: `holiday-${holiday.id}`,
        title: `🎉 ${holiday.name}`,
        start: holiday.date,
        backgroundColor: '#10b981',
        borderColor: '#059669',
        textColor: '#ffffff',
        extendedProps: {
          type: 'public',
          description: holiday.name,
        },
      });
    });

    // Add employee holidays
    employeeHolidays.forEach((holiday) => {
      if (holiday.approved) {
        const backgroundColor = 
          holiday.type === 'Holiday' ? '#3b82f6' : 
          holiday.type === 'Sick Leave' ? '#ef4444' : 
          holiday.type === 'Meeting' ? '#8b5cf6' : '#6b7280';
        
        const borderColor = 
          holiday.type === 'Holiday' ? '#2563eb' : 
          holiday.type === 'Sick Leave' ? '#dc2626' : 
          holiday.type === 'Meeting' ? '#7c3aed' : '#4b5563';

        events.push({
          id: `employee-${holiday.id}`,
          title: `👤 ${holiday.employeeName}`,
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

    setCalendarEvents(events);
  }, [holidays, employeeHolidays]);

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

  // Handle event click
  const handleEventClick = (clickInfo: any) => {
    const { event } = clickInfo;
    const props = event.extendedProps;
    
    let message = `${event.title}\n\n`;
    if (props.type === 'public') {
      message += `Public Holiday: ${props.description}`;
    } else {
      message += `Employee: ${props.employeeName}\n`;
      message += `Type: ${props.description}\n`;
      if (props.duration > 1) {
        message += `Duration: ${props.duration} days`;
      }
    }
    
    alert(message);
  };

  // Show loading state if date hasn't been initialized yet
  if (!currentDate) {
    return (
      <Layout>
        <div className="flex-1 bg-gray-50 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading calendar...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6">
          <div className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">View and manage your schedule and events</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Calendar */}
            <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                  <span>Public Holiday</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                  <span>Team Holiday</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                  <span>Sick Leave</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                  <span>Meeting</span>
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
                  height="auto"
                  firstDay={0}
                  weekends={true}
                  eventDisplay="block"
                  dayMaxEvents={3}
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

            {/* Sidebar with Holiday Lists */}
            <div className="w-full lg:w-80 space-y-6">
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
                    className="space-y-3 max-h-96 overflow-y-auto pr-2" 
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#d1d5db #f9fafb'
                    }}
                  >
                    {getUpcomingHolidays().length > 0 ? (
                      getUpcomingHolidays().map((holiday) => {
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
                        <p className="text-gray-500 text-sm">No upcoming holidays in the next year</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Team Holidays & Leave */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  Team Holidays & Leave 
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
                    className="space-y-3 max-h-96 overflow-y-auto pr-2 border border-gray-100 rounded-lg p-2" 
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#d1d5db #f9fafb',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    {getUpcomingEmployeeHolidays().length > 0 ? (
                      getUpcomingEmployeeHolidays().map((holiday) => {
                        const startDate = new Date(holiday.startDate);
                        const isToday = currentDate ? startDate.toDateString() === currentDate.toDateString() : false;
                        const daysDiff = currentDate ? Math.ceil((startDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)) : 0;
                        
                        return (
                          <div key={holiday.id} className={`p-3 rounded-lg border-l-4 shadow-sm ${
                            holiday.type === 'Holiday' ? 'bg-blue-50 border-blue-400' : 
                            holiday.type === 'Sick Leave' ? 'bg-red-50 border-red-400' : 
                            holiday.type === 'Meeting' ? 'bg-purple-50 border-purple-400' :
                            'bg-gray-50 border-gray-400'
                          }`}>
                            <div className="flex items-start">
                              <div className={`w-3 h-3 rounded-full mr-3 mt-1 flex-shrink-0 ${
                                holiday.type === 'Holiday' ? 'bg-blue-500' : 
                                holiday.type === 'Sick Leave' ? 'bg-red-500' : 
                                holiday.type === 'Meeting' ? 'bg-purple-500' :
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
    </Layout>
  );
} 