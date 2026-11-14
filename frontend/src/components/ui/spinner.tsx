import { cn } from 'cn'
import { Loader2Icon } from 'lucide-react'

/*
 * shadcn/ui's Spinner, for a request running where content is already shown; a
 * page with nothing yet uses Skeleton. Unlike shadcn's, which always says
 * "Loading" in English, it is silent unless given a `label`.
 */
interface SpinnerProps extends React.ComponentProps<'svg'> {
  label?: string
}

/**
 * It keeps turning with reduced motion: still, it would read as an icon.
 * `h-4 w-4` rather than `size-4`, so inside a Button it takes the size of
 * the icon it replaces.
 */
function Spinner({ className, label, ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('h-4 w-4 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
