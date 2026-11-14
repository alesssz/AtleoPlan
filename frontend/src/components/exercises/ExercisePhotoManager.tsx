/*
 * The photos of a personal exercise, on its edit page: add them (picked or
 * dropped), see each one's upload advance, put them in order, remove them.
 *
 * Every change is sent at once, one request each, apart from the form's
 * Save: a photo is a file on the server, not a field of the exercise. After
 * each answer the exercise is read again (the hooks of src/api/exercises.ts),
 * and the list below shows what the server has.
 *
 * Three kinds of rows:
 * - the photos already saved, the first marked Cover, each with Move
 *   earlier, Move later and Remove;
 * - the uploads under way, with their bar, or their error with Retry and
 *   Dismiss;
 * - the drop zone with Add photos, while there is room (5 at most).
 *
 * The limits are checked here before sending, so a wrong file gets its
 * message at once; the server checks them again.
 */
import { ArrowDown, ArrowUp, ImagePlus, RotateCcw, Trash2, TriangleAlert, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MAX_PHOTO_BYTES,
  MAX_PHOTOS,
  PHOTO_TYPES,
  useDeleteExercisePhoto,
  useReorderExercisePhotos,
  useUploadExercisePhoto,
  type Exercise,
  type ExercisePhoto,
} from '@/api/exercises'
import { FormBanner } from '@/components/FormBanner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/http'
import { cn } from '@/lib/utils'

/** One file being sent, or that failed. */
interface PendingUpload {
  /** Two files may share a name. */
  key: string
  file: File
  /** A blob: URL, for the preview before the server has it. */
  preview: string
  share: number
  /** The reason it failed, in the user's language; null while it is going. */
  error: string | null
}

interface ExercisePhotoManagerProps {
  exercise: Exercise
}

export function ExercisePhotoManager({ exercise }: ExercisePhotoManagerProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const uploadPhoto = useUploadExercisePhoto(exercise.id)
  const removePhoto = useDeleteExercisePhoto(exercise.id)
  const reorder = useReorderExercisePhotos(exercise.id)
  // Failed uploads do not count: they will be retried or dismissed
  const photos = exercise.photos
  const room = MAX_PHOTOS - photos.length - pending.filter(upload => upload.error === null).length

  // The previews hold their files in memory until revoked. The ref gives
  // the unmount clean-up the current list, not the first, empty one
  const pendingRef = useRef(pending)
  useEffect(() => {
    pendingRef.current = pending
  }, [pending])
  useEffect(() => () => {
    for (const upload of pendingRef.current) URL.revokeObjectURL(upload.preview)
  }, [])

  /**
   * Changes one upload of the list, found by its key.
   */
  function patch(key: string, change: Partial<PendingUpload>) {
    // The updater form: several uploads change the list in turn, and each
    // must start from the others' changes
    setPending(list => list.map(upload => upload.key === key ? { ...upload, ...change } : upload))
  }

  /**
   * Takes one upload off the list and frees its preview.
   */
  function drop(upload: PendingUpload) {
    URL.revokeObjectURL(upload.preview)
    setPending(list => list.filter(item => item.key !== upload.key))
  }

  /**
   * Sends one file, moving its bar; on success it leaves the list (the
   * exercise, read again, shows it among the photos), on failure it stays
   * with the reason.
   */
  async function send(upload: PendingUpload) {
    patch(upload.key, { share: 0, error: null })
    try {
      await uploadPhoto.mutateAsync({ file: upload.file, onProgress: share => patch(upload.key, { share }) })
      drop(upload)
    }
    catch (error) {
      // The server's message for a 422, ours otherwise
      const reason = error instanceof ApiError && error.fieldErrors.photo?.[0]
        ? error.fieldErrors.photo[0]
        : t(error instanceof ApiError && error.status === 0 ? 'exercises.photos.offline' : 'exercises.photos.failed')
      patch(upload.key, { error: reason })
    }
  }

  /**
   * Checks the files picked or dropped, then sends those that pass, one
   * after the other: in order, and without many large files at once on a
   * phone's connection.
   * @param files the files, as the input or the drop gives them
   */
  async function addFiles(files: FileList | File[]) {
    const accepted: File[] = []
    let refused: string | null = null
    // The first reason is the one shown
    for (const file of Array.from(files)) {
      if (!PHOTO_TYPES.includes(file.type)) refused ??= t('exercises.photos.wrongType', { name: file.name })
      else if (file.size > MAX_PHOTO_BYTES) refused ??= t('exercises.photos.tooBig', { name: file.name })
      else if (accepted.length >= room) refused ??= t('exercises.photos.tooMany', { max: MAX_PHOTOS })
      else accepted.push(file)
    }
    setNotice(refused)

    const uploads = accepted.map(file => ({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file), share: 0, error: null }))
    setPending(list => [...list, ...uploads])
    for (const upload of uploads) await send(upload)
  }

  /**
   * Moves a photo one place earlier (-1) or later (+1), and sends the new order.
   * @param step -1 or +1
   */
  function move(index: number, step: -1 | 1) {
    const ids = photos.map(photo => photo.id)
    const [moved] = ids.splice(index, 1)
    if (moved === undefined) return
    ids.splice(index + step, 0, moved)
    reorder.mutate(ids)
  }

  /**
   * preventDefault(): the browser would open a dropped photo in place of the app.
   */
  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    // addFiles() handles its own errors
    if (room > 0) void addFiles(event.dataTransfer.files)
  }

  return (
    <section aria-labelledby="photos-title" className="flex flex-col gap-4 rounded-3xl border bg-card/60 p-6 backdrop-blur sm:p-8">
      {/* The limits, stated next to the field */}
      <div>
        <h2 id="photos-title" className="font-heading text-lg font-extrabold tracking-tight">{t('exercises.photos.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('exercises.photos.hint', { max: MAX_PHOTOS })}</p>
      </div>

      {notice && <FormBanner variant="error">{notice}</FormBanner>}
      {(reorder.isError || removePhoto.isError) && <FormBanner variant="error">{t('exercises.photos.changeFailed')}</FormBanner>}

      {photos.length > 0 && (
        <ol className="flex flex-col gap-2">
          {photos.map((photo, index) => (
            <li key={photo.id} className="flex items-center gap-3 rounded-2xl border bg-background/40 p-2">
              <img src={photo.thumb_url} alt={t('exercises.detail.photoAlt', { name: exercise.name, number: index + 1 })} className="size-16 shrink-0 rounded-xl bg-muted object-cover" />
              <div className="min-w-0 flex-1">
                {index === 0
                  ? <Badge>{t('exercises.photos.cover')}</Badge>
                  : <span className="text-sm text-muted-foreground">{t('exercises.photos.number', { number: index + 1 })}</span>}
              </div>
              {/* Each icon-only button's label is also its tooltip
                  */}
              <Button
                variant="ghost"
                size="icon-xl"
                aria-label={t('exercises.photos.earlier', { number: index + 1 })}
                title={t('exercises.photos.earlier', { number: index + 1 })}
                disabled={index === 0 || reorder.isPending}
                onClick={() => move(index, -1)}
              >
                <ArrowUp aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xl"
                aria-label={t('exercises.photos.later', { number: index + 1 })}
                title={t('exercises.photos.later', { number: index + 1 })}
                disabled={index === photos.length - 1 || reorder.isPending}
                onClick={() => move(index, 1)}
              >
                <ArrowDown aria-hidden="true" />
              </Button>
              <RemovePhotoButton photo={photo} number={index + 1} onRemove={() => removePhoto.mutateAsync(photo.id)} />
            </li>
          ))}
        </ol>
      )}

      {pending.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pending.map(upload => (
            <li key={upload.key} className="flex items-center gap-3 rounded-2xl border bg-background/40 p-2">
              <img src={upload.preview} alt="" className="size-16 shrink-0 rounded-xl bg-muted object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{upload.file.name}</p>
                {upload.error === null
                  // Native, so screen readers read a percentage
                  ? (
                      <progress
                        value={upload.share}
                        max={1}
                        aria-label={t('exercises.photos.uploading', { name: upload.file.name })}
                        className="mt-2 h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary"
                      />
                    )
                  : (
                      <p role="alert" className="mt-1 flex items-center gap-1.5 text-sm text-destructive">
                        <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
                        {upload.error}
                      </p>
                    )}
              </div>
              {upload.error !== null && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-xl"
                    aria-label={t('exercises.photos.retry', { name: upload.file.name })}
                    title={t('exercises.photos.retry', { name: upload.file.name })}
                    onClick={() => void send(upload)}
                  >
                    <RotateCcw aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xl"
                    aria-label={t('exercises.photos.dismiss', { name: upload.file.name })}
                    title={t('exercises.photos.dismiss', { name: upload.file.name })}
                    onClick={() => drop(upload)}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* The drop zone is the hidden input's label, so a click opens the
          picker. `accept` also makes an iPhone send a JPEG rather than a
          HEIC */}
      {room > 0 && (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground',
            dragging && 'border-primary bg-primary/10 text-foreground',
          )}
        >
          <ImagePlus aria-hidden="true" className="size-6 text-primary" />
          {t('exercises.photos.add')}
          <span className="font-normal">{t('exercises.photos.drop')}</span>
          <input
            id={inputId}
            type="file"
            accept={PHOTO_TYPES.join(',')}
            multiple
            className="sr-only"
            onChange={(event) => {
              // Emptied, so choosing the same file again still fires onChange
              const files = Array.from(event.target.files ?? [])
              event.target.value = ''
              void addFiles(files)
            }}
          />
        </label>
      )}
    </section>
  )
}

interface RemovePhotoButtonProps {
  photo: ExercisePhoto
  /** From 1, for the labels. */
  number: number
  /** The dialog closes when it resolves. */
  onRemove: () => Promise<unknown>
}

/**
 * Remove, behind a question: the file is deleted on the server for good.
 * The same dialog as deleting an exercise (ExerciseDetailPage).
 */
function RemovePhotoButton({ photo, number, onRemove }: RemovePhotoButtonProps) {
  const { t } = useTranslation()
  // Controlled, so it can close when the request ends
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-xl" aria-label={t('exercises.photos.remove', { number })} title={t('exercises.photos.remove', { number })}>
          <Trash2 aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('exercises.photos.removeTitle', { number })}</AlertDialogTitle>
          <AlertDialogDescription>{t('exercises.photos.removeText')}</AlertDialogDescription>
        </AlertDialogHeader>
        {/* So there is no doubt which */}
        <img src={photo.thumb_url} alt="" className="size-24 self-center rounded-xl bg-muted object-cover" />
        <AlertDialogFooter>
          <AlertDialogCancel>{t('exercises.detail.cancel')}</AlertDialogCancel>
          {/* Open until the request is done; an error shows in the section's
              banner */}
          <AlertDialogAction
            variant="destructive"
            pending={busy}
            onClick={(event) => {
              event.preventDefault()
              setBusy(true)
              onRemove().catch(() => undefined).finally(() => {
                setBusy(false)
                setOpen(false)
              })
            }}
          >
            {t('exercises.photos.removeConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
