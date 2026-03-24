export type TaskStatus = "active" | "archived";

export type Task = {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  pointsValue: number;
  createdBy: string;
  requiresProof: boolean;
  assignedTo: string | null;
  status: TaskStatus;
  createdAt: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  pointsValue: number;
  requiresProof: boolean;
  assignedTo?: string | null;
};
