/*
 * The exercise library (route `/exercises`, docs/design/D1-ui.md D1.4.3):
 * public exercises and the user's own, with search, filters and a button to
 * load more. New exercise sits at the right of the title, in PageHeader's
 * `actions` (D1.5 "Page header"). Its pieces: ExerciseFilters (the search,
 * the Filters panel, the source) and ExerciseListItem
 * (src/components/exercises/), the hook useExercises (src/api/exercises.ts).
 * How it was built: docs/how-to/H3-frontend.md H3.12; the compact header
 * and the Filters panel: H3.31.
 *
 * The filters live in the address, as its query string:
 * /exercises?q=panca&muscle=chest&source=mine. React Router's useSearchParams
 * reads and writes it. So the browser's Back button returns to the same
 * filters, a reload keeps them, and a filtered list can be bookmarked.
 *
 * The five states of D1.6: loading (skeleton rows), error (a message and
 * Retry), empty (three kinds: a search with no result, filters with no
 * result, no personal exercise yet), the list, and the list being refreshed
 * (the old one dimmed, and a spinner in the search box, while the new one
 * loads).
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
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

/** How long the search waits after the last key before asking the server. */
const SEARCH_DELAY_MS = 300

/** How many grey rows stand in for the list while it loads. */
const SKELETON_ROWS = 6

/**
 * The address's parameter for each filter. Short names keep the address
 * readable: `q` for the search, as many sites do.
 */
const PARAMS = { search: 'q', muscle: 'muscle', equipment: 'equipment', source: 'source' } as const

/**
 * Whether a text is one of the source filter's values; anything else in the
 * address (typed by hand, say) counts as 'all'. A type guard: when it returns
 * true, TypeScript knows `value` is an ExerciseSource.
 * @param value the parameter as found in the address
 */
function isSource(value: string | null): value is ExerciseSource {
  return value === 'all' || value === 'mine' || value === 'public'
}

/** The library screen (route `/exercises`). */
export function ExercisesPage() {
  const { t, i18n } = useTranslation()
  // The address's query string, and the function that replaces it
  const [searchParams, setSearchParams] = useSearchParams()

  // The filters as they are in the address; '' when a parameter is missing
  const sourceParam = searchParams.get(PARAMS.source)
  const values: ExerciseFilterValues = {
    search: searchParams.get(PARAMS.search) ?? '',
    muscle: searchParams.get(PARAMS.muscle) ?? '',
    equipment: searchParams.get(PARAMS.equipment) ?? '',
    source: isSource(sourceParam) ? sourceParam : 'all',
  }

  // The search the server is asked for: the box's text, once typing pauses.
  // The other filters apply at once
  const search = useDebouncedValue(values.search, SEARCH_DELAY_MS)
  const list = useExercises({ ...values, search }, i18n.language)
  // Whether the list on screen is not yet the one asked for: while typing
  // (the box's text is ahead of the debounced search) or while the new
  // list loads behind the old one (isPlaceholderData). A spinner in the
  // search box and the dimmed list say so (C1.20)
  const searching = values.search !== search || list.isPlaceholderData

  /**
   * Writes changed filters into the address. A filter set back to its
   * default ('' or 'all') is removed, so the plain list has a plain address.
   * `replace: true` changes the current history entry instead of adding one:
   * Back leaves the list, rather than undoing one letter at a time.
   * @param changes the filters that changed
   */
  function changeFilters(changes: Partial<ExerciseFilterValues>) {
    // A copy of the current parameters, to change
    const next = new URLSearchParams(searchParams)
    // Object.entries(): the pairs [name, value] of the changes
    for (const [name, value] of Object.entries(changes)) {
      // The parameter's name in the address, such as 'q'
      const param = PARAMS[name as keyof typeof PARAMS]
      if (value === '' || value === 'all') next.delete(param)
      else next.set(param, value)
    }
    setSearchParams(next, { replace: true })
  }

  // Whether any filter other than the search is on: decides the empty state
  const filtered = values.muscle !== '' || values.equipment !== '' || values.source !== 'all'
  // Every exercise loaded so far: the pages' rows, one after the other.
  // flatMap() maps each page to its rows and joins the lists
  const exercises = list.data?.pages.flatMap(page => page.data) ?? []
  // How many match in all, from the first page's meta
  const total = list.data?.pages[0]?.meta.total ?? 0

  return (
    <>
      {/* The header, with the main action at the right of the title: a real
          link styled as a button, passed as the `actions` prop (D1.5 "Page
          header") */}
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

      {/* The results, 24 px under the filters */}
      <section aria-label={t('pages.exercises.title')} className="mt-6">
        {list.isPending && (
          // Loading: grey rows the shape of the real ones; role="status"
          // and the hidden text tell screen readers what is happening
          <div role="status" className="flex flex-col gap-3">
            {Array.from({ length: SKELETON_ROWS }, (_, index) => <Skeleton key={index} className="h-20 w-full rounded-2xl" />)}
            <span className="sr-only">{t('exercises.loading')}</span>
          </div>
        )}

        {list.isError && (
          // An error: the message, and a button to ask again
          <div role="alert" className="flex flex-col items-start gap-3">
            <p>{t('exercises.loadError')}</p>
            <Button variant="outline" onClick={() => void list.refetch()} pending={list.isFetching}>{t('server.retry')}</Button>
          </div>
        )}

        {list.isSuccess && total === 0 && (
          // Empty: which empty state depends on why (D1.6)
          values.search.trim() !== ''
            ? (
                // A search with no result: offer to create it, with the
                // search as its name (the editor reads ?name=)
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
                  // Only "Mine", and none yet: the way to make the first one
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
                  // Filters with no result: a way to remove them
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

        {list.isSuccess && total > 0 && (
          // The list. Dimmed while the list of new filters loads
          // (`searching`: typing, or isPlaceholderData, the old one still
          // shown), so the screen does not jump
          // at each letter typed and still shows it is working
          <div className={cn('transition-opacity', searching && 'opacity-60')}>
            {/* How many match: "876 exercises". aria-live: screen readers
                announce the new count when the filters change */}
            <p aria-live="polite" className="mb-3 text-sm text-muted-foreground">{t('exercises.count', { count: total })}</p>

            {/* One column on phones, two from 640 px (D1.7) */}
            <ul className="grid gap-3 sm:grid-cols-2">
              {exercises.map(exercise => (
                <li key={exercise.id}>
                  <ExerciseListItem exercise={exercise} />
                </li>
              ))}
            </ul>

            {/* The next page, when there is one. A button rather than an
                endless scroll: the user decides, and the page's end stays
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
