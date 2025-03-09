export interface Issue {
  id: string;
  title: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'done' | 'canceled';
  priority: 'no-priority' | 'low' | 'medium' | 'high' | 'urgent';
  assignee?: {
    name: string;
    avatar?: string;
  };
  dueDate?: string;
  labels?: string[];
}

export interface Activity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'comment' | 'assign';
  issueId: string;
  issueTitle: string;
  userId: string;
  userName: string;
  timestamp: number;
  details?: string;
}

export interface User {
  userId: string;
  userName: string;
  socketId?: string;
  lastActive?: number;
} 