import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHmac, randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

// This test creates and deletes only its own fixtures in an explicitly local restore.
const url = new URL(process.env.DATABASE_URL || 'postgresql://invalid/invalid')
if (url.hostname !== 'localhost' || !['/leadup_restore','/leadup_test'].includes(url.pathname) ||
    url.searchParams.get('host') !== '/home/ubuntu/leadup_validation/socket') {
  throw new Error('Refusing to run outside the private local validation database')
}
const prisma = new PrismaClient()
const base = 'http://127.0.0.1:3005'
const secret = 'local-webhook-test-not-production'
const suffix = randomUUID()
const emails = [`validation-a-${suffix}@example.com`, `validation-b-${suffix}@example.com`]
const password = `LocalFixture-${suffix}`
const ownedIds = []
let stage = 'startup', checks = 0
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3005'], {
  env: {...process.env, NEXT_DIST_DIR:'.build', AUTH_SECRET:'local-session-test-not-production',
    NEXTAUTH_SECRET:'local-session-test-not-production', NEXTAUTH_URL:base, AUTH_URL:base, LEADUP_PUBLIC_ORIGIN:base,
    ABACUSAI_API_KEY:'', META_APP_ID:'', META_EMBEDDED_SIGNUP_CONFIG_ID:'', META_GRAPH_API_VERSION:'',
    META_APP_SECRET:secret, META_WEBHOOK_VERIFY_TOKEN:'local-verify-only',
    WHATSAPP_TOKEN_ENCRYPTION_KEY:'', NEXT_TELEMETRY_DISABLED:'1'},
  stdio:['ignore','pipe','pipe'],
})
let serverLog = ''
child.stdout.on('data',data=>{serverLog += data.toString()})
child.stderr.on('data',data=>{serverLog += data.toString()})
const pass = name => { stage = name; checks++; console.log('PASS',name) }
const begin = name => { stage = name }
function client() {
  const jar = new Map()
  return async (path,options={}) => {
    const response = await fetch(base+path, {...options,redirect:'manual',
      headers:{cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; '),...options.headers},
      signal:AbortSignal.timeout(20000)})
    for(const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0], index = pair.indexOf('=')
      jar.set(pair.slice(0,index),pair.slice(index+1))
    }
    return response
  }
}
async function login(request,email,name) {
  const signup = await request('/api/signup',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({name,email,password,businessName:'Local validation'})})
  assert.equal(signup.status,201)
  const user = await prisma.user.findUniqueOrThrow({where:{email}})
  ownedIds.push(user.id)
  const {csrfToken} = await (await request('/api/auth/csrf')).json()
  const response = await request('/api/auth/callback/credentials',{method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email,password,csrfToken})})
  assert.ok(response.status < 400)
  assert.ok(!/error=/i.test(response.headers.get('location') || ''))
  const session = await (await request('/api/auth/session')).json()
  assert.equal(session.user.email,email)
  return user
}
async function importFile(request,text,{action='commit',duplicates='skip',xlsx=false}={}) {
  const form = new FormData()
  const bytes = xlsx ? text : new TextEncoder().encode(text)
  form.set('file',new File([bytes],xlsx?'fixture.xlsx':'fixture.csv'))
  form.set('action',action); form.set('duplicates',duplicates)
  const response = await request('/api/importar',{method:'POST',body:form})
  assert.equal(response.status,200)
  return response.json()
}
async function webhook(payload,valid=true) {
  const body = JSON.stringify(payload)
  const signature = createHmac('sha256',valid?secret:'wrong-test-secret').update(body).digest('hex')
  return fetch(base+'/api/whatsapp/meta-webhook',{method:'POST',body,headers:{'x-hub-signature-256':'sha256='+signature}})
}
const inbound = (phoneNumberId,from,id) => ({field:'messages',value:{metadata:{phone_number_id:phoneNumberId},
  contacts:[{wa_id:from,profile:{name:'Fixture contact'}}],messages:[{id,from,type:'text',text:{body:'Local fixture message'}}]}})

try {
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Server readiness timeout')),30000)
    child.stdout.on('data',data=>{if(data.toString().includes('Ready')){clearTimeout(timer);resolve()}})
    child.on('exit',code=>{clearTimeout(timer);reject(new Error(`Server exited ${code}`))})
    child.on('error',error=>{clearTimeout(timer);reject(error)})
  })
  const a = client(), b = client()
  begin('signup and login A'); const userA = await login(a,emails[0],'Validation A'); pass(stage)
  begin('signup and login B'); const userB = await login(b,emails[1],'Validation B'); pass(stage)
  begin('authenticated pages')
  for(const path of ['/app','/app/leads','/app/funil','/app/followups','/app/configuracoes','/app/importar']) {
    assert.equal((await a(path)).status,200)
  }
  pass(stage)
  begin('manual lead')
  const manual = await a('/api/leads',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({name:'Fixture customer',phone:'(17) 99000-0001',service:'Preserve service',notes:'Original note',status:'NOVO',value:'100'})})
  assert.equal(manual.status,201)
  const first = await prisma.lead.findFirstOrThrow({where:{userId:userA.id}})
  pass(stage)
  begin('cross-account read write delete blocked')
  assert.equal((await b(`/api/leads/${first.id}`)).status,404)
  assert.equal((await b(`/api/leads/${first.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Forbidden'})})).status,404)
  assert.equal((await b(`/api/leads/${first.id}`,{method:'DELETE'})).status,404)
  pass(stage)
  begin('manual followup persisted')
  assert.equal((await a('/api/followups',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({leadId:first.id,message:'Fixture followup',tone:'AMIGAVEL'})})).status,201)
  pass(stage)
  const csv='Nome;Telefone;Serviço;Observações\nFixture updated;+55 17 99000-0001;;New note\nSecond;17990000002;Other;\nInvalid;17999;;'
  begin('preview does not write')
  const preview = await importFile(a,csv,{action:'preview',duplicates:'merge'})
  assert.equal(preview.novos,1); assert.equal(preview.existentes,1); assert.equal(preview.erros,1)
  assert.equal(await prisma.lead.count({where:{userId:userA.id}}),1)
  pass(stage)
  begin('CSV merge preserves identity service and history')
  const imported = await importFile(a,csv,{duplicates:'merge'})
  assert.equal(imported.created,1); assert.equal(imported.updated,1); assert.equal(imported.errors,1)
  const merged = await prisma.lead.findUniqueOrThrow({where:{id:first.id},include:{followups:true}})
  assert.equal(merged.service,'Preserve service'); assert.equal(merged.followups.length,1)
  assert.ok(merged.notes.includes('Original note') && merged.notes.includes('New note'))
  pass(stage)
  begin('repeat import skips duplicates')
  const again = await importFile(a,csv)
  assert.equal(again.created,0); assert.equal(again.skipped,2)
  assert.equal(await prisma.lead.count({where:{userId:userA.id}}),2)
  pass(stage)
  begin('same telephone allowed in separate account')
  assert.equal((await importFile(b,'Nome;Telefone\nSeparate;17990000001')).created,1)
  pass(stage)
  begin('Excel HTTP import persists')
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['Nome','Telefone'],['Excel fixture','17990000003']]),'Leads')
  const bytes = XLSX.write(book,{type:'buffer',bookType:'xlsx'})
  assert.equal((await importFile(a,bytes,{xlsx:true})).created,1)
  pass(stage)
  begin('Free import limit')
  const bulk='Nome;Telefone\n'+Array.from({length:20},(_,i)=>`Bulk ${i};1799000${String(i+100).padStart(4,'0')}`).join('\n')
  const limited = await importFile(a,bulk)
  assert.equal(limited.created,7); assert.equal(limited.limit,13)
  assert.equal(await prisma.lead.count({where:{userId:userA.id,status:{in:['NOVO','ORCAMENTO_ENVIADO','NEGOCIANDO']}}}),10)
  pass(stage)
  begin('concurrent imports cannot exceed Free limit')
  await prisma.lead.update({where:{id:first.id},data:{status:'FECHADO'}})
  const race = await Promise.all([importFile(a,'Nome;Telefone\nRace A;17990000901'),importFile(a,'Nome;Telefone\nRace B;17990000902')])
  assert.equal(race.reduce((sum,item)=>sum+item.created,0),1)
  assert.equal(await prisma.lead.count({where:{userId:userA.id,status:{in:['NOVO','ORCAMENTO_ENVIADO','NEGOCIANDO']}}}),10)
  pass(stage)
  begin('manual create blocked at Free limit')
  assert.equal((await a('/api/leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Over limit',phone:'17990000903'})})).status,403)
  pass(stage)
  begin('Start and expired Start limits')
  await prisma.user.update({where:{id:userB.id},data:{plan:'START',planStatus:'ACTIVE',planExpiresAt:new Date(Date.now()+86400000)}})
  assert.equal((await importFile(b,bulk,{action:'preview'})).limite,0)
  await prisma.user.update({where:{id:userB.id},data:{planExpiresAt:new Date(Date.now()-86400000)}})
  assert.equal((await importFile(b,bulk,{action:'preview'})).limite,11)
  pass(stage)
  begin('signed webhook routes and deduplicates per account')
  await prisma.whatsAppConnection.createMany({data:[
    {userId:userA.id,wabaId:'800001',phoneNumberId:'900001',encryptedToken:'test-fixture-never-used',status:'CONNECTED'},
    {userId:userB.id,wabaId:'800002',phoneNumberId:'900002',encryptedToken:'test-fixture-never-used',status:'CONNECTED'},
  ]})
  const event={object:'whatsapp_business_account',entry:[{changes:[inbound('900001','5517990000001','shared-fixture'),inbound('900002','5517990000001','shared-fixture')]}]}
  assert.equal((await webhook(event)).status,200); assert.equal((await webhook(event)).status,200)
  assert.equal(await prisma.leadMessage.count({where:{userId:{in:ownedIds},providerMessageId:'shared-fixture'}}),2)
  assert.equal((await prisma.leadMessage.findFirstOrThrow({where:{userId:userA.id}})).leadId,first.id)
  assert.equal((await webhook(event,false)).status,401)
  pass(stage)
  begin('new inbound creates B lead and respects A limit')
  const newEvent={object:'whatsapp_business_account',entry:[{changes:[inbound('900001','5517990000904','new-a'),inbound('900002','5517990000904','new-b')]}]}
  assert.equal((await webhook(newEvent)).status,200)
  assert.equal(await prisma.lead.count({where:{userId:userA.id,normalizedPhone:'5517990000904'}}),0)
  assert.equal(await prisma.lead.count({where:{userId:userB.id,normalizedPhone:'5517990000904',source:'WHATSAPP',createdAutomatically:true}}),1)
  pass(stage)
  begin('connection nonce and origin protections')
  const state = await (await a('/api/whatsapp/connect')).json()
  assert.equal(state.settings.ready,false); assert.equal(typeof state.nonce,'string')
  assert.ok(!JSON.stringify(state).includes('test-fixture-never-used'))
  assert.equal((await a('/api/whatsapp/connect',{method:'DELETE',headers:{origin:'https://untrusted.example'}})).status,403)
  assert.equal((await a('/api/whatsapp/connect',{method:'DELETE',headers:{origin:base}})).status,200)
  assert.equal(await prisma.whatsAppConnection.count({where:{userId:userA.id}}),0)
  assert.equal(await prisma.whatsAppConnection.count({where:{userId:userB.id}}),1)
  assert.equal(await prisma.followup.count({where:{userId:userA.id}}),1)
  pass(stage)
  begin('logout clears authenticated session')
  const {csrfToken} = await (await a('/api/auth/csrf')).json()
  await a('/api/auth/signout',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken})})
  assert.equal((await a('/app')).status,307)
  pass(stage)
  if(process.env.LEADUP_RESTORE_BACKUP) {
    begin('backup records unchanged after migration and fixtures')
    const backup = JSON.parse(readFileSync(process.env.LEADUP_RESTORE_BACKUP,'utf8'))
    for(const [model,rows] of Object.entries(backup)) {
      for(const row of rows) {
        const key = model==='appSetting'?'key':'id'
        const actual = JSON.parse(JSON.stringify(await prisma[model].findUnique({where:{[key]:row[key]}})))
        assert.ok(actual)
        for(const [field,value] of Object.entries(row)) assert.deepEqual(actual[field],value,'Original record changed')
      }
    }
    pass(stage)
  }
  console.log('DATABASE INTEGRATION PASS',checks)
} catch (error) {
  console.error('DATABASE INTEGRATION FAIL at',stage)
  if (typeof error.actual === 'number' || typeof error.expected === 'number') {
    console.error('Status/count actual:', typeof error.actual === 'number' ? error.actual : 'non-numeric',
      'expected:', typeof error.expected === 'number' ? error.expected : 'non-numeric')
  }
  writeFileSync('../database-server.log',serverLog,{mode:0o600})
  process.exitCode=1
} finally {
  // Strictly scoped to accounts created by this test, never the restored accounts.
  const fixtures = await prisma.user.findMany({where:{email:{in:emails}},select:{id:true}})
  const ids = fixtures.map(user=>user.id)
  await prisma.leadMessage.deleteMany({where:{userId:{in:ids}}})
  await prisma.user.deleteMany({where:{id:{in:ids}}})
  await prisma.$disconnect()
  child.kill('SIGTERM')
}
