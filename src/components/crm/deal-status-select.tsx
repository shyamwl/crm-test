"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateDealStatus } from "@/lib/actions/deals";
import { dealStatusLabels, dealStatusValues } from "@/lib/crm-format";
import type { DealStatusValue } from "@/lib/validation/crm";

interface DealStatusSelectProps {
  dealId: string;
  status: DealStatusValue;
}

/**
 * Inline select for changing a deal's status in place. Uses `useOptimistic` so
 * the chosen value is reflected immediately while the server action runs; on
 * failure the optimistic value is discarded and the server value is restored.
 */
export function DealStatusSelect({ dealId, status }: DealStatusSelectProps) {
  const [isPending, startTransition] = React.useTransition();
  const [optimisticStatus, setOptimisticStatus] = React.useOptimistic(status);

  const handleChange = (next: string) => {
    const nextStatus = next as DealStatusValue;

    startTransition(async () => {
      setOptimisticStatus(nextStatus);
      const result = await updateDealStatus({ id: dealId, status: nextStatus });

      if (result.ok) {
        toast.success("Status updated");
        return;
      }

      // The optimistic value reverts automatically once the transition ends
      // without a matching server update.
      toast.error(result.error);
    });
  };

  return (
    <Select value={optimisticStatus} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger size="sm" aria-label="Deal status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {dealStatusValues.map((statusValue) => (
          <SelectItem key={statusValue} value={statusValue}>
            {dealStatusLabels[statusValue]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
