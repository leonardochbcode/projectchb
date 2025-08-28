import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Task } from '@/lib/types';

export async function PUT(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;
  try {
    const { title, description, status, priority, dueDate, assigneeId }: Partial<Task> = await request.json();

    const client = await pool.connect();
    const result = await client.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, assignee_id = $6 WHERE id = $7 RETURNING *',
      [title, description, status, priority, dueDate, assigneeId, taskId]
    );
    const updatedTask = result.rows[0];
    client.release();

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const responseTask = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        dueDate: updatedTask.due_date,
        assigneeId: updatedTask.assignee_id,
        projectId: updatedTask.project_id,
        comments: [],
        attachments: [],
        checklist: [],
    };

    return NextResponse.json(responseTask);
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;
  try {
    const client = await pool.connect();
    await client.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    client.release();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
