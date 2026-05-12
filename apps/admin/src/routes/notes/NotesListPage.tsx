import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pin, PinOff, Plus, Trash2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Note, useDeleteNote, useNotes, useUpdateNote } from '@/features/notes/hooks';

export function NotesListPage() {
  const [search, setSearch] = useState('');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const notesQuery = useNotes({
    search: search || undefined,
    pinned: pinnedOnly || undefined,
    page,
  });

  const deleteMutation = useDeleteNote();
  const updateMutation = useUpdateNote();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground">
            Your personal notes. Example CRUD feature included in the template.
          </p>
        </div>
        <Link
          to="/notes/new"
          className="inline-flex h-10 items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden /> New note
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] space-y-1">
          <Label htmlFor="notes-search">Search</Label>
          <Input
            id="notes-search"
            type="search"
            placeholder="Search by title or body…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={pinnedOnly}
            onChange={(e) => {
              setPinnedOnly(e.target.checked);
              setPage(1);
            }}
          />
          Pinned only
        </label>
      </div>

      {notesQuery.isLoading && (
        <p role="status" className="text-sm text-slate-500">
          Loading notes…
        </p>
      )}
      {notesQuery.isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load notes</AlertTitle>
          <AlertDescription>Please try again later.</AlertDescription>
        </Alert>
      )}

      {notesQuery.data && notesQuery.data.results.length === 0 && (
        <p className="text-sm text-slate-500">No notes yet.</p>
      )}

      {notesQuery.data && notesQuery.data.results.length > 0 && (
        <NotesTable
          notes={notesQuery.data.results}
          onTogglePin={(note) =>
            updateMutation.mutate({ id: note.id, body: { pinned: !note.pinned } })
          }
          onDelete={(id) => deleteMutation.mutate(id)}
          busyId={deleteMutation.isPending ? (deleteMutation.variables as string) : null}
        />
      )}

      {notesQuery.data && (notesQuery.data.next || notesQuery.data.previous) && (
        <div className="flex items-center justify-between text-sm">
          <Button
            variant="ghost"
            disabled={!notesQuery.data.previous}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-slate-500">Total: {notesQuery.data.count}</span>
          <Button
            variant="ghost"
            disabled={!notesQuery.data.next}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

interface NotesTableProps {
  notes: Note[];
  onTogglePin: (note: Note) => void;
  onDelete: (id: string) => void;
  busyId: string | null;
}

function NotesTable({ notes, onTogglePin, onDelete, busyId }: NotesTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 w-10"></th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => (
            <tr key={note.id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-900"
                  onClick={() => onTogglePin(note)}
                  aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                >
                  {note.pinned ? (
                    <Pin className="h-4 w-4 fill-current" aria-hidden />
                  ) : (
                    <PinOff className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </td>
              <td className="px-4 py-3">
                <Link to={`/notes/${note.id}/edit`} className="font-medium hover:underline">
                  {note.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-500">{formatDateTime(note.updated_at)}</td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Delete this note?')) onDelete(note.id);
                  }}
                  disabled={busyId === note.id}
                  aria-label={`Delete ${note.title}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
