export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type GroupStackParamList = {
  GroupSelection: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
};

export type HomeStackParamList = {
  HomeDashboard: undefined;
  PointHistory: undefined;
};

export type TasksStackParamList = {
  TasksList: undefined;
  TaskDetail: { taskId: string };
  CreateTask: undefined;
  SubmitTask: { taskId: string };
  Approvals: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  GroupSettings: undefined;
  MemberDashboard: { memberId: string; memberName: string; memberRole: string };
};

export type RewardsStackParamList = {
  RewardsList: undefined;
  ManageRewards: undefined;
  MyRedemptions: undefined;
  RewardApprovals: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Rewards: undefined;
  Profile: undefined;
};
