import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Workspace } from '@/lib/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  try {
    const { name, description, clientId }: Partial<Workspace> = await request.json();

    const dbClient = await pool.connect();
    const result = await dbClient.query(
      'UPDATE workspaces SET name = $1, description = $2, client_id = $3 WHERE id = $4 RETURNING *',
      [name, description, clientId, workspaceId]
    );
    const updatedWorkspace = result.rows[0];
    dbClient.release();

    if (!updatedWorkspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const responseWorkspace = {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        description: updatedWorkspace.description,
        clientId: updatedWorkspace.client_id,
    };

    return NextResponse.json(responseWorkspace);
  } catch (error) {
    console.error(`Error updating workspace ${workspaceId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  try {
    const dbClient = await pool.connect();
    await dbClient.query('DELETE FROM workspaces WHERE id = $1', [workspaceId]);
    dbClient.release();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting workspace ${workspaceId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
