import Link from "next/link";
import { ClientFormDialog } from "@/components/crm/client-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClients } from "@/lib/queries/crm";
import { requireAuth } from "@/lib/session";

/**
 * Clients list page. Renders all of the current user's clients in a table, with
 * an action to create a new client. Shows a friendly empty state when the user
 * has no clients yet.
 */
export default async function ClientsPage() {
  // Protected page: redirects to home when unauthenticated.
  await requireAuth();

  const clients = await getClients();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Clients</h1>
          <ClientFormDialog mode="create" trigger={<Button>New Client</Button>} />
        </div>

        {clients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-muted-foreground text-sm">
                No clients yet. Add your first client.
              </p>
              <ClientFormDialog mode="create" trigger={<Button>New Client</Button>} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <Link
                            href={`/clients/${client.id}`}
                            className="text-primary font-medium hover:underline"
                          >
                            {client.name}
                          </Link>
                        </TableCell>
                        <TableCell>{client.company ?? "—"}</TableCell>
                        <TableCell>{client.email ?? "—"}</TableCell>
                        <TableCell>{client.phone ?? "—"}</TableCell>
                        <TableCell>{client.createdAt.toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
