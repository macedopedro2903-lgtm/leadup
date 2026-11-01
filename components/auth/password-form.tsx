'use client'
import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import Link from 'next/link'

export function PasswordForm({token}:{token?:string}) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[done,setDone]=useState(false)
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();setBusy(true);setError('');setMessage('')
    const form=new FormData(e.currentTarget)
    const password=String(form.get('password')??'')
    if(token&&password!==form.get('confirmation')){setBusy(false);setError('As senhas não coincidem.');return}
    try {
      const response=await fetch(token?'/api/password/reset':'/api/password/forgot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(token?{token,password}:{email:form.get('email')})})
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Não foi possível concluir.')
      setMessage(token?'Senha alterada. Entre novamente em sua conta.':body.message);setDone(!!token)
    }catch(error){setError(error instanceof Error?error.message:'Erro de conexão.')}finally{setBusy(false)}
  }
  return <><form onSubmit={submit} className="space-y-4">{!token?<div><Label htmlFor="reset-email">Email da conta</Label><Input id="reset-email" name="email" type="email" autoComplete="email" required/></div>:<><div><Label htmlFor="reset-password">Nova senha</Label><Input id="reset-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required/></div><div><Label htmlFor="reset-confirm">Confirme a senha</Label><Input id="reset-confirm" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={72} required/></div></>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}{message&&<p role="status" className="text-sm">{message}</p>}<Button className="w-full" disabled={busy||done}>{busy?'Aguarde...':token?'Salvar nova senha':'Enviar instruções'}</Button></form><Link href="/login" className="block text-center text-sm mt-4 underline">Voltar para login</Link></>
}
