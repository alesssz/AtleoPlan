/*
 * The exercise library's API: the paged list, one exercise, personal exercises
 * and their photos, Duplicate as mine.
 *
 * Texts come in the request's language, so the language is in every key:
 * switching it reads the library again instead of showing stale names.
 */
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Equipment } from '@/api/equipment'
import type { Muscle } from '@/api/muscles'
import { request, upload } from '@/lib/http'

/** backend app/Enums/LoggingType.php */
export type LoggingType = 'weight_reps' | 'reps' | 'time' | 'distance'

/** In the order the editor offers them. */
export const LOGGING_TYPES: readonly LoggingType[] = ['weight_reps', 'reps', 'time', 'distance']

export interface ExerciseMuscle extends Muscle {
  role: 'primary' | 'secondary'
}

/**
 * Both addresses are paths on the app's own origin; until the server's queue
 * has made the smaller copies, both are the original's.
 */
export interface ExercisePhoto {
  id: number
  /** At most 1600 px, for the exercise's page. */
  url: string
  /** At most 400 px, for lists, plans and workout mode. */
  thumb_url: string
}

/** The backend's limits. */
export const MAX_PHOTOS = 5

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024

/** No HEIC: the server cannot read it. */
export const PHOTO_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']

/** As sent by the backend's ExerciseResource. */
export interface Exercise {
  id: number
  /** In the user's language when it exists, English otherwise. */
  name: string
  aliases: string[]
  description: string | null
  instructions: string[]
  logging_type: LoggingType
  youtube_url: string | null
  /** The Mine badge and the Edit button. */
  is_mine: boolean
  equipment: Equipment | null
  /** Primary ones first. */
  muscles: ExerciseMuscle[]
  /** The first is the cover. */
  photos: ExercisePhoto[]
}

export type ExerciseSource = 'all' | 'mine' | 'public'

/** Empty fields mean no filter. */
export interface ExerciseFilters {
  search?: string
  /** A muscle's slug: exercises with it as a primary muscle. */
  muscle?: string
  equipment?: string
  source?: ExerciseSource
}

/** Laravel's paginated resource; its `links` are not used. */
export interface ExercisePage {
  data: Exercise[]
  meta: {
    current_page: number
    last_page: number
    total: number
  }
}

/** backend StoreExerciseRequest; an update may send only some fields. */
export interface ExerciseInput {
  name: string
  /** null empties it. */
  description?: string | null
  instructions?: string[] | null
  logging_type?: LoggingType
  equipment_id?: number | null
  /** YouTube only: the backend refuses any other address. */
  youtube_url?: string | null
  /** The complete list: muscles left out are removed. */
  muscles?: { id: number, role: 'primary' | 'secondary' }[]
}

/** The backend allows up to 100. */
export const EXERCISES_PER_PAGE = 50

/** `all` covers every list and every exercise, in every language. */
export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (filters: ExerciseFilters, language: string) => ['exercises', 'list', language, filters] as const,
  detail: (id: number, language: string) => ['exercises', 'detail', language, id] as const,
}

/** "filter[search]=panca&page=2&per_page=50", in spatie/laravel-query-builder's form. */
export function exerciseListQuery(filters: ExerciseFilters, page: number): string {
  const params = new URLSearchParams()
  const search = filters.search?.trim()
  if (search) params.set('filter[search]', search)
  if (filters.muscle) params.set('filter[muscle]', filters.muscle)
  if (filters.equipment) params.set('filter[equipment]', filters.equipment)
  // 'all' is the backend's default
  if (filters.source && filters.source !== 'all') params.set('filter[source]', filters.source)
  params.set('page', String(page))
  params.set('per_page', String(EXERCISES_PER_PAGE))
  return params.toString()
}

export function fetchExercisePage(filters: ExerciseFilters, page: number, signal?: AbortSignal): Promise<ExercisePage> {
  return request<ExercisePage>(`/api/exercises?${exerciseListQuery(filters, page)}`, { signal })
}

export function useExercises(filters: ExerciseFilters, language: string) {
  return useInfiniteQuery({
    queryKey: exerciseKeys.list(filters, language),
    queryFn: ({ pageParam, signal }) => fetchExercisePage(filters, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: last => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    // The previous list stays (dimmed by the page) while the new filters
    // load, so the screen does not jump at each letter typed
    placeholderData: keepPreviousData,
  })
}

export function useExercise(id: number, language: string) {
  return useQuery({
    queryKey: exerciseKeys.detail(id, language),
    queryFn: ({ signal }) => request<{ data: Exercise }>(`/api/exercises/${id}`, { signal }).then(answer => answer.data),
  })
}

/** In the request's language. */
export function useCreateExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ExerciseInput) =>
      request<{ data: Exercise }>('/api/exercises', { method: 'POST', body: input }).then(answer => answer.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  })
}

/** Only the fields sent change. */
export function useUpdateExercise(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<ExerciseInput>) =>
      request<{ data: Exercise }>(`/api/exercises/${id}`, { method: 'PATCH', body: input }).then(answer => answer.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  })
}

/** A soft delete on the backend; every cached copy of it goes, in any language. */
export function useDeleteExercise(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => request<void>(`/api/exercises/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ predicate: query => query.queryKey[0] === 'exercises' && query.queryKey[1] === 'detail' && query.queryKey[3] === id })
      return queryClient.invalidateQueries({ queryKey: exerciseKeys.all })
    },
  })
}

/**
 * A public exercise copied as the user's own, photos included, in the app's
 * language.
 */
export function useDuplicateExercise(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      request<{ data: Exercise }>(`/api/exercises/${id}/duplicate`, { method: 'POST' }).then(answer => answer.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  })
}

export interface PhotoUpload {
  file: File
  /** The share sent, from 0 to 1. */
  onProgress?: (share: number) => void
}

/** Multipart, with progress. */
export function useUploadExercisePhoto(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, onProgress }: PhotoUpload) => {
      const form = new FormData()
      form.append('photo', file)
      return upload<{ data: ExercisePhoto }>(`/api/exercises/${id}/photos`, form, onProgress).then(answer => answer.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  })
}

export function useDeleteExercisePhoto(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (photoId: number) => request<void>(`/api/exercises/${id}/photos/${photoId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  })
}

/** The cover first; every photo of the exercise, once. */
export function useReorderExercisePhotos(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) =>
      request<{ data: ExercisePhoto[] }>(`/api/exercises/${id}/photos`, { method: 'PUT', body: { ids } }).then(answer => answer.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  })
}
