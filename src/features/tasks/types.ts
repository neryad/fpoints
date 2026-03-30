export type TaskStatus = "active" | "archived";
export type TaskSubmissionStatus = "pending" | "approved" | "rejected";

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

export type TaskSubmission = {
  id: string;
  taskId: string;
  userId: string;
  note: string | null;
  proofImageUrl: string | null;
  status: TaskSubmissionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type CreateTaskSubmissionInput = {
  note?: string;
  proofImageUrl?: string;
};
