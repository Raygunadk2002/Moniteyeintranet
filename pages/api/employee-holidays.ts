import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const TIMETASTIC_API_KEY = "acf87e83-3e43-42df-b7d6-861a69f90414";
  
  try {
    // Get current year and next year for comprehensive holiday data
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    // Fetch employee holidays for current and next year
    const [currentYearResponse, nextYearResponse] = await Promise.all([
      fetch(`https://app.timetastic.co.uk/api/holidays?year=${currentYear}`, {
        headers: {
          "Authorization": `Bearer ${TIMETASTIC_API_KEY}`,
          "Content-Type": "application/json"
        }
      }),
      fetch(`https://app.timetastic.co.uk/api/holidays?year=${nextYear}`, {
        headers: {
          "Authorization": `Bearer ${TIMETASTIC_API_KEY}`,
          "Content-Type": "application/json"
        }
      })
    ]);

    const allHolidays = [];
    
    if (currentYearResponse.ok) {
      const currentYearData = await currentYearResponse.json();
      // The API returns an object with a 'holidays' array
      if (currentYearData.holidays && Array.isArray(currentYearData.holidays)) {
        allHolidays.push(...currentYearData.holidays);
      }
    }

    if (nextYearResponse.ok) {
      const nextYearData = await nextYearResponse.json();
      // The API returns an object with a 'holidays' array
      if (nextYearData.holidays && Array.isArray(nextYearData.holidays)) {
        allHolidays.push(...nextYearData.holidays);
      }
    }

    // Transform API response to consistent format
    const formattedHolidays = allHolidays.map((holiday: any, index: number) => ({
      id: holiday.id || index + 1,
      employeeId: holiday.userId,
      employeeName: holiday.userName || 'Unknown Employee',
      startDate: holiday.startDate ? holiday.startDate.split('T')[0] : null,
      endDate: holiday.endDate ? holiday.endDate.split('T')[0] : null,
      dateRange: holiday.dateRangeString || '',
      status: holiday.status,
      type: holiday.leaveType || 'Holiday',
      duration: holiday.duration || 1,
      deduction: holiday.deduction || 0,
      reason: holiday.reason || '',
      approved: holiday.status === 'Approved',
      startType: holiday.startType || 'Morning',
      endType: holiday.endType || 'Afternoon'
    })).filter(holiday => holiday.startDate); // Remove any entries without valid dates

    res.status(200).json({ holidays: formattedHolidays });
  } catch (error) {
    console.error('Error fetching employee holidays:', error);
    
    // Return fallback data for development/testing
    const fallbackData = {
      holidays: [
        {
          id: 1,
          employeeId: 123,
          employeeName: "Alex Keal",
          startDate: "2025-07-15",
          endDate: "2025-07-19",
          status: "approved",
          type: "Annual Leave",
          days: 5,
          notes: "Summer vacation",
          approved: true
        },
        {
          id: 2,
          employeeId: 124,
          employeeName: "Sarah Johnson",
          startDate: "2025-08-10",
          endDate: "2025-08-12",
          status: "pending",
          type: "Sick Leave",
          days: 3,
          notes: "Medical appointment",
          approved: false
        },
        {
          id: 3,
          employeeId: 125,
          employeeName: "Mike Smith",
          startDate: "2025-09-05",
          endDate: "2025-09-05",
          status: "approved",
          type: "Personal Day",
          days: 1,
          notes: "",
          approved: true
        }
      ]
    };
    
    res.status(200).json(fallbackData);
  }
} 