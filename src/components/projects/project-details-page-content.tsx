'use client';

import { useStore } from '@/hooks/use-store';
import { ProjectHeader } from '@/components/projects/project-header';
import { KanbanBoard } from '@/components/projects/kanban-board';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { TasksTable } from '@/components/projects/tasks-table';
import { useState, useEffect } from 'react';
import type { Task } from '@/lib/types';

// Este componente agora recebe `projectId` como uma prop simples.
export function ProjectDetailsPageContent({ projectId }: { projectId: string }) {
  const { isLoaded, projects, getProjectTasks } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('projectTasksViewMode');
      return (savedMode as 'kanban' | 'list') || 'kanban';
    }
    return 'kanban';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('projectTasksViewMode', viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    if (isLoaded) {
      getProjectTasks(projectId).then(fetchedTasks => {
        setTasks(fetchedTasks);
        setTasksLoaded(true);
      });
    }
  }, [isLoaded, projectId, getProjectTasks]);

  const project = projects.find((p) => p.id === projectId);

  if (!isLoaded || !project) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between space-y-2 mb-4">
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-6 min-w-max">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-4">
              <Skeleton className="h-7 w-32 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return notFound();
  }

  if (!tasksLoaded) {
    // You can show a more specific loading state for tasks if you want
    return (
       <div className="flex flex-col h-full">
        <ProjectHeader project={project} viewMode={viewMode} setViewMode={setViewMode} />
        <div className="p-4"><Skeleton className="h-96 w-full" /></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader project={project} viewMode={viewMode} setViewMode={setViewMode} />
      <div className="flex-1 overflow-x-auto p-4 sm:p-6">
        {viewMode === 'kanban' ? (
          <KanbanBoard tasks={tasks} projectId={project.id} />
        ) : (
          <TasksTable tasks={tasks} />
        )}
      </div>
    </div>
  );
}
