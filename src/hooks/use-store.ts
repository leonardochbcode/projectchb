'use client';

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
  useMemo,
} from 'react';
import React from 'react';
import type { Project, Task, Participant, Role, Client, Lead, CompanyInfo, ProjectTemplate, TemplateTask, ChecklistItem, Workspace } from '@/lib/types';
import {
  initialCompanyInfo,
  initialProjectTemplates,
  initialWorkspaces,
} from '@/lib/data';
import { format, addDays } from 'date-fns';

interface Store {
  isLoaded: boolean;
  projects: Project[];
  tasks: Task[];
  participants: Participant[];
  roles: Role[];
  clients: Client[];
  leads: Lead[];
  currentUser: Participant | null;
  companyInfo: CompanyInfo | null;
  projectTemplates: ProjectTemplate[];
  workspaces: Workspace[];
}

const StoreContext = createContext<Store & { dispatch: (newState: Partial<Store>) => void } | null>(
  null
);

const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };
  return [storedValue, setValue] as const;
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentUser, setCurrentUser] = useLocalStorage<Participant | null>('currentUser', null);
  const [companyInfo, setCompanyInfo] = useLocalStorage<CompanyInfo | null>('companyInfo', initialCompanyInfo);
  const [projectTemplates, setProjectTemplates] = useLocalStorage<ProjectTemplate[]>('projectTemplates', initialProjectTemplates);
  const [workspaces, setWorkspaces] = useLocalStorage<Workspace[]>('workspaces', initialWorkspaces);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        } else {
          console.error('Failed to fetch projects');
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/clients');
            if(response.ok) {
                const data = await response.json();
                setClients(data);
            } else {
                console.error('Failed to fetch clients');
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    }

    const fetchParticipants = async () => {
        try {
            const response = await fetch('/api/participants');
            if(response.ok) {
                const data = await response.json();
                setParticipants(data);
            } else {
                console.error('Failed to fetch participants');
            }
        } catch (error) {
            console.error('Error fetching participants:', error);
        }
    }

    const fetchRoles = async () => {
        try {
            const response = await fetch('/api/roles');
            if(response.ok) {
                const data = await response.json();
                setRoles(data);
            } else {
                console.error('Failed to fetch roles');
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    }

    const fetchLeads = async () => {
        try {
            const response = await fetch('/api/leads');
            if(response.ok) {
                const data = await response.json();
                setLeads(data);
            } else {
                console.error('Failed to fetch leads');
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        }
    }

    Promise.all([fetchProjects(), fetchClients(), fetchParticipants(), fetchRoles(), fetchLeads()]).then(() => {
        setIsLoaded(true);
    });
  }, []);

  const store: Store = useMemo(() => ({
    isLoaded,
    projects,
    tasks,
    participants,
    roles,
    clients,
    leads,
    currentUser,
    companyInfo,
    projectTemplates,
    workspaces,
  }), [isLoaded, projects, tasks, participants, roles, clients, leads, currentUser, companyInfo, projectTemplates, workspaces]);

  const dispatch = (newState: Partial<Store>) => {
    if (newState.projects) setProjects(newState.projects);
    if (newState.tasks) setTasks(newState.tasks);
    if (newState.participants) setParticipants(newState.participants);
    if (newState.roles) setRoles(newState.roles);
    if (newState.clients) setClients(newState.clients);
    if (newState.leads) setLeads(newState.leads);
    if (newState.hasOwnProperty('currentUser')) setCurrentUser(newState.currentUser ?? null);
    if (newState.companyInfo) setCompanyInfo(newState.companyInfo);
    if (newState.projectTemplates) setProjectTemplates(newState.projectTemplates);
    if (newState.workspaces) setWorkspaces(newState.workspaces);
  };
  
  const value = useMemo(() => ({ ...store, dispatch }), [store]);

  return React.createElement(StoreContext.Provider, { value }, children);
};


const useStoreRaw = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const useStore = () => {
  const store = useStoreRaw();
  const { dispatch } = store;

  const login = useCallback(
    (email: string, password?: string) => {
      const user = store.participants.find(
        (p) => p.email.toLowerCase() === email.toLowerCase() && p.password === password
      );

      if (user) {
        dispatch({ currentUser: user });
        return true;
      }
      return false;
    },
    [store.participants, dispatch]
  );

  const logout = useCallback(() => {
    dispatch({ currentUser: null });
  }, [dispatch]);

  const getWorkspaceProjects = useCallback(
    (workspaceId: string) => {
      return store.projects.filter((project) => project.workspaceId === workspaceId);
    },
    [store.projects]
  );

  const getProjectTasks = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const tasks = await response.json();
      // Update local state with fetched tasks
      dispatch({ tasks: [...store.tasks.filter(t => t.projectId !== projectId), ...tasks] });
      return tasks;
    } catch (error) {
      console.error(`Error fetching tasks for project ${projectId}:`, error);
      return [];
    }
  }, [store.tasks, dispatch]);
  
  const addProject = useCallback(async (project: Omit<Project, 'id' | 'participantIds'>, templateId?: string) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const newProject = await response.json();

      let newTasks: Task[] = [];
      if (templateId && templateId !== 'none') {
        const template = store.projectTemplates.find(t => t.id === templateId);
        if (template) {
          // This part would also need to be moved to the backend in a real scenario
          newTasks = template.tasks.map((templateTask: TemplateTask) => {
            const dueDate = addDays(new Date(newProject.start_date), templateTask.dueDayOffset);
            return {
              id: `task-${Date.now()}-${Math.random()}`,
              projectId: newProject.id,
              title: templateTask.title,
              description: templateTask.description,
              status: 'A Fazer',
              priority: templateTask.priority,
              dueDate: format(dueDate, 'yyyy-MM-dd'),
              comments: [],
              attachments: [],
              checklist: [],
            };
          });
        }
      }

      dispatch({
        projects: [...store.projects, newProject],
        tasks: [...store.tasks, ...newTasks]
      });
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }, [store.projects, store.tasks, store.projectTemplates, dispatch]);

  const updateProject = useCallback((updatedProject: Project) => {
    dispatch({
      projects: store.projects.map(p => p.id === updatedProject.id ? updatedProject : p)
    });
  }, [store.projects, dispatch]);

  const deleteProject = useCallback((projectId: string) => {
    dispatch({
      projects: store.projects.filter(p => p.id !== projectId),
      tasks: store.tasks.filter(t => t.projectId !== projectId)
    });
  }, [store.projects, store.tasks, dispatch]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'comments' | 'attachments' | 'checklist'>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      const newTask = await response.json();
      dispatch({ tasks: [...store.tasks, newTask] });
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }, [store.tasks, dispatch]);

  const updateTask = useCallback(async (updatedTask: Task) => {
    try {
      const response = await fetch(`/api/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTask),
      });
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      const returnedTask = await response.json();
      dispatch({
        tasks: store.tasks.map(t => t.id === returnedTask.id ? returnedTask : t)
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }, [store.tasks, dispatch]);
  
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      dispatch({
          tasks: store.tasks.filter(t => t.id !== taskId)
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }, [store.tasks, dispatch]);
  
  const getParticipant = useCallback((participantId: string) => {
      return store.participants.find(p => p.id === participantId);
  }, [store.participants]);

  const addParticipant = useCallback(async (participant: Omit<Participant, 'id' | 'avatar'>) => {
    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...participant,
          avatar: `/avatars/0${(store.participants.length % 5) + 1}.png`,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create participant');
      }
      const newParticipant = await response.json();
      dispatch({ participants: [...store.participants, newParticipant]});
      return newParticipant;
    } catch (error) {
      console.error('Error creating participant:', error);
      return null;
    }
  }, [store.participants, dispatch]);

  const updateParticipant = useCallback(async (updatedParticipant: Participant) => {
    try {
      const response = await fetch(`/api/participants/${updatedParticipant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedParticipant),
      });
      if (!response.ok) {
        throw new Error('Failed to update participant');
      }
      const returnedParticipant = await response.json();
      dispatch({
        participants: store.participants.map(p => p.id === returnedParticipant.id ? returnedParticipant : p)
      });
    } catch (error) {
      console.error('Error updating participant:', error);
    }
  }, [store.participants, dispatch]);

  const deleteParticipant = useCallback(async (participantId: string) => {
    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete participant');
      }
      dispatch({
        participants: store.participants.filter(p => p.id !== participantId)
      });
    } catch (error) {
      console.error('Error deleting participant:', error);
    }
  }, [store.participants, dispatch]);

  const getRole = useCallback((roleId: string) => {
    return store.roles.find(r => r.id === roleId);
  }, [store.roles]);

  const addRole = useCallback(async (role: Omit<Role, 'id'>) => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(role),
      });
      if (!response.ok) {
        throw new Error('Failed to create role');
      }
      const newRole = await response.json();
      dispatch({ roles: [...store.roles, newRole]});
      return newRole;
    } catch (error) {
      console.error('Error creating role:', error);
      return null;
    }
  }, [store.roles, dispatch]);

  const updateRole = useCallback(async (updatedRole: Role) => {
    try {
      const response = await fetch(`/api/roles/${updatedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRole),
      });
      if (!response.ok) {
        throw new Error('Failed to update role');
      }
      const returnedRole = await response.json();
      dispatch({
        roles: store.roles.map(r => r.id === returnedRole.id ? returnedRole : r)
      });
    } catch (error) {
      console.error('Error updating role:', error);
    }
  }, [store.roles, dispatch]);
  
  const deleteRole = useCallback(async (roleId: string) => {
    const isRoleInUse = store.participants.some(p => p.roleId === roleId);
    if(isRoleInUse) {
        alert("Esta função está em uso e não pode ser excluída.");
        return;
    }
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete role');
      }
      dispatch({
          roles: store.roles.filter(r => r.id !== roleId)
      });
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  }, [store.roles, store.participants, dispatch]);

  const getClient = useCallback((clientId: string) => {
    return store.clients.find(c => c.id === clientId);
  }, [store.clients]);

  const addClient = useCallback(async (client: Omit<Client, 'id' | 'avatar'>) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...client,
          avatar: `/avatars/c0${(store.clients.length % 3) + 1}.png`,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create client');
      }
      const newClient = await response.json();
      dispatch({ clients: [...store.clients, newClient]});
      return newClient;
    } catch (error) {
      console.error('Error creating client:', error);
      return null;
    }
  }, [store.clients, dispatch]);

  const updateClient = useCallback(async (updatedClient: Client) => {
    try {
      const response = await fetch(`/api/clients/${updatedClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedClient),
      });
      if (!response.ok) {
        throw new Error('Failed to update client');
      }
      const returnedClient = await response.json();
      dispatch({
        clients: store.clients.map(c => c.id === returnedClient.id ? returnedClient : c)
      });
    } catch (error) {
      console.error('Error updating client:', error);
    }
  }, [store.clients, dispatch]);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete client');
      }
      dispatch({
        clients: store.clients.filter(c => c.id !== clientId)
      });
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  }, [store.clients, dispatch]);
    
  const getLead = useCallback((leadId: string) => {
      return store.leads.find(l => l.id === leadId);
  }, [store.leads]);

  const addLead = useCallback(async (lead: Omit<Lead, 'id' | 'createdAt' | 'comments' | 'attachments'>) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lead),
      });
      if (!response.ok) {
        throw new Error('Failed to create lead');
      }
      const newLead = await response.json();
      dispatch({ leads: [...store.leads, newLead]});
      return newLead;
    } catch (error) {
      console.error('Error creating lead:', error);
      return null;
    }
  }, [store.leads, dispatch]);

  const updateLead = useCallback((updatedLead: Lead) => {
      dispatch({
          leads: store.leads.map(l => l.id === updatedLead.id ? updatedLead : l)
      });
  }, [store.leads, dispatch]);

  const deleteLead = useCallback((leadId: string) => {
      dispatch({
          leads: store.leads.filter(l => l.id !== leadId)
      });
  }, [store.leads, dispatch]);

  const updateCompanyInfo = useCallback((info: CompanyInfo) => {
    dispatch({ companyInfo: info });
  }, [dispatch]);

  const duplicateProject = useCallback(async (projectToDuplicate: Project) => {
    const newProjectData = {
      ...projectToDuplicate,
      name: `${projectToDuplicate.name} (Cópia)`,
    };

    // This should be a single API call to the backend to duplicate the project and its tasks
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProjectData),
    });
    const newProject = await response.json();

    const originalTasks = await getProjectTasks(projectToDuplicate.id);
    const newTasks: Promise<Response>[] = originalTasks.map((task: Task) => {
      const newTaskData = {
        ...task,
        projectId: newProject.id,
      };
      return fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTaskData),
      });
    });

    const createdTasks = await Promise.all(newTasks.map(p => p.then(res => res.json())));

    dispatch({ 
      projects: [...store.projects, newProject],
      tasks: [...store.tasks, ...createdTasks]
    });
    return newProject;
  }, [store.projects, store.tasks, getProjectTasks, dispatch]);

  const addProjectTemplate = useCallback((template: Omit<ProjectTemplate, 'id'>) => {
    const newTemplate: ProjectTemplate = {
      id: `template-${Date.now()}`,
      ...template,
    };
    dispatch({ projectTemplates: [...store.projectTemplates, newTemplate] });
  }, [store.projectTemplates, dispatch]);

  const updateProjectTemplate = useCallback((updatedTemplate: ProjectTemplate) => {
    dispatch({
      projectTemplates: store.projectTemplates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
    });
  }, [store.projectTemplates, dispatch]);

  const deleteProjectTemplate = useCallback((templateId: string) => {
    dispatch({
      projectTemplates: store.projectTemplates.filter(t => t.id !== templateId)
    });
  }, [store.projectTemplates, dispatch]);
  
  const addWorkspace = useCallback((workspace: Omit<Workspace, 'id'>) => {
    const newWorkspace: Workspace = {
      id: `ws-${Date.now()}`,
      ...workspace,
    };
    dispatch({ workspaces: [...store.workspaces, newWorkspace] });
  }, [store.workspaces, dispatch]);

  const updateWorkspace = useCallback((updatedWorkspace: Workspace) => {
    dispatch({
      workspaces: store.workspaces.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w)
    });
  }, [store.workspaces, dispatch]);

  const deleteWorkspace = useCallback((workspaceId: string) => {
    const projectsInWorkspace = store.projects.filter(p => p.workspaceId === workspaceId);
    if (projectsInWorkspace.length > 0) {
      alert("Não é possível excluir um espaço de trabalho que contém projetos.");
      return;
    }
    dispatch({
      workspaces: store.workspaces.filter(w => w.id !== workspaceId)
    });
  }, [store.workspaces, store.projects, dispatch]);


  return {
    ...store,
    login,
    logout,
    getWorkspaceProjects,
    getProjectTasks,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    getParticipant,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    getRole,
    addRole,
    updateRole,
    deleteRole,
    getClient,
    addClient,
    updateClient,
    deleteClient,
    getLead,
    addLead,
    updateLead,
    deleteLead,
    updateCompanyInfo,
    duplicateProject,
    addProjectTemplate,
    updateProjectTemplate,
    deleteProjectTemplate,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
  };
};
