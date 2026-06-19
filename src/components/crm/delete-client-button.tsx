"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { deleteClient } from "@/lib/actions/clients";

interface DeleteClientButtonProps {
  clientId: string;
  /** When provided, navigate here after a successful delete (e.g. list page). */
  redirectTo?: string;
}

/**
 * Destructive button that confirms via a dialog before deleting a client and
 * all of its associated deals and notes.
 */
export function DeleteClientButton({ clientId, redirectTo }: DeleteClientButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteClient({ id: clientId });

      if (result.ok) {
        toast.success("Client deleted");
        setOpen(false);
        if (redirectTo) {
          router.push(redirectTo);
        }
        return;
      }

      toast.error(result.error);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete client?</DialogTitle>
          <DialogDescription>
            This also deletes their deals and notes. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Spinner size="sm" className="text-current" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
