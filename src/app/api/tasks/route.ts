import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Task } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { title, description, status, priority, dueDate, assigneeId, projectId }: Partial<Task> = await request.json();

    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO tasks (id, title, description, status, priority, due_date, assignee_id, project_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [`task-${Date.now()}`, title, description, status, priority, dueDate, assigneeId, projectId]
    );
    const createdTask = result.rows[0];
    client.release();

    const responseTask = {
        id: createdTask.id,
        title: createdTask.title,
        description: createdTask.description,
        status: createdTask.status,
        priority: createdTask.priority,
        dueDate: createdTask.due_date,
        assigneeId: createdTask.assignee_id,
        projectId: createdTask.project_id,
        comments: [],
        attachments: [],
        checklist: [],
    };

    return NextResponse.json(responseTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
