import { createConnection } from '@./../../lib/db';
import { NextResponse } from 'next/server';
import { Connection, RowDataPacket } from 'mysql2/promise';

export async function GET(): Promise<NextResponse> {
  try {
    const db: Connection = await createConnection();
    const sql = 'SELECT * FROM posts'; 
    const [posts]: [RowDataPacket[], any[]] = await db.query(sql); 

    return NextResponse.json({ posts });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Database error:', error.message);
      return NextResponse.json({ error: error.message });
    } else {
      console.error('Unknown error occurred:', error);
      return NextResponse.json({ error: 'An unknown error occurred' });
    }
  }
}
