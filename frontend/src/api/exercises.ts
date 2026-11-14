/*
 * The exercise library's API (backend docs/concepts/C2-backend.md C2.5.4): the
 * list with search, filters and pages, one exercise, creating, changing
 * and deleting personal ones, their photos, and Duplicate as mine
 * (C2.5.9). Like every file in src/api/: the types, the
 * cache keys, the functions that call the API and the hooks components use
 * (docs/concepts/C1-frontend.md C1.6, C1.14).
 *
 * Two TanStack Query tools are new here:
 * - useInfiniteQuery, for a list that arrives one page at a time: the pages
 *   are kept together under one key, and fetchNextPage() asks for the next;
 * - mutations that refresh the cache after a change: invalidateQueries()
 *   marks the lists as old, so they are read again.
 *
 * Texts come in the request's language, so the language is part of every
 * key: switching language reads the library again instead of showing names
 * cached in the old one.
 */
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Equipment } from '@/api/equipment'
import type { Muscle } from '@/api/muscles'
import { request, upload } from '@/lib/http'

/**
 * How the sets of an exercise are logged (backend app/Enums/LoggingType.php):
 * a weight and reps, reps only, a time, a distance.
 */
export type LoggingType = 'weight_reps' | 'reps' | 'time' | 'distance'

/** The four logging types, in the order the editor offers them. */
export const LOGGING_TYPES: readonly LoggingType[] = ['weight_reps', 'reps', 'time', 'distance']

/** A muscle as part of an exercise: the muscle and its role in it. */
export interface ExerciseMuscle extends Muscle {
  /** A main target of the exercise, or a muscle that helps. */
  role: 'primary' | 'secondary'
}

/**
 * One photo of an exercise (backend ExercisePhotoResource). Both addresses
 * are paths on the app's own address; until the server's queue has made the
 * smaller copies, a moment after an upload, both are the original's.
 */
export interface ExercisePhoto {
  /** The row of the backend's `media` table. */
  id: number
  /** For the exercise's page: at most 1600 px, "/storage/12/conversions/photo-large.webp". */
  url: string
  /** For lists, plans and workout mode: at most 400 px, "/storage/12/conversions/photo-thumb.webp". */
  thumb_url: string
}

/** At most this many photos per exercise (docs/design/D2-decisions.md D2.5), as the backend checks. */
export const MAX_PHOTOS = 5

/** The largest photo accepted, in bytes: 10 MB (D2.5). */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024

/** The photo types accepted: JPEG, PNG, WebP; not HEIC, which the server cannot read (D2.5). */
export const PHOTO_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']

/** An exercise, as the backend's ExerciseResource sends it. */
export interface Exercise {
  /** The row's number, part of the address /exercises/:id. */
  id: number
  /** The name, in the user's language when it exists, English otherwise. */
  name: string
  /** Other names it goes by; searched together with the name. */
  aliases: string[]
  /** A free text; null when there is none. */
  description: string | null
  /** The steps, in order; empty when there are none. */
  instructions: string[]
  /** How its sets are logged. */
  logging_type: LoggingType
  /** A YouTube video showing it; null when there is none. */
  youtube_url: string | null
  /** True for the signed-in user's own exercise: the Mine badge, the Edit button. */
  is_mine: boolean
  /** The equipment it needs; null for none. */
  equipment: Equipment | null
  /** Its muscles, the primary ones first. */
  muscles: ExerciseMuscle[]
  /** Its photos, in order: the first is the cover. */
  photos: ExercisePhoto[]
}

/** Which exercises the list shows: the "Source" filter of the library. */
export type ExerciseSource = 'all' | 'mine' | 'public'

/** The list's filters. Every field is optional: empty means "no filter". */
export interface ExerciseFilters {
  /** Text to find in the name and the aliases. */
  search?: string
  /** A muscle's slug: exercises with it as a primary muscle. */
  muscle?: string
  /** A kind of equipment's slug. */
  equipment?: string
  /** Public ones, mine, or both. */
  source?: ExerciseSource
}

/**
 * One page of the list, as Laravel sends a paginated resource: the rows in
 * `data`, the numbers in `meta` (the `links` it also sends are not used).
 */
export interface ExercisePage {
  /** The exercises of this page. */
  data: Exercise[]
  /** Where this page sits among the others. */
  meta: {
    /** This page's number, from 1. */
    current_page: number
    /** The number of the last page. */
    last_page: number
    /** How many exercises match, in all pages. */
    total: number
  }
}

/**
 * What creating or changing an exercise sends (backend StoreExerciseRequest).
 * Changing may send only some fields, hence Partial<> in useUpdateExercise.
 */
export interface ExerciseInput {
  /** Required, at most 100 characters. */
  name: string
  /** A free text; null empties it. */
  description?: string | null
  /** The steps, in order; null or [] empties them. */
  instructions?: string[] | null
  /** How its sets are logged; weight and reps when never sent. */
  logging_type?: LoggingType
  /** One of /api/equipment's ids; null for none. */
  equipment_id?: number | null
  /** A YouTube address (the backend refuses any other); null for none. */
  youtube_url?: string | null
  /** The complete list of muscles: those left out are removed. */
  muscles?: { id: number, role: 'primary' | 'secondary' }[]
}

/** How many exercises one page holds; the backend allows up to 100. */
export const EXERCISES_PER_PAGE = 50

/**
 * The cache keys of the library, from general to specific. Refreshing a
 * prefix refreshes everything under it: `exerciseKeys.all` covers every list
 * and every exercise, in every language.
 */
export const exerciseKeys = {
  /** Everything about exercises. */
  all: ['exercises'] as const,
  /**
   * One list: these filters, in this language.
   * @param filters the filters
   * @param language the interface's language
   */
  list: (filters: ExerciseFilters, language: string) => ['exercises', 'list', language, filters] as const,
  /**
   * One exercise, in this language.
   * @param id the exercise's number
   * @param language the interface's language
   */
  detail: (id: number, language: string) => ['exercises', 'detail', language, id] as const,
}

/**
 * The query string of one page: the filters the backend expects, in its
 * `filter[...]` form (spatie/laravel-query-builder), plus the page.
 * URLSearchParams builds it and escapes each value.
 * @param filters the list's filters
 * @param page the page's number, from 1
 * @returns a string such as "filter[search]=panca&page=2&per_page=50"
 */
export function exerciseListQuery(filters: ExerciseFilters, page: number): string {
  const params = new URLSearchParams()
  // `?.trim()`: the search without spaces around; nothing when undefined
  const search = filters.search?.trim()
  if (search) params.set('filter[search]', search)
  if (filters.muscle) params.set('filter[muscle]', filters.muscle)
  if (filters.equipment) params.set('filter[equipment]', filters.equipment)
  // 'all' is no filter: the backend shows both by default
  if (filters.source && filters.source !== 'all') params.set('filter[source]', filters.source)
  params.set('page', String(page))
  params.set('per_page', String(EXERCISES_PER_PAGE))
  return params.toString()
}

/**
 * Reads one page of the list.
 * @param filters the list's filters
 * @param page the page's number, from 1
 * @param signal optional cancel signal
 * @returns a Promise of the page
 */
export function fetchExercisePage(filters: ExerciseFilters, page: number, signal?: AbortSignal): Promise<ExercisePage> {
  return request<ExercisePage>(`/api/exercises?${exerciseListQuery(filters, page)}`, { signal })
}

/**
 * Hook: the library's list, one page at a time.
 *
 * useInfiniteQuery keeps every page read so far under one key, in
 * `data.pages`. `pageParam` is the page to read: 1 at first
 * (`initialPageParam`), then whatever getNextPageParam() returns from the
 * last page, or `undefined` when it was the last one. The hook's result adds
 * `fetchNextPage()`, `hasNextPage` and `isFetchingNextPage` to the usual fields.
 *
 * @param filters the list's filters
 * @param language the interface's language, part of the key
 * @example const list = useExercises({ search: 'panca' }, i18n.language)
 */
export function useExercises(filters: ExerciseFilters, language: string) {
  return useInfiniteQuery({
    queryKey: exerciseKeys.list(filters, language),
    queryFn: ({ pageParam, signal }) => fetchExercisePage(filters, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: last => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    // While the list of new filters loads, keep showing the previous one
    // (dimmed by the page, through `isPlaceholderData`) rather than a skeleton:
    // the screen does not jump at each letter typed
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook: one exercise, for its details page and the editor.
 * @param id the exercise's number, from the address
 * @param language the interface's language, part of the key
 */
export function useExercise(id: number, language: string) {
  return useQuery({
    queryKey: exerciseKeys.detail(id, language),
    // Laravel wraps one resource in `data` too; `.then()` takes it out
    queryFn: ({ signal }) => request<{ data: Exercise }>(`/api/exercises/${id}`, { signal }).then(answer => answer.data),
  })
}

/**
 * Hook: creates a personal exercise, in the request's language
 * (POST /api/exercises). Afterwards every cached list is out of date: they
 * are marked old, and the ones on screen are read again.
 * @example const create = useCreateExercise(); create.mutate(input, { onSuccess: exercise => … })
 */
export function useCreateExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ExerciseInput) =>
      request<{ data: Exercise }>('/api/exercises', { method: 'POST', body: input }).then(answer => answer.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  })
}

/**
 * Hook: changes a personal exercise (PATCH /api/exercises/{id}); only the
 * fields sent change. Afterwards the exercise and the lists are read again.
 * @param id the exercise's number
 */
export function useUpdateExercise(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<ExerciseInput>) =>
      request<{ data: Exercise }>(`/api/exercises/${id}`, { method: 'PATCH', body: input }).then(answer => answer.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  })
}

/**
 * Hook: deletes a personal exercise (DELETE /api/exercises/{id}, a soft delete
 * on the backend). Its own cached copy is removed, so nothing shows it again,
 * and the lists are read again.
 * @param id the exercise's number
 */
export function useDeleteExercise(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => request<void>(`/api/exercises/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      // removeQueries with a predicate: every cached detail of this id, in any language
      queryClient.removeQueries({ predicate: query => query.queryKey[0] === 'exercises' && query.queryKey[1] === 'detail' && query.queryKey[3] === id })
      return queryClient.invalidateQueries({ queryKey: exerciseKeys.all })
    },
  })
}

/**
 * Hook: Duplicate as mine (POST /api/exercises/{id}/duplicate): a copy of a
 * public exercise, photos included, that becomes the user's own, in the
 * app's language (docs/design/D1-ui.md D1.4.4). The lists are read again,
 * since the copy is in them.
 * @param id the public exercise's number
 * @example const duplicate = useDuplicateExercise(12); duplicate.mutate(undefined, { onSuccess: copy => … })
 */
export function useDuplicateExercise(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      request<{ data: Exercise }>(`/api/exercises/${id}/duplicate`, { method: 'POST' }).then(answer => answer.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  })
}

/** What useUploadExercisePhoto's mutate() takes. */
export interface PhotoUpload {
  /** The file the user chose or dropped. */
  file: File
  /** Called as the file is sent, with the share sent from 0 to 1. */
  onProgress?: (share: number) => void
}

/**
 * Hook: adds a photo to a personal exercise (POST /api/exercises/{id}/photos,
 * a multipart form), reporting how much has been sent
 * (docs/concepts/C1-frontend.md C1.14.7). Afterwards the exercise and the
 * lists are read again, so the new photo appears.
 * @param id the exercise's number
 * @example const add = useUploadExercisePhoto(12); add.mutate({ file, onProgress: setShare })
 */
export function useUploadExercisePhoto(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, onProgress }: PhotoUpload) => {
      // A form with one field, `photo`, holding the file: what the backend's
      // StoreExercisePhotoRequest reads
      const form = new FormData()
      form.append('photo', file)
      return upload<{ data: ExercisePhoto }>(`/api/exercises/${id}/photos`, form, onProgress).then(answer => answer.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  })
}

/**
 * Hook: removes a photo of a personal exercise
 * (DELETE /api/exercises/{id}/photos/{photoId}). The exercise and the lists
 * are read again.
 * @param id the exercise's number
 * @example const remove = useDeleteExercisePhoto(12); remove.mutate(photo.id)
 */
export function useDeleteExercisePhoto(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (photoId: number) => request<void>(`/api/exercises/${id}/photos/${photoId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  })
}

/**
 * Hook: puts the photos of a personal exercise in a new order, the cover
 * first (PUT /api/exercises/{id}/photos with `ids`). The exercise and the
 * lists are read again.
 * @param id the exercise's number
 * @example const reorder = useReorderExercisePhotos(12); reorder.mutate([14, 12, 13])
 */
export function useReorderExercisePhotos(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) =>
      request<{ data: ExercisePhoto[] }>(`/api/exercises/${id}/photos`, { method: 'PUT', body: { ids } }).then(answer => answer.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  })
}
