import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { authenticate } from '../eventazon/lib/authMiddleware';

interface AuthenticatedRequest extends NextApiRequest {
  user?: { id: number; email: string };
}

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Davidelias2*',
  database: 'eventazon',
};

async function queryWithTypes<T>(connection: mysql.Connection, query: string, values?: any[]): Promise<T> {
  const [results] = await connection.execute(query, values);
  return results as T;
}

const fetchInformation: NextApiHandler = authenticate(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    if (req.method === 'GET') {
      console.log('Fetching events');
      const rows = await queryWithTypes<RowDataPacket[]>(
        connection,
        'SELECT event_id, name, date, time, description, created_at FROM events'
      );
      res.status(200).json({ events: rows });
    } else if (req.method === 'POST') {
      console.log('Creating a new event');
      const { name, date, time, description } = req.body;
      if (!name || !date || !time) {
        console.error('Validation failed: Missing name, date, or time');
        return res.status(400).json({ error: 'Name, date, and time are required' });
      }

      const query = 'INSERT INTO events (name, date, time, description) VALUES (?, ?, ?, ?)';
      const values = [name, date, time, description];
      const result = await queryWithTypes<ResultSetHeader>(connection, query, values);

      console.log('New event created with event ID:', result.insertId);
      res.status(201).json({ message: 'New event created successfully', eventId: result.insertId });
    } else if (req.method === 'PUT') {
      console.log('Updating an event');

      const { event_id, name, date, time, description } = req.body;
      if (!event_id || !name || !date || !time) {
        console.error('Validation failed: Missing event_id, name, date, or time');
        return res.status(400).json({ error: 'Event ID, name, date, and time are required' });
      }

      const query = `
        UPDATE events 
        SET name = ?, date = ?, time = ?, description = ? 
        WHERE event_id = ?`;
      const values = [name, date, time, description, event_id];
      const result = await queryWithTypes<ResultSetHeader>(connection, query, values);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      console.log('Event updated successfully');
      res.status(200).json({ message: 'Event updated successfully' });
    } else if (req.method === 'DELETE') {
      console.log('Deleting an event');

      const { event_id } = req.query;

      if (!event_id) {
        console.error('Validation failed: Missing event_id');
        return res.status(400).json({ error: 'Event ID is required' });
      }

      const query = 'DELETE FROM events WHERE event_id = ?';
      const result = await queryWithTypes<ResultSetHeader>(connection, query, [event_id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      console.log('Event deleted successfully');
      res.status(200).json({ message: 'Event deleted successfully' });
    } else {
      console.error('Method not allowed for this request');
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error', details: (error as Error).message });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// fetch

export default fetchInformation;
