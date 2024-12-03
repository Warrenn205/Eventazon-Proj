import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Davidelias2*',
  database: process.env.DB_DATABASE || 'eventazon',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { firstName, lastName, email, password } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
      const connection = await mysql.createConnection(dbConfig);

      const [existingUsers] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({ error: 'Email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await connection.execute(
        'INSERT INTO users (firstName, lastName, email, password_hash) VALUES (?, ?, ?, ?)',
        [firstName, lastName, email, hashedPassword]
      ) as [ResultSetHeader, any[]]; 

      console.log('User registered successfully with ID:', result.insertId);

      await connection.end();
      res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
      console.error('Error during user registration:', error);
      res.status(500).json({ error: 'User registration failed.' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed.' });
  }
}
