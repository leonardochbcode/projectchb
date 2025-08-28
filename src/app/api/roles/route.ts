import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Role } from '@/lib/types';

export async function GET() {
  try {
    const dbClient = await pool.connect();
    const result = await dbClient.query('SELECT * FROM roles');
    dbClient.release();
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, permissions }: Partial<Role> = await request.json();

    const dbClient = await pool.connect();
    const result = await dbClient.query(
      'INSERT INTO roles (id, name, permissions) VALUES ($1, $2, $3) RETURNING *',
      [`role-${Date.now()}`, name, permissions]
    );
    const createdRole = result.rows[0];
    dbClient.release();

    return NextResponse.json(createdRole, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
