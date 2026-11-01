import { spawn } from 'node:child_process'
import { createHmac } from 'node:crypto'

// Local HTTP smoke test of an already built app. Never uses production secrets or a database.
const port = process.env.LEADUP_SMOKE_PORT || '3001'
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',port], {
  env: {...process.env, NEXT_DIST_DIR:process.env.NEXT_DIST_DIR || '.build',
    AUTH_SECRET:'local-test-secret-not-production', NEXTAUTH_SECRET:'local-test-secret-not-production',
    DATABASE_URL:'', ABACUSAI_API_KEY:'', META_APP_ID:'', META_EMBEDDED_SIGNUP_CONFIG_ID:'',
    META_APP_SECRET:'test-webhook-secret', META_WEBHOOK_VERIFY_TOKEN:'test-verify-token',
    NEXT_TELEMETRY_DISABLED:'1'},
  stdio:['ignore','pipe','pipe'],
})
try {
  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('Server readiness timeout')),20000)
    child.stdout.on('data',data=>{if(data.toString().includes('Ready')){clearTimeout(timeout);resolve()}})
    child.on('exit',code=>{clearTimeout(timeout);reject(new Error(`Server exited ${code}`))})
    child.on('error',error=>{clearTimeout(timeout);reject(error)})
  })
  const checks = [
    ['GET','/',200], ['GET','/login',200], ['GET','/cadastro',200],
    ['GET','/app/importar',307], ['GET','/api/whatsapp/connect',401],
    ['POST','/api/whatsapp/connect',401], ['DELETE','/api/whatsapp/connect',401],
    ['POST','/api/whatsapp/register',401], ['POST','/api/importar',401], ['POST','/api/leads',401],
    ['GET','/api/whatsapp/meta-webhook',403],
    ['GET','/api/whatsapp/meta-webhook?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=abc',200],
    ['POST','/api/whatsapp/meta-webhook',401,'{}'],
    ['POST','/api/whatsapp/meta-webhook',200,'{"object":"whatsapp_business_account","entry":[]}',true],
    ['POST','/api/whatsapp/meta-webhook',400,'broken JSON',true],
  ]
  for (const [method,path,expected,body,signed] of checks) {
    const headers=signed ? {'x-hub-signature-256':'sha256='+createHmac('sha256','test-webhook-secret').update(body).digest('hex')} : {}
    const response=await fetch(`http://127.0.0.1:${port}${path}`,{method,redirect:'manual',body,headers,signal:AbortSignal.timeout(10000)})
    console.log(method,path.split('?')[0],response.status,response.status===expected?'PASS':'FAIL')
    if(response.status!==expected)process.exitCode=1
    if(path.includes('hub.challenge=') && await response.text()!=='abc')process.exitCode=1
  }
} finally {
  child.kill('SIGTERM')
}
