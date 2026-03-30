// src/features/groups/types.ts
export type GroupRole = 'owner' | 'sub_owner' | 'member';

export type Group = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type Membership = {
  id: string;
  user_id: string;
  group_id: string;
  role: GroupRole;
  created_at: string;
};