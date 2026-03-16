export type TaskStatus = 'active' | 'archived';

export type Task = {
  id: string;
  title: string;
  pointsValue: number;
  status: TaskStatus;
};
