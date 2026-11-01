import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { LoginForm } from '@/components/auth/login-form'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const session = await auth()
  if (session?.user?.id) redirect('/app')

  return (
    <AuthLayout title="Entrar no LeadUp" description="Acesse sua conta para organizar seus leads.">
      <LoginForm />
      <Link className="block mt-4 text-center text-sm underline" href="/esqueci-senha">Esqueci minha senha</Link>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="text-primary font-medium hover:underline">
          Criar conta grátis
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/" className="text-muted-foreground hover:underline">
          Voltar para o site
        </Link>
      </p>
    </AuthLayout>
  )
}
