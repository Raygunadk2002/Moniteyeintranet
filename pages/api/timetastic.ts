
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const TIMETASTIC_API_KEY = process.env.TIMETASTIC_API_KEY;
  const response = await fetch("https://app.timetastic.co.uk/api/v2/holidays/upcoming", {
    headers: {
      "Authorization": `Bearer ${TIMETASTIC_API_KEY}`
    }
  });

  if (!response.ok) {
    return res.status(response.status).json({ error: "Failed to fetch from Timetastic" });
  }

  const data = await response.json();
  res.status(200).json(data);
}
