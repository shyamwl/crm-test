import Link from "next/link";
import { DollarSign, Briefcase, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/crm-format";
import { getDashboardStats, getOpenDeals } from "@/lib/queries/crm";
import { requireAuth } from "@/lib/session";

export default async function DashboardPage() {
  // Redirects to home when unauthenticated.
  await requireAuth();

  // Both queries are user-scoped; fetch concurrently to reduce latency.
  const [stats, openDeals] = await Promise.all([getDashboardStats(), getOpenDeals()]);

  const summaryCards = [
    {
      label: "Total Clients",
      value: stats.totalClients.toLocaleString(),
      icon: Users,
    },
    {
      label: "Open Deals",
      value: stats.openDealsCount.toLocaleString(),
      icon: Briefcase,
    },
    {
      label: "Open Pipeline",
      value: formatCurrency(stats.openPipelineValue),
      icon: DollarSign,
    },
    {
      label: "Won / Lost",
      value: `${stats.wonCount} / ${stats.lostCount}`,
      icon: Trophy,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your open opportunities at a glance</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>{label}</CardDescription>
                <Icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Open Opportunities</CardTitle>
            <CardDescription>Deals you are currently working to close</CardDescription>
          </CardHeader>
          <CardContent>
            {openDeals.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No open opportunities. Create a deal to get started.
                </p>
                <Button asChild>
                  <Link href="/deals">Create a deal</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openDeals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">{deal.title}</TableCell>
                        <TableCell>
                          <Link
                            href={`/clients/${deal.clientId}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {deal.clientName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(deal.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/clients">View Clients</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/deals">View Deals</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
