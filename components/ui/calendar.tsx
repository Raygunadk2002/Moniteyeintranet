import React from 'react';

export function Calendar() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="p-2"></div>);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate();
    days.push(
      <div 
        key={day} 
        className={`p-2 text-center cursor-pointer hover:bg-blue-100 rounded ${
          isToday ? 'bg-blue-500 text-white' : ''
        }`}
      >
        {day}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <div className="text-center font-bold mb-4">
        {monthNames[currentMonth]} {currentYear}
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm">
        <div className="p-2 text-center font-semibold">Sun</div>
        <div className="p-2 text-center font-semibold">Mon</div>
        <div className="p-2 text-center font-semibold">Tue</div>
        <div className="p-2 text-center font-semibold">Wed</div>
        <div className="p-2 text-center font-semibold">Thu</div>
        <div className="p-2 text-center font-semibold">Fri</div>
        <div className="p-2 text-center font-semibold">Sat</div>
        {days}
      </div>
    </div>
  );
} 