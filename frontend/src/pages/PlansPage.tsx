/*
 * Plans (route `/plans`): the user's plans, the active one first, each a card
 * linking to its page; the archived ones behind a view of their own,
 * `/plans?archived=1`.
 *
 * The view (in use, or archived) lives in the address, as the library's filters
 * do: Back from a plan returns to the same view.
 *
 * New plan opens the plan editor (/plans/new); Import plan makes a plan of a
 * file saved by a plan's Export (ImportPlanButton). Both sit at the right of
 * the title, in PageHeader's `actions`. The Templates section and Share are
 * phase 2.
 */
import { Archive, ClipboardList, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { usePlans } from '@/api/plans'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { ImportPlanButton } from '@/components/plans/ImportPlanButton'
import { PlanCard } from '@/components/plans/PlanCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const SKELETON_CARDS = 3

const VIEWS = ['current', 'archived'] as const

export function PlansPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const archived = searchParams.get('archived') === '1'
  const plans = usePlans(archived)

  /**
   * Replaces the history entry: Back leaves the page instead of undoing the switch.
   */
  function showView(view: (typeof VIEWS)[number]) {
    setSearchParams(view === 'archived' ? { archived: '1' } : {}, { replace: true })
  }

  return (
    <>
      <PageHeader
        title={t('pages.plans.title')}
        description={t('pages.plans.description')}
        actions={(
          <>
            <Button asChild size="xl">
              <Link to="/plans/new">
                <Plus aria-hidden="true" />
                {t('plans.new')}
              </Link>
            </Button>
            <ImportPlanButton />
          </>
        )}
      />

      {/* As the library's Source filter: never colour alone */}
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
          <div role="status" className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => <Skeleton key={index} className="h-28 w-full rounded-3xl" />)}
            <span className="sr-only">{t('plans.loading')}</span>
          </div>
        )}

        {plans.isError && (
          <div role="alert" className="flex flex-col items-start gap-3">
            <p>{t('plans.loadError')}</p>
            <Button variant="outline" onClick={() => void plans.refetch()} pending={plans.isFetching}>{t('server.retry')}</Button>
          </div>
        )}

        {plans.isSuccess && plans.data.length === 0 && (
          archived
            ? <EmptyState icon={Archive} title={t('plans.noArchivedTitle')} description={t('plans.noArchivedText')} />
            : (
                // Before the first plan
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
          // The API puts the active one first
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
