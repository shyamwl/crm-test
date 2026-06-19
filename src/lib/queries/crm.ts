import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, deals, notes } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { type DealStatusValue } from "@/lib/validation/crm";

// ---------------------------------------------------------------------------
// Inferred row types
// ---------------------------------------------------------------------------

/** A single client row as stored in the database. */
export type ClientRow = typeof clients.$inferSelect;

/** A single deal row as stored in the database. */
export type DealRow = typeof deals.$inferSelect;

/** A single note row as stored in the database. */
export type NoteRow = typeof notes.$inferSelect;

/**
 * A deal joined with its owning client, exposing the client's display name.
 * Returned by {@link getDeals} and {@link getOpenDeals}.
 */
export interface DealWithClient {
  id: string;
  clientId: string;
  title: string;
  value: string | null;
  status: DealStatusValue;
  createdAt: Date;
  updatedAt: Date;
  clientName: string;
}

/**
 * A lightweight client option for populating select inputs.
 */
export interface ClientOption {
  id: string;
  name: string;
}

/**
 * A client together with its related deals and notes.
 * Returned (non-null) by {@link getClientWithRelations}.
 */
export interface ClientWithRelations {
  client: ClientRow;
  deals: DealRow[];
  notes: NoteRow[];
}

/**
 * Aggregated dashboard metrics for the current user.
 */
export interface DashboardStats {
  totalClients: number;
  openDealsCount: number;
  openPipelineValue: number;
  wonCount: number;
  lostCount: number;
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

/**
 * Fetches all clients owned by the current user, newest first.
 *
 * @returns The user's client rows ordered by creation date (descending).
 */
export async function getClients(): Promise<ClientRow[]> {
  const session = await requireAuth();

  return db
    .select()
    .from(clients)
    .where(eq(clients.userId, session.user.id))
    .orderBy(desc(clients.createdAt));
}

/**
 * Fetches a single client owned by the current user.
 *
 * @param id - The client id to look up.
 * @returns The client row, or `null` if it does not exist or is not owned by
 *   the current user.
 */
export async function getClientById(id: string): Promise<ClientRow | null> {
  const session = await requireAuth();

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, session.user.id)))
    .limit(1);

  return client ?? null;
}

/**
 * Fetches a client along with its related deals and notes, all scoped to the
 * current user. Deals and notes are ordered newest first.
 *
 * @param id - The client id to look up.
 * @returns The client with its relations, or `null` if the client does not
 *   exist or is not owned by the current user.
 */
export async function getClientWithRelations(id: string): Promise<ClientWithRelations | null> {
  const session = await requireAuth();

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, session.user.id)))
    .limit(1);

  if (!client) {
    return null;
  }

  const clientDeals = await db
    .select()
    .from(deals)
    .where(and(eq(deals.clientId, id), eq(deals.userId, session.user.id)))
    .orderBy(desc(deals.createdAt));

  const clientNotes = await db
    .select()
    .from(notes)
    .where(and(eq(notes.clientId, id), eq(notes.userId, session.user.id)))
    .orderBy(desc(notes.createdAt));

  return { client, deals: clientDeals, notes: clientNotes };
}

/**
 * Fetches lightweight client options for select inputs, scoped to the current
 * user and ordered alphabetically by name (ascending).
 *
 * @returns An array of `{ id, name }` options.
 */
export async function getClientOptions(): Promise<ClientOption[]> {
  const session = await requireAuth();

  return db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.userId, session.user.id))
    .orderBy(clients.name);
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

/**
 * Fetches all deals owned by the current user, optionally filtered by status,
 * joined with their owning client to expose the client's name. Newest first.
 *
 * @param status - Optional status to filter deals by.
 * @returns The user's deals with the associated client name.
 */
export async function getDeals(status?: DealStatusValue): Promise<DealWithClient[]> {
  const session = await requireAuth();

  const condition = status
    ? and(eq(deals.userId, session.user.id), eq(deals.status, status))
    : eq(deals.userId, session.user.id);

  return db
    .select({
      id: deals.id,
      clientId: deals.clientId,
      title: deals.title,
      value: deals.value,
      status: deals.status,
      createdAt: deals.createdAt,
      updatedAt: deals.updatedAt,
      clientName: clients.name,
    })
    .from(deals)
    .innerJoin(clients, eq(deals.clientId, clients.id))
    .where(condition)
    .orderBy(desc(deals.createdAt));
}

/**
 * Fetches open deals owned by the current user, including the client name,
 * newest first.
 *
 * @returns The user's open deals with the associated client name.
 */
export async function getOpenDeals(): Promise<DealWithClient[]> {
  return getDeals("open");
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

/**
 * Fetches notes attached to a given deal, scoped to the current user, newest
 * first.
 *
 * @param dealId - The deal id whose notes should be fetched.
 * @returns The matching note rows.
 */
export async function getNotesForDeal(dealId: string): Promise<NoteRow[]> {
  const session = await requireAuth();

  return db
    .select()
    .from(notes)
    .where(and(eq(notes.dealId, dealId), eq(notes.userId, session.user.id)))
    .orderBy(desc(notes.createdAt));
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/**
 * Computes aggregated dashboard metrics for the current user using SQL
 * aggregation. The `value` numeric column is summed as a string and parsed to
 * a number; null sums are treated as 0.
 *
 * @returns The dashboard statistics for the current user.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await requireAuth();

  const [clientStats] = await db
    .select({ totalClients: count() })
    .from(clients)
    .where(eq(clients.userId, session.user.id));

  const [dealStats] = await db
    .select({
      openDealsCount: count(sql`CASE WHEN ${deals.status} = 'open' THEN 1 END`),
      openPipelineValue: sql<
        string | null
      >`SUM(CASE WHEN ${deals.status} = 'open' THEN ${deals.value} END)`,
      wonCount: count(sql`CASE WHEN ${deals.status} = 'won' THEN 1 END`),
      lostCount: count(sql`CASE WHEN ${deals.status} = 'lost' THEN 1 END`),
    })
    .from(deals)
    .where(eq(deals.userId, session.user.id));

  return {
    totalClients: Number(clientStats?.totalClients ?? 0),
    openDealsCount: Number(dealStats?.openDealsCount ?? 0),
    // SUM over a numeric column returns a string (or null when no rows match).
    openPipelineValue: Number(dealStats?.openPipelineValue ?? 0),
    wonCount: Number(dealStats?.wonCount ?? 0),
    lostCount: Number(dealStats?.lostCount ?? 0),
  };
}
