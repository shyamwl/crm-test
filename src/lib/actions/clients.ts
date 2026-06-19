"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import {
  clientCreateSchema,
  clientUpdateSchema,
  idSchema,
  type ClientCreateInput,
  type ClientUpdateInput,
  type IdInput,
} from "@/lib/validation/crm";
import type { ActionResult } from "./types";

/**
 * Creates a client owned by the authenticated user.
 *
 * @param input - Validated client creation fields.
 * @returns The new client id on success.
 */
export async function createClient(
  input: ClientCreateInput
): Promise<ActionResult<{ id: string }>> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = clientCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const [created] = await db
      .insert(clients)
      .values({
        userId,
        name: parsed.data.name,
        email: parsed.data.email ?? null,
        company: parsed.data.company ?? null,
        phone: parsed.data.phone ?? null,
      })
      .returning({ id: clients.id });

    if (!created) {
      return { ok: false, error: "Failed to create client" };
    }

    revalidatePath("/clients");
    revalidatePath("/dashboard");

    return { ok: true, data: { id: created.id } };
  } catch {
    return { ok: false, error: "Failed to create client" };
  }
}

/**
 * Updates an existing client owned by the authenticated user. Only the fields
 * present in the input are modified.
 *
 * @param input - Validated client update fields including the client id.
 * @returns An empty success result, or an error if the client was not found.
 */
export async function updateClient(input: ClientUpdateInput): Promise<ActionResult> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = clientUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Build a partial update so unspecified columns are left untouched.
  const updates: Partial<typeof clients.$inferInsert> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email;
  if (parsed.data.company !== undefined) updates.company = parsed.data.company;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;

  try {
    const updated = await db
      .update(clients)
      .set(updates)
      .where(and(eq(clients.id, parsed.data.id), eq(clients.userId, userId)))
      .returning({ id: clients.id });

    if (updated.length === 0) {
      return { ok: false, error: "Client not found" };
    }

    revalidatePath("/clients");
    revalidatePath("/dashboard");
    revalidatePath(`/clients/${parsed.data.id}`);

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to update client" };
  }
}

/**
 * Deletes a client owned by the authenticated user.
 *
 * @param input - Object containing the client id.
 * @returns An empty success result, or an error if the client was not found.
 */
export async function deleteClient(input: IdInput): Promise<ActionResult> {
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
    const deleted = await db
      .delete(clients)
      .where(and(eq(clients.id, parsed.data.id), eq(clients.userId, userId)))
      .returning({ id: clients.id });

    if (deleted.length === 0) {
      return { ok: false, error: "Client not found" };
    }

    revalidatePath("/clients");
    revalidatePath("/dashboard");
    revalidatePath(`/clients/${parsed.data.id}`);

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete client" };
  }
}
