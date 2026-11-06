/*
 * cn(): the helper that builds a `className` out of Tailwind classes, used
 * by every component that styles itself (docs/concepts/C1-frontend.md C1.8).
 *
 * It does two jobs:
 * - joins classes and skips the false ones, so a class can depend on a
 *   condition: cn('rounded-full', online ? 'bg-success' : 'bg-destructive'),
 *   cn('size-4', isFetching && 'animate-spin');
 * - resolves conflicts between Tailwind classes, the last one winning:
 *   cn('px-2', 'px-4') gives 'px-4', so a component's default classes can
 *   be overridden by the `className` its user passes.
 *
 * The function comes from `cn`, a package by the authors of shadcn/ui: a
 * fast drop-in replacement for the clsx + tailwind-merge pair that shadcn
 * used before. This file only re-exports it (`export { … } from …` makes
 * the imported name available from here too), so the app imports it from
 * '@/lib/utils', the place shadcn/ui expects (components.json). The files
 * in src/components/ui/ import it from 'cn' directly: same function.
 */
export { cn } from 'cn'
