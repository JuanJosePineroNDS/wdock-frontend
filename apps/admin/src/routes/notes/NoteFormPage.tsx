import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateNote, useNote, useUpdateNote } from '@/features/notes/hooks';

const noteSchema = z.object({
  title: z.string().trim().min(1, { message: 'Title is required' }).max(200),
  body: z.string().trim().optional(),
  pinned: z.boolean().optional(),
});

type NoteFormValues = z.infer<typeof noteSchema>;

export function NoteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const noteQuery = useNote(isEdit ? id : undefined);
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: '', body: '', pinned: false },
  });

  useEffect(() => {
    if (isEdit && noteQuery.data) {
      form.reset({
        title: noteQuery.data.title,
        body: noteQuery.data.body ?? '',
        pinned: noteQuery.data.pinned ?? false,
      });
    }
  }, [form, isEdit, noteQuery.data]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      title: values.title,
      body: values.body ?? '',
      pinned: Boolean(values.pinned),
    };
    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, body: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate('/notes', { replace: true });
  });

  const submitError = createMutation.isError || updateMutation.isError;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? 'Edit note' : 'New note'}
        </h1>
        <p className="text-sm text-muted-foreground">
          <Link to="/notes" className="hover:underline">
            ← Back to notes
          </Link>
        </p>
      </div>

      {isEdit && noteQuery.isLoading && (
        <p role="status" className="text-sm text-slate-500">Loading note…</p>
      )}
      {isEdit && noteQuery.isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load note</AlertTitle>
          <AlertDescription>Please try again later.</AlertDescription>
        </Alert>
      )}

      {(!isEdit || noteQuery.data) && (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {submitError && (
                <Alert variant="destructive" data-testid="note-submit-error">
                  <AlertTitle>Could not save note</AlertTitle>
                  <AlertDescription>Please try again later.</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  aria-invalid={Boolean(form.formState.errors.title)}
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-body">Body</Label>
                <textarea
                  id="note-body"
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...form.register('body')}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  {...form.register('pinned')}
                />
                Pinned
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/notes')}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? 'Saving…'
                    : isEdit
                      ? 'Save changes'
                      : 'Create note'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
