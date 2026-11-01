'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageCircle, Link2Off, Loader2 } from 'lucide-react'

type MetaSDK = {
  init: (settings:{appId:string;version:string;xfbml:boolean;autoLogAppEvents:boolean})=>void
  login: (callback:(response:{authResponse?:{code?:string}})=>void,settings:Record<string,unknown>)=>void
}
declare global {interface Window {FB?:MetaSDK}}
type State = {
  settings:{appId:string;configId:string;version:string;ready:boolean}
  connection:null|{status:'PENDING_REGISTRATION'|'CONNECTED';displayPhone:string|null;connectedAt:string;lastError:string|null;skippedMessages:number}
  nonce:string
}

type SignupIds={wabaId:string;phoneNumberId:string}

export function WhatsAppConnectionCard() {
  const [state,setState]=useState<State|null>(null)
  const [sdkReady,setSdkReady]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [info,setInfo]=useState<string|null>(null)
  const [pin,setPin]=useState('')
  const nonceRef=useRef('')
  const codeRef=useRef('')
  const idsRef=useRef<SignupIds|null>(null)
  const sentRef=useRef(false)

  const reload = useCallback(async()=>{
    const response=await fetch('/api/whatsapp/connect',{cache:'no-store'})
    if(!response.ok)throw new Error('Falha ao consultar conexão WhatsApp.')
    const json=await response.json() as State
    setState(json)
    nonceRef.current=json.nonce
    return json
  },[])

  useEffect(()=>{
    const controller = new AbortController()
    void fetch('/api/whatsapp/connect',{cache:'no-store',signal:controller.signal})
      .then(async response=>{
        if(!response.ok)throw new Error('Connection unavailable')
        const json=await response.json() as State
        if(controller.signal.aborted)return
        setState(json);nonceRef.current=json.nonce
      })
      .catch(()=>{if(!controller.signal.aborted)setError('Não foi possível consultar o WhatsApp.')})
    return ()=>controller.abort()
  },[])

  useEffect(()=>{
    if (!state?.settings.ready || state.connection || window.FB) {
      if(window.FB && state?.settings.ready){window.FB.init({appId:state.settings.appId,version:state.settings.version,xfbml:false,autoLogAppEvents:false});void Promise.resolve().then(()=>setSdkReady(true))}
      return
    }
    const script=document.createElement('script')
    script.src='https://connect.facebook.net/pt_BR/sdk.js'
    script.async=true
    script.crossOrigin='anonymous'
    script.onload=()=>{
      if(window.FB){window.FB.init({appId:state.settings.appId,version:state.settings.version,xfbml:false,autoLogAppEvents:false});setSdkReady(true)}
    }
    script.onerror=()=>setError('Não foi possível carregar a autorização da Meta.')
    document.body.appendChild(script)
    return ()=>{ /* Keep the Meta SDK available for another connection attempt. */ }
  },[state?.settings.ready,state?.settings.appId,state?.settings.version,state?.connection])

  const complete = useCallback(async()=>{
    const ids=idsRef.current
    const code=codeRef.current
    if(!ids || !code || !nonceRef.current || sentRef.current)return
    sentRef.current=true
    setBusy(true)
    setError(null)
    try {
      const res=await fetch('/api/whatsapp/connect',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...ids,code,nonce:nonceRef.current}),
      })
      const body=await res.json().catch(()=>({})) as {error?:string}
      if(!res.ok)throw new Error(body.error??'Erro ao vincular WhatsApp.')
      setInfo('Autorização registrada. Para ativar o recebimento, conclua o registro do número com o PIN de seis dígitos.')
      await reload()
    }catch(e){
      setError(e instanceof Error?e.message:'Falha ao conectar WhatsApp.')
      await reload().catch(()=>{})
    }finally{setBusy(false)}
  },[reload])

  useEffect(()=>{
    const onMessage=(event:MessageEvent)=>{
      if(!/^https:\/\/(?:[a-z0-9-]+\.)?facebook\.com$/.test(event.origin))return
      try{
        const parsed=typeof event.data==='string'?JSON.parse(event.data):event.data
        if(parsed?.type!=='WA_EMBEDDED_SIGNUP')return
        if(parsed.event==='FINISH' && typeof parsed.data?.waba_id==='string' && typeof parsed.data?.phone_number_id==='string'){
          idsRef.current={wabaId:parsed.data.waba_id,phoneNumberId:parsed.data.phone_number_id}
          void complete()
        }else if(parsed.event==='CANCEL'){setBusy(false);setInfo('Autorização cancelada na Meta.')}
        else if(parsed.event==='ERROR'){setBusy(false);setError('A Meta não concluiu a autorização. Tente novamente.')}
      }catch{ /* Ignore unrelated browser messages. */ }
    }
    window.addEventListener('message',onMessage)
    return ()=>window.removeEventListener('message',onMessage)
  },[complete])

  const launch=()=>{
    if(!state?.settings.ready || !sdkReady || !window.FB || busy)return
    setError(null);setInfo(null)
    codeRef.current='';idsRef.current=null;sentRef.current=false
    setBusy(true)
    // Important: FB.login must run directly in the button click for popup blockers.
    window.FB.login(response=>{
      if(!response.authResponse?.code){setBusy(false);setInfo('A autorização não foi concluída.');return}
      codeRef.current=response.authResponse.code
      void complete()
    },{
      config_id:state.settings.configId,
      response_type:'code',override_default_response_type:true,
      auth_type:'rerequest',extras:{setup:{}},
    })
  }

  const register=async()=>{
    setError(null);setInfo(null);setBusy(true)
    try{
      const response=await fetch('/api/whatsapp/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})})
      const body=await response.json().catch(()=>({})) as {error?:string}
      if(!response.ok)throw new Error(body.error??'Falha ao registrar número.')
      setPin('');setInfo('Número registrado. Aguardando mensagens de teste enviadas pela Meta.')
      await reload()
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar.')}finally{setBusy(false)}
  }

  const disconnect=async()=>{
    if(!window.confirm('Desconectar o WhatsApp? Seus leads e o histórico permanecerão salvos.'))return
    setBusy(true);setError(null);setInfo(null)
    try{
      const response=await fetch('/api/whatsapp/connect',{method:'DELETE'})
      if(!response.ok)throw new Error('Falha ao desconectar WhatsApp.')
      setInfo('Desconectado no LeadUp. Revogue também o acesso da integração nas configurações da Meta se desejar.')
      await reload()
    }catch(e){setError(e instanceof Error?e.message:'Erro ao desconectar.')}finally{setBusy(false)}
  }

  const current=state?.connection
  return <Card>
    <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-5 w-5"/>Integração oficial com WhatsApp</CardTitle></CardHeader>
    <CardContent className="space-y-4 text-sm">
      {!state ? <p>Consultando conexão...</p> : !state.settings.ready ?
        <p className="text-muted-foreground">Conexão ainda indisponível: o administrador precisa configurar o aplicativo Meta, o webhook e as chaves de segurança. Nenhuma conta será conectada sem autorização.</p> : current?.status==='CONNECTED' ? <>
          <p><strong>Conectado:</strong> {current.displayPhone || 'Número autorizado'}</p>
          <p className="text-muted-foreground">O recebimento automático será confirmado ao receber uma mensagem de teste no número conectado. Somente mensagens novas e autorizadas são registradas.</p>
          {current.lastError && <p role="alert" className="text-destructive">{current.lastError} ({current.skippedMessages} mensagens ignoradas)</p>}
          <Button variant="outline" disabled={busy} onClick={disconnect}><Link2Off className="mr-2 h-4 w-4"/>Desconectar</Button>
        </> : current?.status==='PENDING_REGISTRATION' ? <>
          <p><strong>Autorizado na Meta:</strong> {current.displayPhone || 'Número selecionado'}. Falta registrar o número na Cloud API.</p>
          <div className="space-y-2"><Label htmlFor="whatsapp-meta-pin">PIN de seis dígitos para registrar o número na Meta</Label><Input id="whatsapp-meta-pin" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="off" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,6))}/></div>
          <div className="flex gap-2 flex-wrap"><Button disabled={busy||!/^[0-9]{6}$/.test(pin)} onClick={register}>{busy&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Ativar WhatsApp</Button><Button variant="outline" disabled={busy} onClick={disconnect}>Cancelar conexão</Button></div>
        </> : <>
          <p className="text-muted-foreground">Conecte seu próprio número comercial usando o cadastro oficial da Meta. O LeadUp não solicita senha nem QR Code do seu WhatsApp.</p>
          <Button disabled={busy||!sdkReady} onClick={launch}>{busy&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Conectar WhatsApp com a Meta</Button>
        </>}
      {info&&<p role="status" className="text-muted-foreground">{info}</p>}
      {error&&<p role="alert" className="text-destructive">{error}</p>}
    </CardContent>
  </Card>
}
