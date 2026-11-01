'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileUp, Loader2 } from 'lucide-react'
import { FIELD_LABELS, IMPORT_FIELDS, type ImportField, type ImportMapping } from '@/lib/lead-import'

type PreviewRow={line:number;name:string;phone:string;status:string;result:string;reason:string}
type Preview={headers:string[];mapping:ImportMapping;total:number;novos:number;existentes:number;erros:number;limite:number;rows:PreviewRow[];canImport:boolean}
type Result={created:number;updated:number;skipped:number;errors:number;limit:number;total:number;errorRows:PreviewRow[]}

function downloadText(name:string,text:string) {
  const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8'}))
  const a=document.createElement('a');a.href=url;a.download=name;a.click()
  URL.revokeObjectURL(url)
}
const csvCell=(value:unknown)=>{
  const raw=String(value??'')
  const safe=/^[\s]*[=+@-]/.test(raw) ? '\''+raw : raw
  return `"${safe.replace(/"/g,'""')}"`
}

export function ImportClient() {
  const [file,setFile]=useState<File|null>(null)
  const [preview,setPreview]=useState<Preview|null>(null)
  const [mapping,setMapping]=useState<ImportMapping>({})
  const [headers,setHeaders]=useState<string[]>([])
  const [duplicates,setDuplicates]=useState<'skip'|'update'|'merge'>('skip')
  const [step,setStep]=useState('')
  const [error,setError]=useState('')
  const [result,setResult]=useState<Result|null>(null)

  async function request(action:'preview'|'commit', chosen:File|null, currentMapping?:ImportMapping, policy=duplicates) {
    if(!chosen)return
    setError('');setStep(action==='commit'?'Importando leads...':'Validando registros...')
    try {
      const form=new FormData();form.set('file',chosen);form.set('action',action);form.set('duplicates',policy)
      if(currentMapping) form.set('mapping',JSON.stringify(currentMapping))
      const response=await fetch('/api/importar',{method:'POST',body:form})
      const data=await response.json()
      if(data.headers){setHeaders(data.headers);setMapping(data.mapping??{})}
      if(!response.ok) {setPreview(null);setError(data.error??'Falha ao analisar o arquivo.');return}
      if(action==='preview') {setPreview(data);setResult(null)}
      else {setResult(data);setPreview(null)}
    }catch {setError('Falha de conexão. Tente novamente.')}finally {setStep('')}
  }

  function template() {
    const data=[['Nome','Telefone','Empresa','Serviço','Valor','Status','Observações','Próximo Follow-up','Origem','E-mail'],
      ['Maria Exemplo','(17) 99999-0001','Empresa Modelo','Orçamento','250,00','NOVO','','2026-12-10','Indicação','maria@exemplo.com'],
      ['João Exemplo','+55 17 99999-0002','Oficina Exemplo','Revisão','350,00','NEGOCIANDO','','2026-12-12','Instagram','joao@exemplo.com']]
    downloadText('modelo_leadup.csv',data.map(row=>row.map(csvCell).join(';')).join('\r\n'))
  }
  function report() {
    if(!result)return
    downloadText('erros_importacao_leadup.csv',[
      ['Linha','Nome','Telefone','Problema'].map(csvCell).join(';'),
      ...result.errorRows.map(r=>[r.line,r.name,r.phone,r.reason].map(csvCell).join(';')),
    ].join('\r\n'))
  }

  return <div className="space-y-6 max-w-5xl">
    <div><h1 className="text-2xl font-bold font-display">Importar leads</h1>
      <p className="text-sm text-muted-foreground mt-1">Envie sua planilha, confira os contatos e confirme. Nenhum dado é alterado antes da confirmação.</p></div>
    <Card><CardHeader><CardTitle className="text-lg">1. Escolher planilha</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="flex flex-wrap items-center gap-3"><Button variant="outline" onClick={template}><Download className="h-4 w-4 mr-2"/> Baixar modelo de planilha</Button><span className="text-sm text-muted-foreground">CSV ou XLSX · até 2 MB · até 1000 registros</span></div>
      <input aria-label="Planilha de leads" type="file" accept=".csv,.xlsx" className="block max-w-full text-sm file:mr-3 file:rounded-md file:border file:p-2 file:bg-transparent" onChange={e=>{
        const chosen=e.target.files?.[0]??null
        setFile(chosen);setPreview(null);setHeaders([]);setMapping({});setResult(null);setError('')
        if(chosen)void request('preview',chosen,undefined)
      }}/>
    </CardContent></Card>
    {headers.length>0 && file && !result && <Card><CardHeader><CardTitle className="text-lg">2. Conferir colunas</CardTitle></CardHeader><CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">Associe cada campo do LeadUp à coluna da sua planilha. Telefone é obrigatório.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{IMPORT_FIELDS.map((field:ImportField)=><div key={field} className="space-y-1">
        <label className="text-sm font-medium">{FIELD_LABELS[field]}{field==='phone'?' *':''}</label>
        <Select value={mapping[field]??'__none'} onValueChange={v=>{setMapping(m=>({...m,[field]:v==='__none'?undefined:v}));setPreview(null)}}>
          <SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="__none">Não importar</SelectItem>{headers.map(h=><SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
        </Select>
      </div>)}</div>
      <div className="space-y-2"><label className="text-sm font-medium">Quando o telefone já existir</label>
        <Select value={duplicates} onValueChange={v=>{setDuplicates(v as typeof duplicates);setPreview(null)}}><SelectTrigger className="max-w-sm"><SelectValue/></SelectTrigger><SelectContent>
          <SelectItem value="skip">Pular (recomendado)</SelectItem><SelectItem value="update">Atualizar campos preenchidos</SelectItem><SelectItem value="merge">Mesclar, preservando observações anteriores</SelectItem>
        </SelectContent></Select></div>
      <Button variant="outline" disabled={!!step||!mapping.phone} onClick={()=>void request('preview',file,mapping)}>{step?'Analisando...':'Atualizar conferência'}</Button>
    </CardContent></Card>}
    {step && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin"/>{step}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {preview && <Card><CardHeader><CardTitle className="text-lg">3. Conferência — {file?.name}</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{[['Total',preview.total],['Novos',preview.novos],['Existentes',preview.existentes],['Erros',preview.erros],['Limite do plano',preview.limite]].map(([label,count])=><div key={label} className="border rounded-lg p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="text-xl font-semibold">{count}</div></div>)}</div>
      <div className="max-h-96 overflow-auto border rounded-md"><table className="w-full min-w-[600px] text-sm"><thead className="sticky top-0 bg-background"><tr>{['Linha','Nome','Telefone','Status','Resultado','Observação'].map(h=><th key={h} className="p-2 border-b text-left">{h}</th>)}</tr></thead><tbody>{preview.rows.map(r=><tr key={r.line} className="border-b"><td className="p-2">{r.line}</td><td className="p-2">{r.name}</td><td className="p-2">{r.phone}</td><td className="p-2">{r.status}</td><td className="p-2 font-medium">{r.result}</td><td className="p-2 text-muted-foreground">{r.reason}</td></tr>)}</tbody></table></div>
      <p className="text-sm text-muted-foreground">O plano Free mantém o limite atual de leads ativos. Registros acima do limite serão ignorados.</p>
      <Button disabled={!!step||!preview.canImport} onClick={()=>void request('commit',file,mapping)}><FileUp className="h-4 w-4 mr-2"/> Confirmar importação</Button>
    </CardContent></Card>}
    {result && <Card><CardHeader><CardTitle>Importação concluída</CardTitle></CardHeader><CardContent className="space-y-4">
      <p className="text-sm">{result.created} adicionados · {result.updated} atualizados · {result.skipped} ignorados · {result.errors} com erro.</p>
      <div className="flex flex-wrap gap-2"><Button asChild><Link href="/app/leads">Ver leads</Link></Button>{result.errorRows.length>0 && <Button variant="outline" onClick={report}><Download className="h-4 w-4 mr-2"/> Baixar relatório de erros</Button>}</div>
    </CardContent></Card>}
  </div>
}
