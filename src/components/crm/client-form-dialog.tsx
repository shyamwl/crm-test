"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { createClient, updateClient } from "@/lib/actions/clients";

/** Minimal client shape required to pre-fill the edit form. */
interface ClientFormDialogClient {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
}

interface ClientFormDialogProps {
  mode: "create" | "edit";
  client?: ClientFormDialogClient;
  trigger: React.ReactNode;
}

/**
 * Dialog wrapping a create/edit form for a CRM client. The provided `trigger`
 * opens the dialog; on success the dialog closes, the form resets, and a toast
 * is shown. Server-side `revalidatePath` handles cache invalidation.
 */
export function ClientFormDialog({ mode, client, trigger }: ClientFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  // Clear stale validation messages when the dialog is dismissed.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setFieldErrors({});
    }
    setOpen(next);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const company = String(formData.get("company") ?? "");
    const phone = String(formData.get("phone") ?? "");

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createClient({ name, email, company, phone })
          : await updateClient({ id: client!.id, name, email, company, phone });

      if (result.ok) {
        toast.success(mode === "create" ? "Client created" : "Client updated");
        setOpen(false);
        return;
      }

      setFieldErrors(result.fieldErrors ?? {});
      toast.error(result.error);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New client" : "Edit client"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new client to your CRM." : "Update this client's details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Name</Label>
            <Input
              id="client-name"
              name="name"
              defaultValue={client?.name ?? ""}
              placeholder="Acme Inc."
              required
              disabled={isPending}
              aria-invalid={fieldErrors.name ? true : undefined}
            />
            {fieldErrors.name?.map((message) => (
              <p key={message} className="text-destructive text-sm">
                {message}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              name="email"
              type="email"
              defaultValue={client?.email ?? ""}
              placeholder="contact@acme.com"
              disabled={isPending}
              aria-invalid={fieldErrors.email ? true : undefined}
            />
            {fieldErrors.email?.map((message) => (
              <p key={message} className="text-destructive text-sm">
                {message}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-company">Company</Label>
            <Input
              id="client-company"
              name="company"
              defaultValue={client?.company ?? ""}
              placeholder="Acme Inc."
              disabled={isPending}
              aria-invalid={fieldErrors.company ? true : undefined}
            />
            {fieldErrors.company?.map((message) => (
              <p key={message} className="text-destructive text-sm">
                {message}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-phone">Phone</Label>
            <Input
              id="client-phone"
              name="phone"
              type="tel"
              defaultValue={client?.phone ?? ""}
              placeholder="+1 555 123 4567"
              disabled={isPending}
              aria-invalid={fieldErrors.phone ? true : undefined}
            />
            {fieldErrors.phone?.map((message) => (
              <p key={message} className="text-destructive text-sm">
                {message}
              </p>
            ))}
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner size="sm" className="text-current" />}
              {mode === "create" ? "Create client" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
