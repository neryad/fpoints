export type Reward = {
  id: string;
  groupId: string;
  title: string;
  costPoints: number;
  createdBy: string;
  active: boolean;
  createdAt: string;
};

export type CreateRewardInput = {
  title: string;
  costPoints: number;
};

export type UpdateRewardInput = {
  title: string;
  costPoints: number;
};

export type RewardRedemptionStatus = "pending" | "approved" | "rejected";

export type RewardRedemption = {
  id: string;
  rewardId: string;
  groupId: string;
  userId: string;
  rewardTitle: string;
  rewardCostPoints: number;
  status: RewardRedemptionStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
};
