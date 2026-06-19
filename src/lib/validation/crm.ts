import { z } from "zod";

/**
 * Treats empty/whitespace-only strings as `undefined` so that optional form
 * fields submitted as "" are not rejected by downstream validators and are
 * stored as NULL rather than empty strings.
 */
const emptyToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
};

/**
 * Optional email field that accepts "" (treated as undefined) and otherwise
 * must be a valid email address.
 */
const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().email("Invalid email address").optional()
);

/**
 * Optional trimmed string field that treats "" as undefined.
 */
const optionalString = z.preprocess(emptyToUndefined, z.string().trim().optional());

/**
 * Optional, non-negative monetary value. Accepts a number or a string coming
 * from a form input, coerces it to a number, and treats "" as undefined.
 */
const optionalValue = z.preprocess(
  emptyToUndefined,
  z.coerce.number().nonnegative("Value must be zero or greater").optional()
);

/**
 * Deal status enum mirroring the `deal_status` Postgres enum in the schema.
 */
export const dealStatusEnum = z.enum(["open", "won", "lost"]);

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export const clientCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: optionalEmail,
  company: optionalString,
  phone: optionalString,
});

export const clientUpdateSchema = z.object({
  id: z.string().uuid("Invalid client id"),
  name: z.string().trim().min(1, "Name is required").optional(),
  email: optionalEmail,
  company: optionalString,
  phone: optionalString,
});

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export const dealCreateSchema = z.object({
  clientId: z.string().uuid("Invalid client id"),
  title: z.string().trim().min(1, "Title is required"),
  value: optionalValue,
  status: dealStatusEnum.default("open"),
});

export const dealUpdateSchema = z.object({
  id: z.string().uuid("Invalid deal id"),
  clientId: z.string().uuid("Invalid client id").optional(),
  title: z.string().trim().min(1, "Title is required").optional(),
  value: optionalValue,
  status: dealStatusEnum.optional(),
});

export const dealStatusSchema = z.object({
  id: z.string().uuid("Invalid deal id"),
  status: dealStatusEnum,
});

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export const noteCreateSchema = z
  .object({
    body: z.string().trim().min(1, "Note body is required"),
    clientId: z.preprocess(emptyToUndefined, z.string().uuid("Invalid client id").optional()),
    dealId: z.preprocess(emptyToUndefined, z.string().uuid("Invalid deal id").optional()),
  })
  .refine((data) => Boolean(data.clientId) !== Boolean(data.dealId), {
    message: "Provide exactly one of clientId or dealId",
    path: ["clientId"],
  });

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export const idSchema = z.object({
  id: z.string().uuid("Invalid id"),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type ClientCreateInput = z.infer<typeof clientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;
export type DealCreateInput = z.infer<typeof dealCreateSchema>;
export type DealUpdateInput = z.infer<typeof dealUpdateSchema>;
export type DealStatusInput = z.infer<typeof dealStatusSchema>;
export type NoteCreateInput = z.infer<typeof noteCreateSchema>;
export type IdInput = z.infer<typeof idSchema>;
export type DealStatusValue = z.infer<typeof dealStatusEnum>;
