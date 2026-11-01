import test from 'node:test'
import assert from 'node:assert/strict'
import {freshNonce,validNonce} from '../lib/whatsapp-connect-guard.ts'

test('A signed onboarding nonce is scoped to the authenticated LeadUp account',()=>{
  const original=process.env.AUTH_SECRET
  process.env.AUTH_SECRET='independent-strong-test-secret-not-for-production'
  try {
    const {nonce,cookie}=freshNonce('user-a')
    assert.equal(validNonce('user-a',cookie,nonce),true)
    assert.equal(validNonce('user-b',cookie,nonce),false)
    assert.equal(validNonce('user-a',cookie,'0'.repeat(64)),false)
    assert.equal(validNonce('user-a',cookie+'bad',nonce),false)
    const parts=cookie.split('.')
    parts[0]=String(Date.now()-11*60*1000)
    assert.equal(validNonce('user-a',parts.join('.'),nonce),false)
  } finally {
    if(original===undefined) delete process.env.AUTH_SECRET
    else process.env.AUTH_SECRET=original
  }
})
