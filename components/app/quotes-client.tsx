'use client'
import {useState} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card'
import {formatBRL} from '@/lib/format'
import {QUOTE_LABEL} from '@/lib/commercial'

type Quote={id:string;leadId:string;title:string;description:string|null;amount:string;status:string;version:number;validUntil:string|null;lead:{name:string}}
export function QuotesClient({leads,quotes}:{leads:{id:string;name:string}[];quotes:Quote[]}) {
  const router=useRouter()
  const [editing,setEditing]=useState<Quote|null>(null)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  async function save(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError('')
    const form=event.currentTarget, values=new FormData(form)
    try {
      const data={leadId:values.get('leadId'),title:values.get('title'),description:values.get('description'),amount:values.get('amount'),validUntil:values.get('validUntil')||null,...(editing?{version:editing.version,status:values.get('status')}:{})}
      const response=await fetch(editing?`/api/orcamentos/${editing.id}`:'/api/orcamentos',{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
      const result=await response.json()
      if(!response.ok)throw new Error(result.error||'Não foi possível salvar.')
      form.reset();form.dataset.dirty='false';setEditing(null);router.refresh()
    }catch(error){setError(error instanceof Error?error.message:'Erro de conexão.')}finally{setBusy(false)}
  }
  return <div className="space-y-6 max-w-4xl">
    <div><h1 className="font-display text-2xl font-bold">Orçamentos</h1><p className="text-sm text-muted-foreground">Registre propostas e acompanhe o aceite. Alterações ficam no histórico do lead.</p></div>
    <Card><CardHeader><CardTitle>{editing?'Editar orçamento':'Novo orçamento'}</CardTitle></CardHeader><CardContent>
      {leads.length===0?<p>Adicione um <Link className="underline" href="/app/leads?novo=1">lead</Link> antes de criar seu orçamento.</p>:<form key={editing?.id??'new'} onSubmit={save} onChange={event=>{event.currentTarget.dataset.dirty='true'}} data-preserve-draft className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label htmlFor="quote-lead">Lead</Label><select id="quote-lead" name="leadId" defaultValue={editing?.leadId??''} required disabled={!!editing} className="w-full rounded-md border bg-background p-2"><option value="">Selecione</option>{leads.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select>{editing&&<input type="hidden" name="leadId" value={editing.leadId}/>}</div>
          <div><Label htmlFor="quote-title">Título</Label><Input id="quote-title" name="title" required maxLength={160} defaultValue={editing?.title}/></div>
          <div><Label htmlFor="quote-amount">Valor em reais</Label><Input id="quote-amount" name="amount" required inputMode="decimal" placeholder="500,00" defaultValue={editing?.amount.replace('.',',')}/></div>
          <div><Label htmlFor="quote-valid">Validade</Label><Input id="quote-valid" name="validUntil" type="date" defaultValue={editing?.validUntil?.slice(0,10)}/></div>
        </div>
        <div><Label htmlFor="quote-description">Descrição</Label><Textarea id="quote-description" name="description" maxLength={10000} defaultValue={editing?.description??''}/></div>
        {editing&&<div><Label htmlFor="quote-status">Status</Label><select id="quote-status" name="status" defaultValue={editing.status} className="ml-2 rounded-md border bg-background p-2">{Object.entries(QUOTE_LABEL).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>}
        <p className="text-xs text-muted-foreground">Marcar como enviado registra o status. O orçamento não é enviado automaticamente ao cliente.</p>
        {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><Button disabled={busy}>{busy?'Salvando...':'Salvar orçamento'}</Button>{editing&&<Button type="button" variant="outline" onClick={()=>setEditing(null)}>Cancelar</Button>}</div>
      </form>}
    </CardContent></Card>
    <div className="grid gap-3 sm:grid-cols-2">{quotes.map(q=><Card key={q.id}><CardContent className="pt-6 space-y-2"><Link href={`/app/leads/${q.leadId}`} className="text-sm text-primary underline">{q.lead.name}</Link><h2 className="font-semibold break-words">{q.title}</h2><p>{formatBRL(Number(q.amount))} · {QUOTE_LABEL[q.status]}</p><p className="text-sm whitespace-pre-wrap break-words">{q.description}</p>{q.validUntil&&<p className="text-xs text-muted-foreground">Válido até {q.validUntil.slice(0,10).split('-').reverse().join('/')}</p>}<Button variant="outline" disabled={busy} onClick={()=>{setEditing(q);setError('');window.scrollTo({top:0,behavior:'smooth'})}}>Editar</Button></CardContent></Card>)}</div>
  </div>
}
