export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'work' | 'personal' | 'shopping' | 'other';
  priority: Priority;
  completed: boolean;
  progress: number;
  deadline?: Date;
  createdAt: Date;
}

export type Category = Task['category'];