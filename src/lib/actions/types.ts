/**
 * Discriminated result type returned by all CRM server actions.
 *
 * `ok: true` carries optional `data`; `ok: false` carries a human-readable
 * `error` message and optional per-field validation errors keyed by field name.
 */
export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
