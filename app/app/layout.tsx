import { requireUser } from '@/lib/session'
import { effectivePlan } from '@/lib/plan'
import { AppShell } from '@/components/layouts/app-shell'
import { AppNav } from '@/components/app/app-nav'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const plan = effectivePlan(user)
  const planLabel = plan === 'START' ? 'Plano Start' : 'Plano Grátis'

  return (
    <AppShell
      sidebar={<AppNav userName={user.name ?? user.email} planLabel={planLabel} isAdmin={user.isAdmin} />}
      header={<span className="font-display font-semibold lg:hidden">LeadUp</span>}
    >
      {children}
    </AppShell>
  )
}
