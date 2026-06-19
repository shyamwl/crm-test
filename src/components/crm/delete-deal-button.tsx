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
import { deleteDeal } from "@/lib/actions/deals";

interface DeleteDealButtonProps {
  dealId: string;
  /** When provided, navigate here after a successful delete. */
  redirectTo?: string;
}

/**
 * Ghost icon button that confirms via a dialog before deleting a deal.
 */
export function DeleteDealButton({ dealId, redirectTo }: DeleteDealButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteDeal({ id: dealId });

      if (result.ok) {
        toast.success("Deal deleted");
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
        <Button variant="ghost" size="icon" aria-label="Delete deal">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete deal?</DialogTitle>
          <DialogDescription>
            This also deletes the deal&apos;s notes. This action cannot be undone.
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
