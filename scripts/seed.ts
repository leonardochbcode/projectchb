#!/usr/bin/env tsx

import { Pool } from 'pg';
import { initialRoles, initialParticipants, initialClients, initialWorkspaces, initialLeads, initialProjects, initialTasks, initialCompanyInfo, initialProjectTemplates } from '../src/lib/data';
import { Role, Participant, Client, Workspace, Lead, Project, Task, CompanyInfo, ProjectTemplate } from '../src/lib/types';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/database',
});

async function seedRoles(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      permissions TEXT[]
    );
  `);

  console.log(`Created "roles" table`);

  const insertedRoles = await Promise.all(
    initialRoles.map((role: Role) => client.query(
      'INSERT INTO roles (id, name, permissions) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING RETURNING id',
      [role.id, role.name, role.permissions]
    ))
  );

  console.log(`Seeded ${insertedRoles.filter(r => r.rowCount > 0).length} roles`);
}

async function seedParticipants(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS participants (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role_id VARCHAR(255) REFERENCES roles(id),
      avatar VARCHAR(255),
      password_hash VARCHAR(255)
    );
  `);

  console.log(`Created "participants" table`);

  const insertedParticipants = await Promise.all(
    initialParticipants.map(async (participant: Participant) => {
      const hashedPassword = await bcrypt.hash(participant.password || 'password123', 10);
      return client.query(
        'INSERT INTO participants (id, name, email, role_id, avatar, password_hash) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING RETURNING id',
        [participant.id, participant.name, participant.email, participant.roleId, participant.avatar, hashedPassword]
      );
    })
  );

  console.log(`Seeded ${insertedParticipants.filter(p => p.rowCount > 0).length} participants`);
}

async function seedClients(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(255),
      company VARCHAR(255),
      avatar VARCHAR(255),
      cnpj VARCHAR(255) UNIQUE,
      address TEXT,
      suporteweb_code VARCHAR(255)
    );
  `);
  console.log(`Created "clients" table`);
  const insertedClients = await Promise.all(
    initialClients.map((c: Client) => client.query(
      'INSERT INTO clients (id, name, email, company, avatar, cnpj, address, suporteweb_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING RETURNING id',
      [c.id, c.name, c.email, c.company, c.avatar, c.cnpj, c.address, c.suportewebCode]
    ))
  );
  console.log(`Seeded ${insertedClients.filter(c => c.rowCount > 0).length} clients`);
}

async function seedWorkspaces(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      client_id VARCHAR(255) REFERENCES clients(id)
    );
  `);
  console.log(`Created "workspaces" table`);
  const insertedWorkspaces = await Promise.all(
    initialWorkspaces.map((ws: Workspace) => client.query(
      'INSERT INTO workspaces (id, name, description, client_id) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING RETURNING id',
      [ws.id, ws.name, ws.description, ws.clientId]
    ))
  );
  console.log(`Seeded ${insertedWorkspaces.filter(ws => ws.rowCount > 0).length} workspaces`);
}

async function seedLeads(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      company VARCHAR(255),
      phone VARCHAR(255),
      description TEXT,
      status VARCHAR(50),
      created_at TIMESTAMPTZ,
      value NUMERIC(10, 2),
      client_id VARCHAR(255) REFERENCES clients(id)
    );
  `);
  console.log(`Created "leads" table`);
  const insertedLeads = await Promise.all(
    initialLeads.map((lead: Lead) => client.query(
      'INSERT INTO leads (id, name, email, company, description, status, created_at, value, client_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING RETURNING id',
      [lead.id, lead.name, lead.email, lead.company, lead.description, lead.status, lead.createdAt, lead.value, lead.clientId]
    ))
  );
  console.log(`Seeded ${insertedLeads.filter(l => l.rowCount > 0).length} leads`);
}

async function seedProjects(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      start_date DATE,
      end_date DATE,
      status VARCHAR(50),
      workspace_id VARCHAR(255) REFERENCES workspaces(id),
      client_id VARCHAR(255) REFERENCES clients(id)
    );
  `);
  console.log(`Created "projects" table`);
  const insertedProjects = await Promise.all(
    initialProjects.map((p: Project) => client.query(
      'INSERT INTO projects (id, name, description, start_date, end_date, status, workspace_id, client_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING RETURNING id',
      [p.id, p.name, p.description, p.startDate, p.endDate, p.status, p.workspaceId, p.clientId]
    ))
  );
  console.log(`Seeded ${insertedProjects.filter(p => p.rowCount > 0).length} projects`);
}

async function seedProjectParticipants(client: any) {
    await client.query(`
    CREATE TABLE IF NOT EXISTS project_participants (
      project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
      participant_id VARCHAR(255) REFERENCES participants(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, participant_id)
    );
  `);
  console.log(`Created "project_participants" table`);
  const insertedRelations = await Promise.all(
    initialProjects.flatMap((p: Project) =>
      p.participantIds.map(participantId =>
        client.query(
          'INSERT INTO project_participants (project_id, participant_id) VALUES ($1, $2) ON CONFLICT (project_id, participant_id) DO NOTHING',
          [p.id, participantId]
        )
      )
    )
  );
  console.log(`Seeded ${insertedRelations.filter(r => r.rowCount > 0).length} project-participant relations`);
}


async function seedTasks(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50),
      priority VARCHAR(50),
      due_date DATE,
      assignee_id VARCHAR(255) REFERENCES participants(id),
      project_id VARCHAR(255) REFERENCES projects(id)
    );
  `);
  console.log(`Created "tasks" table`);
  const insertedTasks = await Promise.all(
    initialTasks.map((task: Task) => client.query(
      'INSERT INTO tasks (id, title, description, status, priority, due_date, assignee_id, project_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING RETURNING id',
      [task.id, task.title, task.description, task.status, task.priority, task.dueDate, task.assigneeId, task.projectId]
    ))
  );
  console.log(`Seeded ${insertedTasks.filter(t => t.rowCount > 0).length} tasks`);
}

async function seedCompanyInfo(client: any) {
    await client.query(`
    CREATE TABLE IF NOT EXISTS company_info (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      cnpj VARCHAR(255) UNIQUE NOT NULL,
      address TEXT,
      suporteweb_code VARCHAR(255),
      logo_url TEXT
    );
  `);
  console.log(`Created "company_info" table`);
    await client.query(
        'INSERT INTO company_info (name, cnpj, address, suporteweb_code, logo_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cnpj) DO NOTHING',
        [initialCompanyInfo.name, initialCompanyInfo.cnpj, initialCompanyInfo.address, initialCompanyInfo.suportewebCode, initialCompanyInfo.logoUrl]
    );
    console.log(`Seeded company info`);
}


async function main() {
  const client = await pool.connect();

  try {
    await seedRoles(client);
    await seedParticipants(client);
    await seedClients(client);
    await seedWorkspaces(client);
    await seedLeads(client);
    await seedProjects(client);
    await seedProjectParticipants(client);
    await seedTasks(client);
    await seedCompanyInfo(client);
  } catch (error) {
    console.error('An error occurred while seeding the database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
