import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Davidelias2*',
  database: process.env.DB_DATABASE || 'eventazon',
};

const SECRET_KEY = process.env.JWT_SECRET || '90ddbe32f47cff6f4f0b7bfa47a42fbbe359bec60f2577579a73997388415bc7';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
      const connection = await mysql.createConnection(dbConfig);

      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT id, password_hash FROM users WHERE email = ?',
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const user = rows[0];

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign({ id: user.id, email }, SECRET_KEY, { expiresIn: '1h' });

      connection.end();

      return res.status(200).json({ message: 'Sign-in successful!', token });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Sign-in failed.' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed.' });
  }
}
