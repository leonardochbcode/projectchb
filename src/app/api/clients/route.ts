import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Client } from '@/lib/types';

export async function GET() {
  try {
    const dbClient = await pool.connect();
    const result = await dbClient.query('SELECT * FROM clients');
    dbClient.release();

    const clients = result.rows.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      avatar: c.avatar,
      cnpj: c.cnpj,
      address: c.address,
      suportewebCode: c.suporteweb_code,
    }));

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, company, avatar, cnpj, address, suportewebCode }: Partial<Client> = await request.json();

    const dbClient = await pool.connect();
    const result = await dbClient.query(
      'INSERT INTO clients (id, name, email, phone, company, avatar, cnpj, address, suporteweb_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [`client-${Date.now()}`, name, email, phone, company, avatar, cnpj, address, suportewebCode]
    );
    const createdClient = result.rows[0];
    dbClient.release();

    const responseClient = {
        id: createdClient.id,
        name: createdClient.name,
        email: createdClient.email,
        phone: createdClient.phone,
        company: createdClient.company,
        avatar: createdClient.avatar,
        cnpj: createdClient.cnpj,
        address: createdClient.address,
        suportewebCode: createdClient.suporteweb_code,
    };

    return NextResponse.json(responseClient, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
