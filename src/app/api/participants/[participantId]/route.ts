import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Participant } from '@/lib/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params;
  try {
    const { name, email, roleId, avatar }: Partial<Participant> = await request.json();

    const dbClient = await pool.connect();
    const result = await dbClient.query(
      'UPDATE participants SET name = $1, email = $2, role_id = $3, avatar = $4 WHERE id = $5 RETURNING id, name, email, role_id, avatar',
      [name, email, roleId, avatar, participantId]
    );
    const updatedParticipant = result.rows[0];
    dbClient.release();

    if (!updatedParticipant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const responseParticipant = {
        id: updatedParticipant.id,
        name: updatedParticipant.name,
        email: updatedParticipant.email,
        roleId: updatedParticipant.role_id,
        avatar: updatedParticipant.avatar,
    };

    return NextResponse.json(responseParticipant);
  } catch (error) {
    console.error(`Error updating participant ${participantId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params;
  try {
    const dbClient = await pool.connect();
    await dbClient.query('DELETE FROM participants WHERE id = $1', [participantId]);
    dbClient.release();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting participant ${participantId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
