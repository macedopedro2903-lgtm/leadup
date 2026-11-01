import test from 'node:test'
import assert from 'node:assert/strict'
import {createHmac,randomBytes} from 'node:crypto'
import { verifyMetaSignature, tokenKey, encryptMetaToken, decryptMetaToken, parseMetaInbound, validFacebookOrigin } from '../lib/whatsapp-meta-core.ts'

test('Meta webhook signatures are verified against the exact raw bytes',()=>{
  const raw='{"object":"whatsapp_business_account","entry":[]}'
  const signature='sha256='+createHmac('sha256','test-secret').update(raw).digest('hex')
  assert.equal(verifyMetaSignature(raw,signature,'test-secret'),true)
  assert.equal(verifyMetaSignature(raw+' ',signature,'test-secret'),false)
  assert.equal(verifyMetaSignature(raw,signature,'wrong-secret'),false)
  assert.equal(verifyMetaSignature(raw,'sha256=abc','test-secret'),false)
  assert.equal(verifyMetaSignature(raw,null,'test-secret'),false)
})

test('Cloud API credentials are encrypted and authentication tags are enforced',()=>{
  const key=tokenKey(randomBytes(32).toString('base64'))
  const encrypted=encryptMetaToken('per-user-access-token',key)
  assert.equal(encrypted.includes('per-user-access-token'),false)
  assert.equal(decryptMetaToken(encrypted,key),'per-user-access-token')
  assert.throws(()=>decryptMetaToken(encrypted,randomBytes(32)))
  assert.throws(()=>tokenKey('short'))
})

test('Webhook parses only incoming messages with receiving business phone id',()=>{
  const payload={object:'whatsapp_business_account',entry:[{changes:[{field:'messages',value:{
    metadata:{phone_number_id:'12345678901'},
    contacts:[{wa_id:'5517999999999',profile:{name:'Cliente teste'}}],
    messages:[{id:'wamid.abcd',from:'5517999999999',type:'text',text:{body:'Olá'}}],
    statuses:[{id:'status1',status:'delivered'}],
  }}]}]}
  assert.deepEqual(parseMetaInbound(payload),[{phoneNumberId:'12345678901',from:'5517999999999',messageId:'wamid.abcd',body:'Olá',displayName:'Cliente teste'}])
  assert.deepEqual(parseMetaInbound({...payload,object:'other'}),[])
  assert.deepEqual(parseMetaInbound({object:'whatsapp_business_account',entry:[{changes:[{field:'messages',value:{metadata:{phone_number_id:'12345678901'},statuses:[{id:'1'}]}}]}]}),[])
})

test('Non-text messages get a safe placeholder and invalid payloads are ignored',()=>{
  const payload={object:'whatsapp_business_account',entry:[{changes:[{field:'messages',value:{metadata:{phone_number_id:'12345678901'},messages:[
    {id:'msg1',from:'5517999999999',type:'image',image:{}},
    {id:'msg2',from:'x',type:'text',text:{body:'x'}},
  ]}}]}]}
  assert.equal(parseMetaInbound(payload)[0].body,'[Mensagem image]')
  assert.equal(parseMetaInbound(payload).length,1)
})

test('Only legitimate HTTPS Facebook origins are accepted',()=>{
  assert.equal(validFacebookOrigin('https://www.facebook.com'),true)
  assert.equal(validFacebookOrigin('https://business.facebook.com'),true)
  assert.equal(validFacebookOrigin('https://facebook.com.evil.com'),false)
  assert.equal(validFacebookOrigin('http://facebook.com'),false)
})
