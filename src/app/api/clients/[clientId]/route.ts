import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Client } from '@/lib/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  try {
    const { name, email, phone, company, avatar, cnpj, address, suportewebCode }: Partial<Client> = await request.json();

    const dbClient = await pool.connect();
    const result = await dbClient.query(
      'UPDATE clients SET name = $1, email = $2, phone = $3, company = $4, avatar = $5, cnpj = $6, address = $7, suporteweb_code = $8 WHERE id = $9 RETURNING *',
      [name, email, phone, company, avatar, cnpj, address, suportewebCode, clientId]
    );
    const updatedClient = result.rows[0];
    dbClient.release();

    if (!updatedClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const responseClient = {
        id: updatedClient.id,
        name: updatedClient.name,
        email: updatedClient.email,
        phone: updatedClient.phone,
        company: updatedClient.company,
        avatar: updatedClient.avatar,
        cnpj: updatedClient.cnpj,
        address: updatedClient.address,
        suportewebCode: updatedClient.suporteweb_code,
    };

    return NextResponse.json(responseClient);
  } catch (error) {
    console.error(`Error updating client ${clientId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  try {
    const dbClient = await pool.connect();
    await dbClient.query('DELETE FROM clients WHERE id = $1', [clientId]);
    dbClient.release();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting client ${clientId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
