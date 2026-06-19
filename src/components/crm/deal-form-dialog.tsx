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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { createDeal, updateDeal } from "@/lib/actions/deals";
import { dealStatusLabels, dealStatusValues } from "@/lib/crm-format";
import type { DealStatusValue } from "@/lib/validation/crm";

/** Minimal deal shape required to pre-fill the edit form. */
interface DealFormDialogDeal {
  id: string;
  title: string;
  value: string | null;
  status: DealStatusValue;
  clientId: string;
}

interface DealFormDialogProps {
  mode: "create" | "edit";
  deal?: DealFormDialogDeal;
  clients: { id: string; name: string }[];
  /** When set, the client picker is hidden and this id is always used. */
  fixedClientId?: string;
  trigger: React.ReactNode;
}

/**
 * Dialog wrapping a create/edit form for a CRM deal. When `fixedClientId` is
 * supplied (e.g. on a client detail page) the client picker is hidden and the
 * deal is always associated with that client.
 */
export function DealFormDialog({
  mode,
  deal,
  clients,
  fixedClientId,
  trigger,
}: DealFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  // Controlled values for the Select components, which do not participate in the
  // native FormData flow.
  const initialClientId = fixedClientId ?? deal?.clientId ?? "";
  const [clientId, setClientId] = React.useState(initialClientId);
  const [status, setStatus] = React.useState<DealStatusValue>(deal?.status ?? "open");

  // Reset controlled state and validation errors to their defaults whenever the
  // dialog opens or closes so the form always reflects the latest props.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setClientId(fixedClientId ?? deal?.clientId ?? "");
      setStatus(deal?.status ?? "open");
    } else {
      setFieldErrors({});
    }
    setOpen(next);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "");
    // The action's schema expects an optional number; treat an empty input as
    // omitted and otherwise hand off the parsed numeric value.
    const rawValue = String(formData.get("value") ?? "").trim();
    const value = rawValue === "" ? undefined : Number(rawValue);
    const resolvedClientId = fixedClientId ?? clientId;

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createDeal({
              clientId: resolvedClientId,
              title,
              value,
              status,
            })
          : await updateDeal({
              id: deal!.id,
              clientId: resolvedClientId,
              title,
              value,
              status,
            });

      if (result.ok) {
        toast.success(mode === "create" ? "Deal created" : "Deal updated");
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
          <DialogTitle>{mode === "create" ? "New deal" : "Edit deal"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new deal to your pipeline." : "Update this deal's details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!fixedClientId && (
            <div className="space-y-2">
              <Label htmlFor="deal-client">Client</Label>
              <Select value={clientId} onValueChange={setClientId} disabled={isPending}>
                <SelectTrigger id="deal-client" className="w-full">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.clientId?.map((message) => (
                <p key={message} className="text-destructive text-sm">
                  {message}
                </p>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="deal-title">Title</Label>
            <Input
              id="deal-title"
              name="title"
              defaultValue={deal?.title ?? ""}
              placeholder="Enterprise plan"
              required
              disabled={isPending}
              aria-invalid={fieldErrors.title ? true : undefined}
            />
            {fieldErrors.title?.map((message) => (
              <p key={message} className="text-destructive text-sm">
                {message}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="deal-value">Value</Label>
            <Input
              id="deal-value"
              name="value"
              type="number"
              min={0}
              step="any"
              defaultValue={deal?.value ?? ""}
              placeholder="0"
              disabled={isPending}
              aria-invalid={fieldErrors.value ? true : undefined}
            />
            {fieldErrors.value?.map((message) => (
              <p key={message} className="text-destructive text-sm">
                {message}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="deal-status">Status</Label>
            <Select
              value={status}
              onValueChange={(next) => setStatus(next as DealStatusValue)}
              disabled={isPending}
            >
              <SelectTrigger id="deal-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dealStatusValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {dealStatusLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.status?.map((message) => (
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
              {mode === "create" ? "Create deal" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
