import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Lead } from '@/lib/types';

export async function GET() {
  try {
    const dbClient = await pool.connect();
    const result = await dbClient.query('SELECT * FROM leads');
    dbClient.release();

    const leads = result.rows.map(l => ({
        id: l.id,
        name: l.name,
        email: l.email,
        company: l.company,
        phone: l.phone,
        description: l.description,
        status: l.status,
        createdAt: l.created_at,
        value: l.value,
        clientId: l.client_id,
        comments: [],
        attachments: [],
    }));

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, company, phone, description, status, value, clientId }: Partial<Lead> = await request.json();

    const dbClient = await pool.connect();
    const result = await dbClient.query(
      'INSERT INTO leads (id, name, email, company, phone, description, status, value, client_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *',
      [`lead-${Date.now()}`, name, email, company, phone, description, status, value, clientId]
    );
    const createdLead = result.rows[0];
    dbClient.release();

    const responseLead = {
        id: createdLead.id,
        name: createdLead.name,
        email: createdLead.email,
        company: createdLead.company,
        phone: createdLead.phone,
        description: createdLead.description,
        status: createdLead.status,
        createdAt: createdLead.created_at,
        value: createdLead.value,
        clientId: createdLead.client_id,
        comments: [],
        attachments: [],
    };

    return NextResponse.json(responseLead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
