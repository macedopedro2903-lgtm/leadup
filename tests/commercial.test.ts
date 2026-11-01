import test from 'node:test'
import assert from 'node:assert/strict'
import {moneyInput,leadSchema} from '../lib/lead-validation'
import {attentionReason} from '../lib/commercial'
import {newResetToken,hashResetToken} from '../lib/password-reset'
import {ACTIVE_LEAD_STATUSES} from '../lib/plan'

test('money accepts Brazilian or decimal inputs without multiplying cents',()=>{
  assert.equal(moneyInput.parse('1.234,56'),1234.56)
  assert.equal(moneyInput.parse('1234.56'),1234.56)
  assert.equal(moneyInput.parse(1234.56),1234.56)
  for(const value of ['abc',Infinity,-1,'-10,00'])assert.equal(moneyInput.safeParse(value).success,false)
})
test('all open pipeline stages consume the existing plan limit',()=>{
  assert.ok(ACTIVE_LEAD_STATUSES.includes('PRIMEIRO_CONTATO'))
  assert.ok(ACTIVE_LEAD_STATUSES.includes('AGUARDANDO_RESPOSTA'))
  assert.equal(leadSchema.safeParse({name:'Lead',status:'AGUARDANDO_RESPOSTA'}).success,true)
  assert.equal(leadSchema.safeParse({name:'Lead',nextFollowup:'bad'}).success,false)
})
test('reminders honor disable, closed leads and explicit future schedules',()=>{
  const now=new Date('2026-11-01T12:00:00Z')
  const lead={status:'AGUARDANDO_RESPOSTA',followupEnabled:true,followupAfterDays:3,nextFollowup:null,lastContactAt:null,createdAt:new Date('2026-10-01T12:00:00Z')}
  assert.equal(attentionReason(lead,now),'Sem interação recente')
  assert.equal(attentionReason({...lead,followupEnabled:false},now),null)
  assert.equal(attentionReason({...lead,status:'FECHADO'},now),null)
  assert.equal(attentionReason({...lead,nextFollowup:new Date('2026-11-02')},now),null)
  assert.equal(attentionReason({...lead,lastContactAt:now},now),null)
  assert.equal(attentionReason({...lead,nextFollowup:new Date('2026-10-31')},now),'Acompanhamento agendado vencido')
})
test('password reset stores a digest and uses random independent tokens',()=>{
  const a=newResetToken(),b=newResetToken()
  assert.notEqual(a.token,b.token)
  assert.equal(a.hash,hashResetToken(a.token))
  assert.notEqual(a.token,a.hash)
})
