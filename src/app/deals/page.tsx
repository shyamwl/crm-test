import Link from "next/link";
import { DealFormDialog } from "@/components/crm/deal-form-dialog";
import { DealStatusSelect } from "@/components/crm/deal-status-select";
import { DeleteDealButton } from "@/components/crm/delete-deal-button";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dealStatusValues, formatCurrency } from "@/lib/crm-format";
import { getClientOptions, getDeals } from "@/lib/queries/crm";
import { requireAuth } from "@/lib/session";
import type { DealStatusValue } from "@/lib/validation/crm";

/** Status filter options, including the catch-all "all" pseudo-status. */
const filterOptions = ["all", ...dealStatusValues] as const;
type FilterOption = (typeof filterOptions)[number];

/** Human label for each filter tab. */
const filterLabels: Record<FilterOption, string> = {
  all: "All",
  open: "Open",
  won: "Won",
  lost: "Lost",
};

/** Empty-state copy per active filter. */
const emptyStateLabels: Record<FilterOption, string> = {
  all: "No deals yet.",
  open: "No open deals.",
  won: "No won deals.",
  lost: "No lost deals.",
};

/**
 * Narrows an arbitrary query-param string to a known filter option, falling
 * back to "all" for any missing or invalid value.
 */
function resolveFilter(status: string | undefined): FilterOption {
  return (filterOptions as readonly string[]).includes(status ?? "")
    ? (status as FilterOption)
    : "all";
}

interface DealsPageProps {
  // In Next.js 16, searchParams is provided as a Promise.
  searchParams: Promise<{ status?: string }>;
}

/**
 * Deals index page. Lists the current user's deals with an inline status
 * filter, a creation dialog, and per-row status/delete controls.
 */
export default async function DealsPage({ searchParams }: DealsPageProps) {
  await requireAuth();

  const { status } = await searchParams;
  const filter = resolveFilter(status);

  // Fetch the client options (for the create dialog) alongside the filtered
  // deals; the two queries are independent so they run concurrently.
  const [clientOptions, deals] = await Promise.all([
    getClientOptions(),
    getDeals(filter === "all" ? undefined : (filter as DealStatusValue)),
  ]);

  const hasClients = clientOptions.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Deals</h1>
          {hasClients ? (
            <DealFormDialog
              mode="create"
              clients={clientOptions}
              trigger={<Button>New Deal</Button>}
            />
          ) : (
            // Deals require a client, so steer the user to create one first.
            <Button asChild variant="outline">
              <Link href="/clients">Add a client first</Link>
            </Button>
          )}
        </div>

        <nav aria-label="Filter deals by status" className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const isActive = option === filter;
            const href = option === "all" ? "/deals" : `/deals?status=${option}`;

            return (
              <Button key={option} asChild size="sm" variant={isActive ? "default" : "outline"}>
                <Link href={href} aria-current={isActive ? "page" : undefined}>
                  {filterLabels[option]}
                </Link>
              </Button>
            );
          })}
        </nav>

        {deals.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyStateLabels[filter]}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>
                      <Link
                        href={`/clients/${deal.clientId}`}
                        className="text-primary hover:underline"
                      >
                        {deal.clientName}
                      </Link>
                    </TableCell>
                    <TableCell>{formatCurrency(deal.value)}</TableCell>
                    <TableCell>
                      <DealStatusSelect dealId={deal.id} status={deal.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {deal.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteDealButton dealId={deal.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
