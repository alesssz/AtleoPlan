/*
 * Stands in for a screen that is not built yet, pointing to where the
 * design docs describe it. Each one disappears when its screen is built.
 * Uses shadcn/ui's Card (src/components/ui/card.tsx) and a translated text
 * with a placeholder (docs/04-frontend.md 4.7).
 */
// Icons are React components from lucide-react: <Construction /> draws an SVG
import { Construction } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/** Props of PagePlaceholder. */
interface PagePlaceholderProps {
  /** The section of docs/01-ui-design.md describing the screen, e.g. '1.4.6'. */
  section: string
}

/**
 * A dashed card saying "coming soon", with the design section to read.
 * Used by the pages not built yet (HomePage, PlansPage…).
 */
export function PagePlaceholder({ section }: PagePlaceholderProps) {
  // useTranslation() is react-i18next's hook; `const { t } = …` takes the
  // translate function t out of the object it returns (destructuring)
  const { t } = useTranslation()

  return (
    // border-dashed: a dashed outline, the usual sign of "not here yet"
    <Card className="border-dashed">
      <CardHeader>
        {/* Icon and title side by side (flex row), vertically centred,
            with a small gap */}
        <CardTitle className="flex items-center gap-2">
          {/* aria-hidden: screen readers skip the icon, the title says it
              all. size-5 = 20 px square, in the theme's warning colour */}
          <Construction aria-hidden="true" className="size-5 text-warning" />
          {t('placeholder.title')}
        </CardTitle>
        {/* Interpolation: {{section}} in the translation is filled with
            the value passed here. `{ section }` is shorthand for
            `{ section: section }` */}
        <CardDescription>{t('placeholder.text', { section })}</CardDescription>
      </CardHeader>
    </Card>
  )
}
