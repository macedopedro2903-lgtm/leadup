'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'

export function ReminderSettings({lead}:{lead:{id:string;followupEnabled:boolean;followupAfterDays:number;nextFollowup:string|null}}) {
  const router=useRouter()
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  async function save(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError('')
    const form=event.currentTarget
    const values=new FormData(form)
    try {
      const response=await fetch(`/api/leads/${lead.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({followupEnabled:values.get('enabled')==='on',followupAfterDays:Number(values.get('days')),nextFollowup:values.get('date')?new Date(String(values.get('date'))).toISOString():null})})
      if(!response.ok)throw new Error((await response.json()).error||'Falha ao salvar.')
      form.dataset.dirty='false';router.refresh()
    }catch(error){setError(error instanceof Error?error.message:'Erro de conexão.')}finally{setBusy(false)}
  }
  return <form onSubmit={save} onChange={event=>{event.currentTarget.dataset.dirty='true'}} className="space-y-3">
    <Label className="flex items-center gap-2"><input type="checkbox" name="enabled" defaultChecked={lead.followupEnabled}/>Ativar lembretes deste lead no painel</Label>
    <div className="grid sm:grid-cols-2 gap-3"><div><Label htmlFor="reminder-days">Alertar após dias sem interação</Label><Input id="reminder-days" type="number" name="days" min={1} max={365} required defaultValue={lead.followupAfterDays}/></div><div><Label htmlFor="reminder-date">Acompanhamento agendado</Label><Input id="reminder-date" type="datetime-local" name="date" defaultValue={lead.nextFollowup?new Date(new Date(lead.nextFollowup).getTime()-new Date(lead.nextFollowup).getTimezoneOffset()*60000).toISOString().slice(0,16):''}/></div></div>
    <p className="text-xs text-muted-foreground">Uma data agendada tem prioridade sobre o alerta por inatividade. Estes lembretes não enviam mensagens ao cliente.</p>
    {error&&<p role="alert" className="text-destructive text-sm">{error}</p>}<Button disabled={busy}>{busy?'Salvando...':'Salvar lembretes'}</Button>
  </form>
}
