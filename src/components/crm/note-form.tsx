"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createNote } from "@/lib/actions/notes";

interface NoteFormProps {
  /** Associate the note with a client. Provide exactly one of clientId/dealId. */
  clientId?: string;
  /** Associate the note with a deal. Provide exactly one of clientId/dealId. */
  dealId?: string;
}

/**
 * Compact form for adding a note to a client or deal. The textarea clears on a
 * successful submit; the server action handles cache revalidation.
 */
export function NoteForm({ clientId, dealId }: NoteFormProps) {
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      // `createNote` requires exactly one association; forward whichever was
      // supplied to this form instance.
      const result = await createNote(clientId ? { body, clientId } : { body, dealId });

      if (result.ok) {
        toast.success("Note added");
        setBody("");
        return;
      }

      // Surface the most relevant field error inline when present.
      const fieldError = result.fieldErrors?.body?.[0] ?? result.fieldErrors?.clientId?.[0];
      setError(fieldError ?? result.error);
      toast.error(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Add a note…"
        disabled={isPending}
        aria-invalid={error ? true : undefined}
        aria-label="Note body"
      />
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending || body.trim() === ""}>
          {isPending && <Spinner size="sm" className="text-current" />}
          Add note
        </Button>
      </div>
    </form>
  );
}
