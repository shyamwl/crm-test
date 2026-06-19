import type { DealStatusValue } from "@/lib/validation/crm";

/** Format a numeric deal value (string|number|null from the DB) as USD. */
export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

/** Human label per deal status. */
export const dealStatusLabels: Record<DealStatusValue, string> = {
  open: "Open",
  won: "Won",
  lost: "Lost",
};

/** Badge variant per deal status (shadcn Badge variants). */
export const dealStatusBadgeVariant: Record<
  DealStatusValue,
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "default",
  won: "secondary",
  lost: "destructive",
};

export const dealStatusValues: DealStatusValue[] = ["open", "won", "lost"];
