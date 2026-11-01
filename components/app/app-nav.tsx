'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, KanbanSquare, MessageSquareText, Settings, LogOut, Shield, TrendingUp, FileUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const NAV = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/app/leads', label: 'Leads', icon: Users },
  { href: '/app/importar', label: 'Importar leads', icon: FileUp },
  { href: '/app/funil', label: 'Funil', icon: KanbanSquare },
  { href: '/app/orcamentos', label: 'Orçamentos', icon: FileUp },
  { href: '/app/followups', label: 'Follow-ups', icon: MessageSquareText },
  { href: '/app/configuracoes', label: 'Configurações', icon: Settings },
]

export function AppNav({
  userName,
  planLabel,
  isAdmin,
}: {
  userName: string
  planLabel: string
  isAdmin: boolean
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <Link href="/app" className="flex items-center gap-2 px-2 py-1 mb-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <TrendingUp className="h-5 w-5" />
        </span>
        <span className="font-display text-lg font-bold tracking-tight">LeadUp</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/admin') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}
      </nav>

      <div className="mt-4 border-t pt-4">
        <div className="px-3 pb-3">
          <p className="text-sm font-medium truncate">{userName}</p>
          <Badge variant="secondary" className="mt-1">{planLabel}</Badge>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
