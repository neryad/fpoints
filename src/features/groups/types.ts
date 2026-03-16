export type GroupRole = 'owner' | 'sub_owner' | 'member';

export type Group = {
  id: string;
  name: string;
  role: GroupRole;
};
