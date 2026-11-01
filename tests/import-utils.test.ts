import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePhone } from '../lib/whatsapp'
import { parseCsv } from '../lib/csv'
import { guessMapping, parseLine } from '../lib/lead-import'

test('Brazilian phone formats normalize to the same key',()=>{
  const numbers=['(17) 99999-9999','+55 17 99999-9999','5517999999999','17 99999-9999']
  for(const n of numbers) assert.equal(normalizePhone(n),'5517999999999')
})
test('invalid phone numbers are refused',()=>{
  for(const n of ['17999','00000000000','111',''])assert.equal(normalizePhone(n),'')
})
test('CSV supports semicolon and quoted, multiline fields',()=>{
  const rows=parseCsv('Nome;Telefone;Observações\nJoão;17999999999;"Olá; tudo bem?"\nMaria;17999999998;"Duas\nlinhas"')
  assert.equal(rows.length,3)
  assert.equal(rows[1][2],'Olá; tudo bem?')
  assert.equal(rows[2][2],'Duas\nlinhas')
})
test('maps aliases and rejects a bad row without blocking good rows',()=>{
  const headers=['Cliente','Whats','Preço','Status']
  const mapping=guessMapping(headers)
  assert.equal(mapping.name,'Cliente')
  assert.equal(mapping.phone,'Whats')
  assert.equal(mapping.value,'Preço')
  const valid=parseLine(headers,mapping,['Maria','17999999999','2.000,50','Orçamento enviado'],2)
  assert.equal(valid.input?.value,2000.5)
  assert.equal(valid.input?.status,'ORCAMENTO_ENVIADO')
  const invalid=parseLine(headers,mapping,['João','199','0','Novo'],3)
  assert.match(invalid.error??'',/Telefone/)
})
test('blank imported values are represented as missing fields',()=>{
  const headers=['Nome','Telefone','Serviço']
  const mapping=guessMapping(headers)
  const line=parseLine(headers,mapping,['','(17) 99999-9999',''],2)
  assert.equal(line.input?.nameProvided,false)
  assert.equal(line.input?.service,undefined)
})
