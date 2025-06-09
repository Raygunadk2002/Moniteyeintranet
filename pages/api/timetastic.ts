
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const TIMETASTIC_API_KEY = "acf87e83-3e43-42df-b7d6-861a69f90414";
  
  try {
    // Get current year, previous year, and next year for comprehensive holiday data
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const nextYear = currentYear + 1;
    
    // Fetch public holidays for three years
    const [previousYearResponse, currentYearResponse, nextYearResponse] = await Promise.all([
      fetch(`https://app.timetastic.co.uk/api/publicholidays?year=${previousYear}`, {
        headers: {
          "Authorization": `Bearer ${TIMETASTIC_API_KEY}`,
          "Content-Type": "application/json"
        }
      }),
      fetch(`https://app.timetastic.co.uk/api/publicholidays?year=${currentYear}`, {
        headers: {
          "Authorization": `Bearer ${TIMETASTIC_API_KEY}`,
          "Content-Type": "application/json"
        }
      }),
      fetch(`https://app.timetastic.co.uk/api/publicholidays?year=${nextYear}`, {
        headers: {
          "Authorization": `Bearer ${TIMETASTIC_API_KEY}`,
          "Content-Type": "application/json"
        }
      })
    ]);

    const allHolidays = [];
    
    if (previousYearResponse.ok) {
      const previousYearData = await previousYearResponse.json();
      if (Array.isArray(previousYearData)) {
        allHolidays.push(...previousYearData);
      }
    }
    
    if (currentYearResponse.ok) {
      const currentYearData = await currentYearResponse.json();
      if (Array.isArray(currentYearData)) {
        allHolidays.push(...currentYearData);
      }
    }
    
    if (nextYearResponse.ok) {
      const nextYearData = await nextYearResponse.json();
      if (Array.isArray(nextYearData)) {
        allHolidays.push(...nextYearData);
      }
    }

    // If API calls failed, return enhanced mock data
    if (allHolidays.length === 0) {
      const mockData = {
        holidays: [
          { 
            id: 1,
            name: "New Year's Day", 
            date: "2024-01-01",
            country: "UK",
            type: "public"
          },
          {
            id: 2,
            name: "Martin Luther King Jr. Day",
            date: "2024-01-15",
            country: "US",
            type: "public"
          },
          {
            id: 3,
            name: "Presidents Day",
            date: "2024-02-19",
            country: "US",
            type: "public"
          },
          {
            id: 4,
            name: "Easter Sunday",
            date: "2024-03-31",
            country: "UK",
            type: "public"
          },
          {
            id: 5,
            name: "Easter Monday",
            date: "2024-04-01",
            country: "UK",
            type: "public"
          },
          {
            id: 6,
            name: "Memorial Day",
            date: "2024-05-27",
            country: "US",
            type: "public"
          },
          {
            id: 7,
            name: "Independence Day",
            date: "2024-07-04",
            country: "US",
            type: "public"
          },
          {
            id: 8,
            name: "Summer Bank Holiday",
            date: "2024-08-26",
            country: "UK",
            type: "public"
          },
          {
            id: 9,
            name: "Labor Day",
            date: "2024-09-02",
            country: "US",
            type: "public"
          },
          {
            id: 10,
            name: "Thanksgiving",
            date: "2024-11-28",
            country: "US",
            type: "public"
          },
          {
            id: 11,
            name: "Christmas Day",
            date: "2024-12-25",
            country: "UK",
            type: "public"
          },
          {
            id: 12,
            name: "Boxing Day",
            date: "2024-12-26",
            country: "UK",
            type: "public"
          }
        ]
      };
      return res.status(200).json(mockData);
    }

    // Transform API response to consistent format
    const formattedHolidays = allHolidays.map((holiday: any, index: number) => ({
      id: holiday.id || index + 1,
      name: holiday.name,
      date: holiday.date ? holiday.date.split('T')[0] : null, // Extract date part only
      country: holiday.countryCode === 'GB-EAW' ? 'UK' : 'UK',
      type: 'public'
    })).filter(holiday => holiday.date); // Remove any entries without valid dates



    res.status(200).json({ holidays: formattedHolidays });
  } catch (error) {
    console.error('Timetastic API error:', error);
    
    // Return fallback data if API fails
    const fallbackData = {
      holidays: [
        { 
          id: 1,
          name: "Christmas Day", 
          date: "2024-12-25",
          country: "UK",
          type: "public"
        },
        {
          id: 2,
          name: "Boxing Day",
          date: "2024-12-26",
          country: "UK",
          type: "public"
        },
        {
          id: 3,
          name: "New Year's Day",
          date: "2025-01-01",
          country: "UK",
          type: "public"
        }
      ]
    };
    res.status(200).json(fallbackData);
  }
}
