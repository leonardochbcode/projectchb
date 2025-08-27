import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM tasks WHERE project_id = $1', [projectId]);
    client.release();

    const tasks = result.rows.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.due_date,
      assigneeId: t.assignee_id,
      projectId: t.project_id,
      comments: [], // Needs to be fetched separately
      attachments: [], // Needs to be fetched separately
      checklist: [], // Needs to be fetched separately
    }));

    return NextResponse.json(tasks);
  } catch (error) {
    console.error(`Error fetching tasks for project ${projectId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
