"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { deleteNote } from "@/lib/actions/notes";

interface Note {
  id: string;
  body: string;
  createdAt: Date;
}

interface NoteListProps {
  notes: Note[];
}

/**
 * Renders notes newest-first as cards. Shows a muted empty state when there are
 * no notes. Each note has an inline delete control.
 */
export function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return <p className="text-muted-foreground text-sm">No notes yet.</p>;
  }

  // Sort a copy newest-first so the original prop array is not mutated.
  const sorted = [...notes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="space-y-2">
      {sorted.map((note) => (
        <NoteRow key={note.id} note={note} />
      ))}
    </div>
  );
}

/** A single note card with body, formatted date, and inline delete. */
function NoteRow({ note }: { note: Note }) {
  const [isPending, startTransition] = React.useTransition();

  const formattedDate = note.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteNote({ id: note.id });

      if (result.ok) {
        toast.success("Note deleted");
        return;
      }

      toast.error(result.error);
    });
  };

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm break-words whitespace-pre-wrap">{note.body}</p>
          <p className="text-muted-foreground text-xs">{formattedDate}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Delete note"
          onClick={handleDelete}
          disabled={isPending}
          className="shrink-0"
        >
          {isPending ? (
            <Spinner size="sm" className="text-current" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
