import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { SignupForm } from '@/components/auth/signup-form'

export const dynamic = 'force-dynamic'

export default async function CadastroPage() {
  const session = await auth()
  if (session?.user?.id) redirect('/app')

  return (
    <AuthLayout title="Criar conta no LeadUp" description="Comece grátis. Organize seus leads em minutos.">
      <SignupForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Entrar
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
