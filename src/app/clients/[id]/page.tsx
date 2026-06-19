import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClientFormDialog } from "@/components/crm/client-form-dialog";
import { DealFormDialog } from "@/components/crm/deal-form-dialog";
import { DealStatusSelect } from "@/components/crm/deal-status-select";
import { DeleteClientButton } from "@/components/crm/delete-client-button";
import { DeleteDealButton } from "@/components/crm/delete-deal-button";
import { NoteForm } from "@/components/crm/note-form";
import { NoteList } from "@/components/crm/note-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/crm-format";
import { getClientOptions, getClientWithRelations } from "@/lib/queries/crm";
import { requireAuth } from "@/lib/session";

interface ClientDetailPageProps {
  // In Next.js 16 dynamic route params are async.
  params: Promise<{ id: string }>;
}

/**
 * Renders a single contact field with a fallback dash when the value is empty.
 */
function ContactField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="text-sm">{value ? value : "—"}</p>
    </div>
  );
}

/**
 * Client detail page. Shows the client's contact info alongside its deals and
 * notes, with inline create/edit/delete actions for each.
 */
export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  // Protected page: redirects to home when unauthenticated.
  await requireAuth();

  const { id } = await params;

  const [data, clientOptions] = await Promise.all([getClientWithRelations(id), getClientOptions()]);

  if (!data) {
    notFound();
  }

  const { client, deals, notes } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link
          href="/clients"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">{client.name}</h1>
            {client.company ? <p className="text-muted-foreground">{client.company}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <ClientFormDialog
              mode="edit"
              client={{
                id: client.id,
                name: client.name,
                email: client.email,
                company: client.company,
                phone: client.phone,
              }}
              trigger={
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              }
            />
            <DeleteClientButton clientId={client.id} redirectTo="/clients" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ContactField label="Email" value={client.email} />
            <ContactField label="Phone" value={client.phone} />
            <ContactField label="Company" value={client.company} />
            <ContactField label="Created" value={client.createdAt.toLocaleDateString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle>Deals</CardTitle>
            <DealFormDialog
              mode="create"
              fixedClientId={client.id}
              clients={clientOptions}
              trigger={<Button size="sm">New Deal</Button>}
            />
          </CardHeader>
          <CardContent className="px-0">
            {deals.length === 0 ? (
              <p className="text-muted-foreground px-6 text-sm">No deals yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">{deal.title}</TableCell>
                        <TableCell>{formatCurrency(deal.value)}</TableCell>
                        <TableCell>
                          <DealStatusSelect dealId={deal.id} status={deal.status} />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <NoteForm clientId={client.id} />
            <NoteList notes={notes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
