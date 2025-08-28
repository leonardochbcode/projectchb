import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Role } from '@/lib/types';

export async function PUT(
  request: Request,
  { params }: { params: { roleId: string } }
) {
  const { roleId } = params;
  try {
    const { name, permissions }: Partial<Role> = await request.json();

    const dbClient = await pool.connect();
    const result = await dbClient.query(
      'UPDATE roles SET name = $1, permissions = $2 WHERE id = $3 RETURNING *',
      [name, permissions, roleId]
    );
    const updatedRole = result.rows[0];
    dbClient.release();

    if (!updatedRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error(`Error updating role ${roleId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { roleId: string } }
) {
  const { roleId } = params;
  try {
    const dbClient = await pool.connect();
    await dbClient.query('DELETE FROM roles WHERE id = $1', [roleId]);
    dbClient.release();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting role ${roleId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
