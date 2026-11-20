/*
 * History's filter by date: from a day, to a day, or both, one day being the
 * same day twice. Each end is the phone's own date picker, and an empty one
 * is open. The two stay in order: moving one past the other moves the other
 * with it, rather than asking for a span that ends before it starts.
 */
import { ArrowRight, X } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { dayKey } from '@/lib/calendar'
import { cn } from '@/lib/utils'

interface DateRangeFilterProps {
  /** As in the address, `2026-11-01`; "" when open. */
  from: string
  to: string
  onChange: (from: string, to: string) => void
}

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const { t } = useTranslation()
  // Days compare as text: `2026-11-01` < `2026-11-19`
  const today = dayKey(new Date())

  return (
    <div role="group" aria-label={t('history.filter.label')} className="flex items-center gap-1 rounded-2xl border bg-card/60 p-1.5">
      <DateField label={t('history.filter.from')} value={from} max={to || today} onChange={value => onChange(value, to && value > to ? value : to)} />
      <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <DateField label={t('history.filter.to')} value={to} min={from || undefined} max={today} onChange={value => onChange(from && value && value < from ? value : from, value)} />
      {(from !== '' || to !== '') && (
        <Button variant="ghost" size="icon-xl" className="shrink-0" aria-label={t('history.filter.clear')} onClick={() => onChange('', '')}>
          <X aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}

interface DateFieldProps {
  label: string
  value: string
  min?: string
  max: string
  onChange: (value: string) => void
}

/** The label small inside the field, as a card's caption: the pair fits a phone's width. */
function DateField({ label, value, min, max, onChange }: DateFieldProps) {
  const id = useId()

  return (
    <div className="min-w-0 flex-1 rounded-xl px-3 py-1.5 transition-colors focus-within:bg-muted/60 focus-within:ring-2 focus-within:ring-ring/50 hover:bg-muted/60">
      <label htmlFor={id} className="block text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{label}</label>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={event => onChange(event.target.value)}
        className={cn('h-7 w-full min-w-0 bg-transparent text-sm font-semibold tabular-nums outline-none', value === '' && 'text-muted-foreground')}
      />
    </div>
  )
}
