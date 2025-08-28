import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Participant } from '@/lib/types';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const dbClient = await pool.connect();
    const result = await dbClient.query('SELECT id, name, email, role_id, avatar FROM participants');
    dbClient.release();

    const participants = result.rows.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      roleId: p.role_id,
      avatar: p.avatar,
    }));

    return NextResponse.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, roleId, avatar, password }: Partial<Participant> = await request.json();
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const dbClient = await pool.connect();
    const result = await dbClient.query(
      'INSERT INTO participants (id, name, email, role_id, avatar, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role_id, avatar',
      [`user-${Date.now()}`, name, email, roleId, avatar, hashedPassword]
    );
    const createdParticipant = result.rows[0];
    dbClient.release();

    const responseParticipant = {
        id: createdParticipant.id,
        name: createdParticipant.name,
        email: createdParticipant.email,
        roleId: createdParticipant.role_id,
        avatar: createdParticipant.avatar,
    };

    return NextResponse.json(responseParticipant, { status: 201 });
  } catch (error) {
    console.error('Error creating participant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
