import test from 'node:test'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import { guessMapping, parseLine } from '../lib/lead-import'

test('Excel workbook preserves accented names, prices and equivalent telephone keys', () => {
  const source = [
    ['Cliente', 'WhatsApp', 'Preço', 'Status'],
    ['João', '(17) 99999-9999', '2.000,50', 'Orçamento enviado'],
    ['Maria', '5517999999999', '350,00', 'NOVO'],
  ]
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(source), 'Leads')
  const buffer = XLSX.write(book, {type:'buffer', bookType:'xlsx'})
  const parsed = XLSX.read(buffer, {type:'buffer', cellDates:false, bookVBA:false, bookSheets:false})
  const rows = XLSX.utils.sheet_to_json<string[]>(parsed.Sheets[parsed.SheetNames[0]], {header:1, raw:false, defval:'', blankrows:false})
  const mapping = guessMapping(rows[0])
  const first = parseLine(rows[0], mapping, rows[1], 2)
  const second = parseLine(rows[0], mapping, rows[2], 3)
  assert.equal(first.input?.name, 'João')
  assert.equal(first.input?.value, 2000.5)
  assert.equal(first.input?.status, 'ORCAMENTO_ENVIADO')
  assert.equal(first.normalizedPhone, second.normalizedPhone)
  assert.equal(rows.length, 3)
})
