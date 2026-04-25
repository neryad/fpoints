import { ensureSupabase } from "../../../core/supabase/client";
import { getCurrentUserId } from "../../../core/supabase/auth";
import { getMyRoleInGroup } from "../../tasks/services/tasks.service";
import type {
  CreateRewardInput,
  Reward,
  RewardRedemption,
  RewardRedemptionStatus,
  UpdateRewardInput,
} from "../types";

function canManageRole(role: string | null) {
  return role === "owner" || role === "sub_owner";
}

function mapReward(row: Record<string, unknown>): Reward {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    title: row.title as string,
    costPoints: row.cost_points as number,
    createdBy: row.created_by as string,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

function mapRedemption(row: Record<string, unknown>): RewardRedemption {
  const nestedRewardRaw = row.rewards as
    | { title?: string; cost_points?: number }
    | Array<{ title?: string; cost_points?: number }>
    | null
    | undefined;

  const nestedReward = Array.isArray(nestedRewardRaw)
    ? nestedRewardRaw[0]
    : nestedRewardRaw;

  const rewardTitle =
    (row.reward_title as string | null) ??
    nestedReward?.title ??
    "Premio sin nombre";

  const rewardCostPoints =
    (row.reward_cost_points as number | null) ?? nestedReward?.cost_points ?? 0;

  return {
    id: row.id as string,
    rewardId: row.reward_id as string,
    groupId: row.group_id as string,
    userId: row.user_id as string,
    rewardTitle,
    rewardCostPoints,
    status: row.status as RewardRedemptionStatus,
    approvedBy: (row.approved_by as string) ?? null,
    approvedAt: (row.approved_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function canManageRewards(groupId: string): Promise<boolean> {
  const role = await getMyRoleInGroup(groupId);
  return canManageRole(role);
}

export async function listGroupRewards(
  groupId: string,
  includeInactive = false,
): Promise<Reward[]> {
  const client = ensureSupabase();

  let query = client
    .from("rewards")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      "No se pudieron cargar los premios. Verifica tabla/politicas de rewards.",
    );
  }

  return (data ?? []).map((row) => mapReward(row as Record<string, unknown>));
}

export async function createReward(
  groupId: string,
  input: CreateRewardInput,
): Promise<Reward> {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const role = await getMyRoleInGroup(groupId);
  if (!canManageRole(role)) {
    throw new Error("Solo owner/sub_owner puede crear premios.");
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error("El titulo del premio es obligatorio.");
  }

  if (!Number.isInteger(input.costPoints) || input.costPoints <= 0) {
    throw new Error("El costo debe ser un numero entero mayor a 0.");
  }

  const { data, error } = await client
    .from("rewards")
    .insert({
      group_id: groupId,
      title,
      cost_points: input.costPoints,
      created_by: userId,
      active: true,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error("No se pudo crear el premio.");
  }

  return mapReward(data as Record<string, unknown>);
}

export async function setRewardActive(
  groupId: string,
  rewardId: string,
  active: boolean,
): Promise<void> {
  const client = ensureSupabase();
  const role = await getMyRoleInGroup(groupId);

  if (!canManageRole(role)) {
    throw new Error("Solo owner/sub_owner puede gestionar premios.");
  }

  const { error } = await client
    .from("rewards")
    .update({ active })
    .eq("id", rewardId)
    .eq("group_id", groupId);

  if (error) {
    throw new Error("No se pudo actualizar el estado del premio.");
  }
}

export async function updateReward(
  groupId: string,
  rewardId: string,
  input: UpdateRewardInput,
): Promise<void> {
  const client = ensureSupabase();
  const role = await getMyRoleInGroup(groupId);

  if (!canManageRole(role)) {
    throw new Error("Solo owner/sub_owner puede editar premios.");
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error("El titulo del premio es obligatorio.");
  }

  if (!Number.isInteger(input.costPoints) || input.costPoints <= 0) {
    throw new Error("El costo debe ser un numero entero mayor a 0.");
  }

  const { error } = await client
    .from("rewards")
    .update({
      title,
      cost_points: input.costPoints,
    })
    .eq("id", rewardId)
    .eq("group_id", groupId);

  if (error) {
    throw new Error("No se pudo actualizar el premio.");
  }
}

export async function requestRewardRedemption(
  groupId: string,
  reward: Reward,
): Promise<void> {
  const client = ensureSupabase();

  if (!reward.active) {
    throw new Error("Este premio esta inactivo por ahora.");
  }

  const { error } = await client.rpc("request_reward_redemption", {
    input_group_id: groupId,
    input_reward_id: reward.id,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("insufficient points")) {
      throw new Error("No tienes puntos suficientes para solicitar este canje.");
    }
    if (message.includes("not authorized")) {
      throw new Error("No tienes permisos para solicitar este canje.");
    }
    if (message.includes("reward not found or inactive")) {
      throw new Error("Este premio esta inactivo o no existe.");
    }
    throw new Error(
      "No se pudo crear la solicitud de canje. Verifica tabla/politicas de reward_redemptions.",
    );
  }
}

export async function listMyRewardRedemptions(
  groupId: string,
): Promise<RewardRedemption[]> {
  const client = ensureSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await client
    .from("reward_redemptions")
    .select(
      "id, reward_id, group_id, user_id, reward_title, reward_cost_points, status, approved_by, approved_at, created_at",
    )
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No se pudo cargar tu historial de canjes.");
  }

  return (data ?? []).map((row) =>
    mapRedemption(row as Record<string, unknown>),
  );
}

export async function listPendingRewardRedemptions(
  groupId: string,
): Promise<RewardRedemption[]> {
  const client = ensureSupabase();
  const role = await getMyRoleInGroup(groupId);

  if (!canManageRole(role)) {
    throw new Error("Solo owner/sub_owner puede revisar canjes.");
  }

  const { data, error } = await client
    .from("reward_redemptions")
    .select(
      "id, reward_id, group_id, user_id, reward_title, reward_cost_points, status, approved_by, approved_at, created_at",
    )
    .eq("group_id", groupId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("No se pudieron cargar las solicitudes pendientes.");
  }

  return (data ?? []).map((row) =>
    mapRedemption(row as Record<string, unknown>),
  );
}

export async function redeemRewardForMember(
  groupId: string,
  rewardId: string,
  memberId: string,
): Promise<{ pointsSpent: number; newBalance: number; rewardTitle: string }> {
  const client = ensureSupabase();

  const { data, error } = await client.rpc("redeem_reward_for_member", {
    p_group_id: groupId,
    p_reward_id: rewardId,
    p_member_id: memberId,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("insufficient_points"))
      throw new Error("El miembro no tiene puntos suficientes para este premio.");
    if (msg.includes("reward_not_found_or_inactive"))
      throw new Error("El premio está inactivo o no existe.");
    if (msg.includes("permission_denied"))
      throw new Error("No tienes permisos para canjear en nombre de otro miembro.");
    throw new Error("No se pudo realizar el canje.");
  }

  const result = data as { points_spent: number; new_balance: number; reward_title: string };
  return {
    pointsSpent: result.points_spent,
    newBalance: result.new_balance,
    rewardTitle: result.reward_title,
  };
}

export async function reviewRewardRedemption(
  redemptionId: string,
  status: Exclude<RewardRedemptionStatus, "pending">,
): Promise<void> {
  const client = ensureSupabase();

  const { error } = await client.rpc("review_reward_redemption", {
    input_redemption_id: redemptionId,
    input_status: status,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already reviewed")) {
      throw new Error("Esta solicitud ya fue revisada previamente.");
    }
    if (message.includes("not authorized")) {
      throw new Error("No tienes permisos para revisar canjes.");
    }
    if (message.includes("insufficient points")) {
      throw new Error(
        "El usuario ya no tiene puntos suficientes para este canje.",
      );
    }
    if (
      message.includes("event_id") &&
      (message.includes("null") || message.includes("not-null"))
    ) {
      throw new Error(
        "La RPC intenta registrar puntos con event_id invalido. Reejecuta la version nueva de la funcion review_reward_redemption en SQL.",
      );
    }
    if (message.includes("point_transactions")) {
      throw new Error(
        "Error al registrar el descuento en point_transactions. Revisa constraints/politicas y la version de la RPC.",
      );
    }

    throw new Error(
      `No se pudo revisar el canje. RPC review_reward_redemption respondio: ${error.message}`,
    );
  }
}
