"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, deals, notes } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import {
  idSchema,
  noteCreateSchema,
  type IdInput,
  type NoteCreateInput,
} from "@/lib/validation/crm";
import type { ActionResult } from "./types";

/**
 * Creates a note owned by the authenticated user. The note must reference a
 * client or a deal (validation enforces exactly one), and that referenced row
 * must also belong to the user.
 *
 * @param input - Validated note creation fields.
 * @returns The new note id on success.
 */
export async function createNote(input: NoteCreateInput): Promise<ActionResult<{ id: string }>> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = noteCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    if (parsed.data.clientId) {
      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.id, parsed.data.clientId), eq(clients.userId, userId)))
        .limit(1);

      if (!client) {
        return { ok: false, error: "Client not found" };
      }
    }

    if (parsed.data.dealId) {
      const [deal] = await db
        .select({ id: deals.id })
        .from(deals)
        .where(and(eq(deals.id, parsed.data.dealId), eq(deals.userId, userId)))
        .limit(1);

      if (!deal) {
        return { ok: false, error: "Deal not found" };
      }
    }

    const [created] = await db
      .insert(notes)
      .values({
        userId,
        body: parsed.data.body,
        clientId: parsed.data.clientId ?? null,
        dealId: parsed.data.dealId ?? null,
      })
      .returning({ id: notes.id });

    if (!created) {
      return { ok: false, error: "Failed to create note" };
    }

    revalidatePath("/dashboard");
    if (parsed.data.clientId) {
      revalidatePath(`/clients/${parsed.data.clientId}`);
    }
    if (parsed.data.dealId) {
      revalidatePath("/deals");
    }

    return { ok: true, data: { id: created.id } };
  } catch {
    return { ok: false, error: "Failed to create note" };
  }
}

/**
 * Deletes a note owned by the authenticated user.
 *
 * @param input - Object containing the note id.
 * @returns An empty success result, or an error if the note was not found.
 */
export async function deleteNote(input: IdInput): Promise<ActionResult> {
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
    // Fetch the existing note to confirm ownership and learn its associations
    // for revalidation of the relevant detail pages.
    const [existing] = await db
      .select({ clientId: notes.clientId, dealId: notes.dealId })
      .from(notes)
      .where(and(eq(notes.id, parsed.data.id), eq(notes.userId, userId)))
      .limit(1);

    if (!existing) {
      return { ok: false, error: "Note not found" };
    }

    const deleted = await db
      .delete(notes)
      .where(and(eq(notes.id, parsed.data.id), eq(notes.userId, userId)))
      .returning({ id: notes.id });

    if (deleted.length === 0) {
      return { ok: false, error: "Note not found" };
    }

    revalidatePath("/dashboard");
    if (existing.clientId) {
      revalidatePath(`/clients/${existing.clientId}`);
    }
    if (existing.dealId) {
      revalidatePath("/deals");
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete note" };
  }
}
