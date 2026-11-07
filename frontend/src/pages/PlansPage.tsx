/*
 * Plans (route `/plans`, docs/design/D1-ui.md D1.4.6): the user's plans, the
 * active one first, each a card linking to its page; the archived ones
 * behind a view of their own, `/plans?archived=1`. Its pieces: PlanCard
 * (src/components/plans/), the hook usePlans (src/api/plans.ts). How it was
 * built: docs/how-to/H3-frontend.md H3.13.
 *
 * The view (in use, or archived) lives in the address, as the library's
 * filters do (docs/concepts/C1-frontend.md C1.14.3): Back from a plan returns
 * to the same view.
 *
 * New plan opens the plan editor (/plans/new). The Templates section and
 * Share are phase 2.
 */
import { Archive, ClipboardList, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { usePlans } from '@/api/plans'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { PlanCard } from '@/components/plans/PlanCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** How many grey cards stand in for the list while it loads. */
const SKELETON_CARDS = 3

/** The two views, in order: the plans in use, then the archived ones. */
const VIEWS = ['current', 'archived'] as const

/** The Plans screen (route `/plans`). */
export function PlansPage() {
  const { t } = useTranslation()
  // The address's query string: `?archived=1` opens the archived view
  const [searchParams, setSearchParams] = useSearchParams()
  const archived = searchParams.get('archived') === '1'
  const plans = usePlans(archived)

  /**
   * Switches view, in the address. `replace: true`, as for the library's
   * filters: Back leaves the page instead of undoing the switch.
   * @param view the view to show
   */
  function showView(view: (typeof VIEWS)[number]) {
    setSearchParams(view === 'archived' ? { archived: '1' } : {}, { replace: true })
  }

  return (
    <>
      <PageHeader eyebrow={t('pages.plans.eyebrow')} title={t('pages.plans.title')} description={t('pages.plans.description')} />

      {/* The main action: a real link styled as a button */}
      <div className="mb-6">
        <Button asChild size="xl">
          <Link to="/plans/new">
            <Plus aria-hidden="true" />
            {t('plans.new')}
          </Link>
        </Button>
      </div>

      {/* The two views: buttons side by side, one pressed, as the library's
          Source filter (aria-pressed says which, never colour alone, D1.7) */}
      <div role="group" aria-label={t('plans.viewLabel')} className="mb-6 inline-flex overflow-hidden rounded-xl border bg-card/60">
        {VIEWS.map(view => (
          <button
            key={view}
            type="button"
            aria-pressed={archived === (view === 'archived')}
            onClick={() => showView(view)}
            className={cn(
              'min-h-[46px] px-5 text-sm font-semibold transition-colors',
              archived === (view === 'archived') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`plans.view.${view}`)}
          </button>
        ))}
      </div>

      <section aria-label={t(`plans.view.${archived ? 'archived' : 'current'}`)}>
        {plans.isPending && (
          // Loading: grey cards the shape of the real ones
          <div role="status" className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => <Skeleton key={index} className="h-28 w-full rounded-3xl" />)}
            <span className="sr-only">{t('plans.loading')}</span>
          </div>
        )}

        {plans.isError && (
          <div role="alert" className="flex flex-col items-start gap-3">
            <p>{t('plans.loadError')}</p>
            <Button variant="outline" onClick={() => void plans.refetch()} disabled={plans.isFetching}>{t('server.retry')}</Button>
          </div>
        )}

        {plans.isSuccess && plans.data.length === 0 && (
          archived
            ? <EmptyState icon={Archive} title={t('plans.noArchivedTitle')} description={t('plans.noArchivedText')} />
            : (
                // No plan yet: the first-plan state of D1.6
                <EmptyState
                  icon={ClipboardList}
                  title={t('plans.emptyTitle')}
                  description={t('plans.emptyText')}
                  actions={(
                    <Button asChild size="xl">
                      <Link to="/plans/new">
                        <Plus aria-hidden="true" />
                        {t('plans.new')}
                      </Link>
                    </Button>
                  )}
                />
              )
        )}

        {plans.isSuccess && plans.data.length > 0 && (
          // The cards, the active one first (the API sorts them): one column
          // on phones, two from 640 px (D1.7)
          <ul className="grid gap-3 sm:grid-cols-2">
            {plans.data.map(plan => (
              <li key={plan.id}>
                <PlanCard plan={plan} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
