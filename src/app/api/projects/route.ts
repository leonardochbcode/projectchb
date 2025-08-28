import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Project } from '@/lib/types';

export async function GET() {
  try {
    const client = await pool.connect();
    const projectsResult = await client.query('SELECT id, name, description, start_date, end_date, status, workspace_id, client_id, lead_id, pmo_id FROM projects');
    const projectParticipantsResult = await client.query('SELECT project_id, participant_id FROM project_participants');
    client.release();

    const projects = projectsResult.rows.map(p => {
      const participantIds = projectParticipantsResult.rows
        .filter(pp => pp.project_id === p.id)
        .map(pp => pp.participant_id);

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        startDate: p.start_date,
        endDate: p.end_date,
        status: p.status,
        workspaceId: p.workspace_id,
        clientId: p.client_id,
        leadId: p.lead_id,
        pmoId: p.pmo_id,
        participantIds: participantIds
      };
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const { name, description, startDate, endDate, status, workspaceId, clientId, leadId, pmoId, participantIds }: Partial<Project> = await request.json();

    await client.query('BEGIN');

    const projectResult = await client.query(
      'INSERT INTO projects (id, name, description, start_date, end_date, status, workspace_id, client_id, lead_id, pmo_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [`proj-${Date.now()}`, name, description, startDate, endDate, status, workspaceId, clientId, leadId, pmoId]
    );
    const createdProject = projectResult.rows[0];

    if (participantIds && participantIds.length > 0) {
      for (const participantId of participantIds) {
        await client.query(
          'INSERT INTO project_participants (project_id, participant_id) VALUES ($1, $2)',
          [createdProject.id, participantId]
        );
      }
    }

    await client.query('COMMIT');

    const responseProject = {
        id: createdProject.id,
        name: createdProject.name,
        description: createdProject.description,
        startDate: createdProject.start_date,
        endDate: createdProject.end_date,
        status: createdProject.status,
        workspaceId: createdProject.workspace_id,
        clientId: createdProject.client_id,
        leadId: createdProject.lead_id,
        pmoId: createdProject.pmo_id,
        participantIds: participantIds || []
    };

    return NextResponse.json(responseProject, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}
