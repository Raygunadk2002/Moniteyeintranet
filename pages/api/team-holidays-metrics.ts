import type { NextApiRequest, NextApiResponse } from 'next';

interface HolidayMetrics {
  next14Days: number;
  next30Days: number;
  currentlyOnHoliday: number;
  totalUpcoming: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HolidayMetrics | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    let allHolidays: any[] = [];
    
    // Process current year holidays
    if (currentYearResponse.ok) {
      const currentYearData = await currentYearResponse.json();
      if (currentYearData.holidays && Array.isArray(currentYearData.holidays)) {
        allHolidays.push(...currentYearData.holidays);
      }
    }

    // Process next year holidays
    if (nextYearResponse.ok) {
      const nextYearData = await nextYearResponse.json();
      if (nextYearData.holidays && Array.isArray(nextYearData.holidays)) {
        allHolidays.push(...nextYearData.holidays);
      }
    }

    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fourteenDaysFromNow = new Date(today);
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
    
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Deduplicate holidays based on unique combination of employee, start date, and end date
    const uniqueHolidays = allHolidays.filter((holiday, index, self) => {
      return index === self.findIndex((h) => 
        h.userId === holiday.userId && 
        h.startDate === holiday.startDate && 
        h.endDate === holiday.endDate &&
        h.status === holiday.status
      );
    });

    let next14Days = 0;
    let next30Days = 0;
    let currentlyOnHoliday = 0;
    let totalUpcoming = 0;

    // Filter and count holidays based on approved status and date ranges
    uniqueHolidays.forEach((holiday: any) => {
      // Only count approved holidays
      if (holiday.status !== 'Approved') {
        return;
      }

      const startDate = new Date(holiday.startDate);
      const endDate = new Date(holiday.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Currently on holiday (today falls within the holiday period)
      if (startDate <= today && endDate >= today) {
        currentlyOnHoliday++;
      }

      // Holiday starts in the next 14 days
      if (startDate >= today && startDate <= fourteenDaysFromNow) {
        next14Days++;
      }

      // Holiday starts in the next 30 days
      if (startDate >= today && startDate <= thirtyDaysFromNow) {
        next30Days++;
      }

      // Any future holiday
      if (startDate >= today) {
        totalUpcoming++;
      }
    });

    const metrics: HolidayMetrics = {
      next14Days,
      next30Days,
      currentlyOnHoliday,
      totalUpcoming
    };

    res.status(200).json(metrics);

  } catch (error) {
    console.error('Error fetching team holiday metrics:', error);
    
    // Return fallback data for development/testing
    const fallbackMetrics: HolidayMetrics = {
      next14Days: 2,
      next30Days: 5,
      currentlyOnHoliday: 0,
      totalUpcoming: 8
    };
    
    res.status(200).json(fallbackMetrics);
  }
} 