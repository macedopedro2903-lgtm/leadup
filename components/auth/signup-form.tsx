'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function SignupForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    whatsapp: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Não foi possível criar a conta. Tente novamente.')
        setLoading(false)
        return
      }
      // Login automático após cadastro
      const login = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      if (login?.error) {
        router.push('/login')
        return
      }
      window.location.assign('/app')
    } catch {
      setError('Não foi possível criar a conta agora. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Seu nome" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail *</Label>
        <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="voce@empresa.com.br" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha *</Label>
        <Input id="password" type="password" autoComplete="new-password" required minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Mínimo 6 caracteres" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessName">Nome da empresa</Label>
        <Input id="businessName" value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="Nome do seu negócio" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input id="whatsapp" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="(11) 99999-9999" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Criar conta grátis
      </Button>
    </form>
  )
}
