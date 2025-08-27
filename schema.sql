-- schema.sql

-- Apaga tabelas existentes para uma nova criação limpa
DROP TABLE IF EXISTS company_info, roles, participants, clients, workspaces, projects, tasks, leads, project_templates, task_comments, task_attachments, task_checklist_items, lead_comments, lead_attachments, project_participants, template_tasks CASCADE;

-- Tabela para informações da empresa
CREATE TABLE company_info (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(255) UNIQUE NOT NULL,
    address TEXT,
    suporteweb_code VARCHAR(255),
    logo_url TEXT
);

-- Tabela para os papéis (roles) dos usuários
CREATE TABLE roles (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    permissions TEXT[] -- Usando array de strings para as permissões
);

-- Tabela para os participantes (usuários do sistema)
CREATE TABLE participants (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role_id VARCHAR(255) REFERENCES roles(id),
    avatar VARCHAR(255),
    password_hash VARCHAR(255) -- Armazenar o hash da senha
);

-- Tabela para os clientes
CREATE TABLE clients (
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

-- Tabela para os espaços de trabalho (workspaces)
CREATE TABLE workspaces (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id VARCHAR(255) REFERENCES clients(id)
);

-- Tabela para os leads de vendas
CREATE TABLE leads (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    company VARCHAR(255),
    phone VARCHAR(255),
    description TEXT,
    status VARCHAR(50) CHECK (status IN ('Novo', 'Em Contato', 'Proposta Enviada', 'Convertido', 'Perdido')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    value NUMERIC(10, 2),
    client_id VARCHAR(255) REFERENCES clients(id)
);

-- Tabela para os projetos
CREATE TABLE projects (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) CHECK (status IN ('Planejamento', 'Em Andamento', 'Pausado', 'Concluído')),
    workspace_id VARCHAR(255) REFERENCES workspaces(id),
    client_id VARCHAR(255) REFERENCES clients(id),
    lead_id VARCHAR(255) REFERENCES leads(id),
    pmo_id VARCHAR(255) REFERENCES participants(id)
);

-- Tabela de associação para os participantes dos projetos (relação muitos-para-muitos)
CREATE TABLE project_participants (
    project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
    participant_id VARCHAR(255) REFERENCES participants(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, participant_id)
);

-- Tabela para as tarefas
CREATE TABLE tasks (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) CHECK (status IN ('A Fazer', 'Em Andamento', 'Concluída')),
    priority VARCHAR(50) CHECK (priority IN ('Baixa', 'Média', 'Alta')),
    due_date DATE,
    assignee_id VARCHAR(255) REFERENCES participants(id),
    project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE
);

-- Tabela para comentários das tarefas
CREATE TABLE task_comments (
    id VARCHAR(255) PRIMARY KEY,
    content TEXT NOT NULL,
    author_id VARCHAR(255) REFERENCES participants(id),
    task_id VARCHAR(255) REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para anexos das tarefas
CREATE TABLE task_attachments (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    size_bytes BIGINT,
    type VARCHAR(100),
    url TEXT,
    task_id VARCHAR(255) REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para itens do checklist das tarefas
CREATE TABLE task_checklist_items (
    id VARCHAR(255) PRIMARY KEY,
    text VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    task_id VARCHAR(255) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Tabela para comentários dos leads
CREATE TABLE lead_comments (
    id VARCHAR(255) PRIMARY KEY,
    content TEXT NOT NULL,
    author_id VARCHAR(255) REFERENCES participants(id),
    lead_id VARCHAR(255) REFERENCES leads(id) ON DELETE CASCADE,
    created_at TIMESTAMTz DEFAULT NOW()
);

-- Tabela para anexos dos leads
CREATE TABLE lead_attachments (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    size_bytes BIGINT,
    type VARCHAR(100),
    url TEXT,
    lead_id VARCHAR(255) REFERENCES leads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para os templates de projeto
CREATE TABLE project_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- Tabela para as tarefas dos templates de projeto
CREATE TABLE template_tasks (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(255) REFERENCES project_templates(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) CHECK (priority IN ('Baixa', 'Média', 'Alta')),
    due_day_offset INTEGER
);
