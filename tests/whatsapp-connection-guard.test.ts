import test from 'node:test'
import assert from 'node:assert/strict'
import {freshNonce,validNonce,sameOrigin} from '../lib/whatsapp-connect-guard.ts'
import type {NextRequest} from 'next/server'

test('A signed onboarding nonce is scoped to the authenticated LeadUp account',()=>{
  const original=process.env.AUTH_SECRET
  process.env.AUTH_SECRET='independent-strong-test-secret-not-for-production'
  try {
    const {nonce,cookie}=freshNonce('user-a')
    assert.equal(validNonce('user-a',cookie,nonce),true)
    assert.equal(validNonce('user-b',cookie,nonce),false)
    assert.equal(validNonce('user-a',cookie,'0'.repeat(64)),false)
    assert.equal(validNonce('user-a',cookie+'bad',nonce),false)
    assert.equal(validNonce('user-a',cookie+'.extra',nonce),false)
    const parts=cookie.split('.')
    parts[0]=String(Date.now()-11*60*1000)
    assert.equal(validNonce('user-a',parts.join('.'),nonce),false)
  } finally {
    if(original===undefined) delete process.env.AUTH_SECRET
    else process.env.AUTH_SECRET=original
  }
})

test('Proxy origins use explicit configuration and never trust forwarded hosts',()=>{
  const previous=process.env.LEADUP_PUBLIC_ORIGIN
  const request=(origin:string,forwardedHost='attacker.example')=>({
    headers:new Headers({origin,'x-forwarded-host':forwardedHost}),
    nextUrl:{origin:'http://localhost:3000'},
  }) as unknown as NextRequest
  try {
    process.env.LEADUP_PUBLIC_ORIGIN='https://leadup.abacusai.app'
    assert.equal(sameOrigin(request('https://leadup.abacusai.app')),true)
    assert.equal(sameOrigin(request('https://attacker.example')),false)
    assert.equal(sameOrigin(request('http://localhost:3000')),false)
    process.env.LEADUP_PUBLIC_ORIGIN='https://leadup.abacusai.app/untrusted-path'
    assert.equal(sameOrigin(request('https://leadup.abacusai.app')),false)
    delete process.env.LEADUP_PUBLIC_ORIGIN
    assert.equal(sameOrigin(request('http://localhost:3000')),true)
    assert.equal(sameOrigin(request('https://attacker.example')),false)
  } finally {
    if(previous===undefined)delete process.env.LEADUP_PUBLIC_ORIGIN
    else process.env.LEADUP_PUBLIC_ORIGIN=previous
  }
})
