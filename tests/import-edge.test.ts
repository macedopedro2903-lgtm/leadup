import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePhone, buildWhatsappUrl } from '../lib/whatsapp'
import { parseCsv } from '../lib/csv'
import { guessMapping, parseLine, cleanMapping } from '../lib/lead-import'

test('wa.me encodes message and refuses invalid numbers', () => {
  assert.equal(buildWhatsappUrl('(17) 99999-9999', 'Olá! A&B'), 'https://wa.me/5517999999999?text=Ol%C3%A1!%20A%26B')
  assert.equal(buildWhatsappUrl('123'), '')
})
test('supports leading country prefix 00 and rejects invalid DDD', () => {
  assert.equal(normalizePhone('0055 17 99999-9999'), '5517999999999')
  assert.equal(normalizePhone('00 99999-9999'), '')
})
test('column detection handles accents, and invalid mapping is ignored', () => {
  const headers=['Nóme','Número','Observações','Valor']
  assert.deepEqual(guessMapping(headers),{name:'Nóme',phone:'Número',value:'Valor',notes:'Observações'})
  assert.deepEqual(cleanMapping(headers,{phone:'Número',name:'NotInFile'}),{phone:'Número'})
})
test('invalid status, value, date and email are reported individually', () => {
  const headers=['Nome','Telefone','Situação','Valor','Próximo Follow-up','E-mail']
  const map=guessMapping(headers)
  const base=['Ana','17999999999','Novo','100','2026-11-10','ana@example.com']
  for(const [col,val,reason] of [[2,'Desconhecido','Status'],[3,'x12','Valor'],[4,'31/02/2026','Data'],[5,'invalid','E-mail']] as const) {
    const arr=[...base];arr[col]=val
    assert.match(parseLine(headers,map,arr,2).error??'',new RegExp(reason))
  }
  assert.equal(parseLine(headers,map,base,2).input?.name,'Ana')
})
test('CSV preserves commas inside quoted values', () => {
  const rows=parseCsv('Nome,Telefone,Observações\n"Ana, Maria",17999999999,"Alô, oi"\n')
  assert.equal(rows[1][0],'Ana, Maria')
  assert.equal(rows[1][2],'Alô, oi')
})
