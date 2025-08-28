import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Lead } from '@/lib/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  try {
    const { name, email, company, phone, description, status, value, clientId }: Partial<Lead> = await request.json();

    const dbClient = await pool.connect();
    const result = await dbClient.query(
      'UPDATE leads SET name = $1, email = $2, company = $3, phone = $4, description = $5, status = $6, value = $7, client_id = $8 WHERE id = $9 RETURNING *',
      [name, email, company, phone, description, status, value, clientId, leadId]
    );
    const updatedLead = result.rows[0];
    dbClient.release();

    if (!updatedLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const responseLead = {
        id: updatedLead.id,
        name: updatedLead.name,
        email: updatedLead.email,
        company: updatedLead.company,
        phone: updatedLead.phone,
        description: updatedLead.description,
        status: updatedLead.status,
        createdAt: updatedLead.created_at,
        value: updatedLead.value,
        clientId: updatedLead.client_id,
        comments: [],
        attachments: [],
    };

    return NextResponse.json(responseLead);
  } catch (error) {
    console.error(`Error updating lead ${leadId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  try {
    const dbClient = await pool.connect();
    await dbClient.query('DELETE FROM leads WHERE id = $1', [leadId]);
    dbClient.release();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting lead ${leadId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
