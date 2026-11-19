/*
 * The exercise library. The filters live in the URL (/exercises?q=panca&muscle=chest),
 * so Back and a reload keep them. While a new list loads, the old one stays
 * dimmed with a spinner in the search box, instead of a skeleton at every letter.
 */
import { Dumbbell, Plus, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { useExercises, type ExerciseSource } from '@/api/exercises'
import { EmptyState } from '@/components/EmptyState'
import { ExerciseFilters, type ExerciseFilterValues } from '@/components/exercises/ExerciseFilters'
import { ExerciseListItem } from '@/components/exercises/ExerciseListItem'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { shownData } from '@/lib/shown-data'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

const SEARCH_DELAY_MS = 300

const SKELETON_ROWS = 6

/** Short names keep the address readable. */
const PARAMS = { search: 'q', muscle: 'muscle', equipment: 'equipment', source: 'source' } as const

/** Anything else in the address, typed by hand say, counts as 'all'. */
function isSource(value: string | null): value is ExerciseSource {
  return value === 'all' || value === 'mine' || value === 'public'
}

export function ExercisesPage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const sourceParam = searchParams.get(PARAMS.source)
  const values: ExerciseFilterValues = {
    search: searchParams.get(PARAMS.search) ?? '',
    muscle: searchParams.get(PARAMS.muscle) ?? '',
    equipment: searchParams.get(PARAMS.equipment) ?? '',
    source: isSource(sourceParam) ? sourceParam : 'all',
  }

  // Only the search waits for a pause; the other filters apply at once
  const search = useDebouncedValue(values.search, SEARCH_DELAY_MS)
  const list = useExercises({ ...values, search }, i18n.language)
  const pages = shownData(list)
  // While typing, or while the new list loads behind the old
  const searching = values.search !== search || list.isPlaceholderData

  /**
   * A filter back to its default leaves the address, so the plain list has
   * a plain address. Replaces the history entry: Back leaves the list,
   * rather than undoing one letter at a time.
   */
  function changeFilters(changes: Partial<ExerciseFilterValues>) {
    const next = new URLSearchParams(searchParams)
    for (const [name, value] of Object.entries(changes)) {
      const param = PARAMS[name as keyof typeof PARAMS]
      if (value === '' || value === 'all') next.delete(param)
      else next.set(param, value)
    }
    setSearchParams(next, { replace: true })
  }

  const filtered = values.muscle !== '' || values.equipment !== '' || values.source !== 'all'
  const exercises = pages?.pages.flatMap(page => page.data) ?? []
  const total = pages?.pages[0]?.meta.total ?? 0

  return (
    <>
      <PageHeader
        title={t('pages.exercises.title')}
        description={t('pages.exercises.description')}
        actions={(
          <Button asChild size="xl">
            <Link to="/exercises/new">
              <Plus aria-hidden="true" />
              {t('exercises.new')}
            </Link>
          </Button>
        )}
      />

      <ExerciseFilters values={values} onChange={changeFilters} searching={searching} />

      <section aria-label={t('pages.exercises.title')} className="mt-6">
        {list.isPending && (
          <div role="status" className="flex flex-col gap-3">
            {Array.from({ length: SKELETON_ROWS }, (_, index) => <Skeleton key={index} className="h-20 w-full rounded-2xl" />)}
            <span className="sr-only">{t('exercises.loading')}</span>
          </div>
        )}

        {!list.isPending && pages === undefined && (
          <div role="alert" className="flex flex-col items-start gap-3">
            <p>{t('exercises.loadError')}</p>
            <Button variant="outline" onClick={() => void list.refetch()} pending={list.isFetching}>{t('server.retry')}</Button>
          </div>
        )}

        {pages !== undefined && total === 0 && (
          values.search.trim() !== ''
            ? (
                // Offer to create it, the search as its name
                <EmptyState
                  icon={SearchX}
                  title={t('exercises.noResultsTitle', { search: values.search.trim() })}
                  description={t('exercises.noResultsText')}
                  actions={(
                    <Button asChild size="xl">
                      <Link to={`/exercises/new?name=${encodeURIComponent(values.search.trim())}`}>
                        {t('exercises.createNamed', { search: values.search.trim() })}
                      </Link>
                    </Button>
                  )}
                />
              )
            : values.source === 'mine' && values.muscle === '' && values.equipment === ''
              ? (
                  <EmptyState
                    icon={Dumbbell}
                    title={t('exercises.noMineTitle')}
                    description={t('exercises.noMineText')}
                    actions={(
                      <Button asChild size="xl">
                        <Link to="/exercises/new">{t('exercises.new')}</Link>
                      </Button>
                    )}
                  />
                )
              : (
                  <EmptyState
                    icon={SearchX}
                    title={t('exercises.noMatchTitle')}
                    description={t('exercises.noMatchText')}
                    actions={filtered && (
                      <Button size="xl" variant="outline" onClick={() => changeFilters({ muscle: '', equipment: '', source: 'all' })}>
                        {t('exercises.clearFilters')}
                      </Button>
                    )}
                  />
                )
        )}

        {pages !== undefined && total > 0 && (
          <div className={cn('transition-opacity', searching && 'opacity-60')}>
            {/* Announced when the filters change */}
            <p aria-live="polite" className="mb-3 text-sm text-muted-foreground">{t('exercises.count', { count: total })}</p>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {exercises.map(exercise => (
                <li key={exercise.id}>
                  <ExerciseListItem exercise={exercise} />
                </li>
              ))}
            </ul>

            {/* A button, not an endless scroll: the page's end stays
                reachable, for the tab bar and the keyboard */}
            {list.hasNextPage && (
              <div className="mt-6 flex justify-center">
                <Button size="xl" variant="outline" onClick={() => void list.fetchNextPage()} pending={list.isFetchingNextPage}>
                  {t('exercises.showMore')}
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  )
}
