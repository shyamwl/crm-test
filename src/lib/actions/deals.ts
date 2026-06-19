"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, deals } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import {
  dealCreateSchema,
  dealStatusSchema,
  dealUpdateSchema,
  idSchema,
  type DealCreateInput,
  type DealStatusInput,
  type DealUpdateInput,
  type IdInput,
} from "@/lib/validation/crm";
import type { ActionResult } from "./types";

/**
 * Verifies that the given client id belongs to the user.
 *
 * @returns True if the client exists and is owned by the user.
 */
async function userOwnsClient(clientId: string, userId: string): Promise<boolean> {
  const [match] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
    .limit(1);

  return Boolean(match);
}

/**
 * Creates a deal owned by the authenticated user. The referenced client must
 * also belong to the user.
 *
 * @param input - Validated deal creation fields.
 * @returns The new deal id on success.
 */
export async function createDeal(input: DealCreateInput): Promise<ActionResult<{ id: string }>> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = dealCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    if (!(await userOwnsClient(parsed.data.clientId, userId))) {
      return { ok: false, error: "Client not found" };
    }

    const [created] = await db
      .insert(deals)
      .values({
        userId,
        clientId: parsed.data.clientId,
        title: parsed.data.title,
        // `value` is a numeric column stored as a string; omit when absent.
        value: parsed.data.value !== undefined ? String(parsed.data.value) : null,
        status: parsed.data.status,
      })
      .returning({ id: deals.id });

    if (!created) {
      return { ok: false, error: "Failed to create deal" };
    }

    revalidatePath("/deals");
    revalidatePath("/dashboard");
    revalidatePath(`/clients/${parsed.data.clientId}`);

    return { ok: true, data: { id: created.id } };
  } catch {
    return { ok: false, error: "Failed to create deal" };
  }
}

/**
 * Updates an existing deal owned by the authenticated user. Only the fields
 * present in the input are modified. If a new client id is supplied it must
 * also belong to the user.
 *
 * @param input - Validated deal update fields including the deal id.
 * @returns An empty success result, or an error if the deal/client is missing.
 */
export async function updateDeal(input: DealUpdateInput): Promise<ActionResult> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = dealUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // Fetch the existing deal to confirm ownership and learn its client id for
    // revalidation of the client detail page.
    const [existing] = await db
      .select({ clientId: deals.clientId })
      .from(deals)
      .where(and(eq(deals.id, parsed.data.id), eq(deals.userId, userId)))
      .limit(1);

    if (!existing) {
      return { ok: false, error: "Deal not found" };
    }

    if (
      parsed.data.clientId !== undefined &&
      !(await userOwnsClient(parsed.data.clientId, userId))
    ) {
      return { ok: false, error: "Client not found" };
    }

    // Build a partial update so unspecified columns are left untouched.
    const updates: Partial<typeof deals.$inferInsert> = {};
    if (parsed.data.clientId !== undefined) updates.clientId = parsed.data.clientId;
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.value !== undefined) updates.value = String(parsed.data.value);
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;

    const updated = await db
      .update(deals)
      .set(updates)
      .where(and(eq(deals.id, parsed.data.id), eq(deals.userId, userId)))
      .returning({ id: deals.id });

    if (updated.length === 0) {
      return { ok: false, error: "Deal not found" };
    }

    revalidatePath("/deals");
    revalidatePath("/dashboard");
    revalidatePath(`/clients/${existing.clientId}`);
    if (parsed.data.clientId !== undefined && parsed.data.clientId !== existing.clientId) {
      revalidatePath(`/clients/${parsed.data.clientId}`);
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to update deal" };
  }
}

/**
 * Updates only the status of a deal owned by the authenticated user.
 *
 * @param input - Validated deal id and new status.
 * @returns An empty success result, or an error if the deal was not found.
 */
export async function updateDealStatus(input: DealStatusInput): Promise<ActionResult> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = dealStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // Fetch the existing deal to confirm ownership and learn its client id.
    const [existing] = await db
      .select({ clientId: deals.clientId })
      .from(deals)
      .where(and(eq(deals.id, parsed.data.id), eq(deals.userId, userId)))
      .limit(1);

    if (!existing) {
      return { ok: false, error: "Deal not found" };
    }

    const updated = await db
      .update(deals)
      .set({ status: parsed.data.status })
      .where(and(eq(deals.id, parsed.data.id), eq(deals.userId, userId)))
      .returning({ id: deals.id });

    if (updated.length === 0) {
      return { ok: false, error: "Deal not found" };
    }

    revalidatePath("/deals");
    revalidatePath("/dashboard");
    revalidatePath(`/clients/${existing.clientId}`);

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to update deal status" };
  }
}

/**
 * Deletes a deal owned by the authenticated user.
 *
 * @param input - Object containing the deal id.
 * @returns An empty success result, or an error if the deal was not found.
 */
export async function deleteDeal(input: IdInput): Promise<ActionResult> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // Fetch the existing deal to confirm ownership and learn its client id.
    const [existing] = await db
      .select({ clientId: deals.clientId })
      .from(deals)
      .where(and(eq(deals.id, parsed.data.id), eq(deals.userId, userId)))
      .limit(1);

    if (!existing) {
      return { ok: false, error: "Deal not found" };
    }

    const deleted = await db
      .delete(deals)
      .where(and(eq(deals.id, parsed.data.id), eq(deals.userId, userId)))
      .returning({ id: deals.id });

    if (deleted.length === 0) {
      return { ok: false, error: "Deal not found" };
    }

    revalidatePath("/deals");
    revalidatePath("/dashboard");
    revalidatePath(`/clients/${existing.clientId}`);

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete deal" };
  }
}
