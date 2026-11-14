/*
 * Re-exported where shadcn/ui expects it (components.json). The `cn` package
 * replaces the clsx + tailwind-merge pair: conditional classes, and the last
 * conflicting Tailwind class wins, so a component's `className` overrides its
 * defaults.
 */
export { cn } from 'cn'
