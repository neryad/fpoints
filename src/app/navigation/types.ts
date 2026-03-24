export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type GroupStackParamList = {
  GroupSelection: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
};

export type TasksStackParamList = {
  TasksList: undefined;
  TaskDetail: { taskId: string };
  CreateTask: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Profile: undefined;
};
