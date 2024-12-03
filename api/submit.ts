// pages/api/submit.ts

import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Davidelias2*',
  database: 'eventazon',
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { name, date, time, description } = req.body;

    if (!name || !date || !time) {
      return res.status(400).json({ error: 'Name, date, and time are required' });
    }

    try {
      const connection = await mysql.createConnection(dbConfig);

      await connection.query(
        'INSERT INTO events (name, date, time, description) VALUES (?, ?, ?, ?)',
        [name, date, time, description]
      );

      await connection.end();

      res.status(200).json({ message: 'Event created successfully' });
    } catch (error) {
      console.error('Database error:', error);

      if (error instanceof Error) {
        res.status(500).json({ error: 'Database error', details: error.message });
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        res.status(500).json({ error: 'Database error', details: (error as any).message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
