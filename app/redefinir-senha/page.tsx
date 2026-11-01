import {AuthLayout} from '@/components/layouts/auth-layout'
import {PasswordForm} from '@/components/auth/password-form'
export const metadata={referrer:'no-referrer',robots:{index:false,follow:false}}
export default async function ResetPage({searchParams}:{searchParams:Promise<{token?:string}>}){const {token}=await searchParams;return <AuthLayout title="Redefinir senha" description="Escolha uma nova senha para sua conta."><PasswordForm token={token||'invalid'}/></AuthLayout>}
