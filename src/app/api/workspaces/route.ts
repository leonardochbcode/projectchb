import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Workspace } from '@/lib/types';

export async function GET() {
  try {
    const dbClient = await pool.connect();
    const result = await dbClient.query('SELECT * FROM workspaces');
    dbClient.release();

    const workspaces = result.rows.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description,
        clientId: w.client_id,
    }));

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, clientId }: Partial<Workspace> = await request.json();

    const dbClient = await pool.connect();
    const result = await dbClient.query(
      'INSERT INTO workspaces (id, name, description, client_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [`ws-${Date.now()}`, name, description, clientId]
    );
    const createdWorkspace = result.rows[0];
    dbClient.release();

    const responseWorkspace = {
        id: createdWorkspace.id,
        name: createdWorkspace.name,
        description: createdWorkspace.description,
        clientId: createdWorkspace.client_id,
    };

    return NextResponse.json(responseWorkspace, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
