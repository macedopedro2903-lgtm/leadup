import { normalizePhone } from './whatsapp'

export const IMPORT_FIELDS = ['name','phone','company','service','value','status','notes','nextFollowup','importOrigin','email'] as const
export type ImportField = typeof IMPORT_FIELDS[number]
export type ImportMapping = Partial<Record<ImportField,string>>
export type ImportInput = {
  line: number
  name: string
  nameProvided: boolean
  phone: string
  normalizedPhone: string
  company?: string
  service?: string
  value?: number
  status: 'PRIMEIRO_CONTATO' | 'AGUARDANDO_RESPOSTA' | 'NOVO' | 'ORCAMENTO_ENVIADO' | 'NEGOCIANDO' | 'FECHADO' | 'PERDIDO'
  explicitStatus: boolean
  notes?: string
  nextFollowup?: Date
  importOrigin?: string
  email?: string
}
export type ParsedLine = {
  line: number
  name: string
  phone: string
  normalizedPhone: string
  status: string
  error?: string
  input?: ImportInput
}

export const FIELD_LABELS: Record<ImportField,string> = {
  name:'Nome',phone:'Telefone',company:'Empresa',service:'Serviço',value:'Valor',
  status:'Status',notes:'Observações',nextFollowup:'Próximo follow-up',
  importOrigin:'Origem',email:'E-mail',
}
const ALIASES: Record<ImportField,string[]> = {
  name:['nome','cliente','contato','name'],
  phone:['telefone','whatsapp','whats','celular','fone','numero','número','phone','tel'],
  company:['empresa','negocio','business','company'],
  service:['servico','serviço','produto','service'],
  value:['valor','preco','preço','orcamento','orçamento','value'],
  status:['status','situacao','situação','etapa'],
  notes:['observacoes','observações','obs','anotacoes','notas','notes'],
  nextFollowup:['proximo followup','próximo follow-up','proximo follow-up','data followup','retorno'],
  importOrigin:['origem','source','fonte'],
  email:['email','e-mail','correio'],
}
export const normalizeHeader = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()
export function guessMapping(headers: string[]): ImportMapping {
  const mapping: ImportMapping = {}
  for (const field of IMPORT_FIELDS) {
    const aliases = ALIASES[field].map(normalizeHeader)
    const match = headers.find((h) => aliases.includes(normalizeHeader(h)))
    if (match) mapping[field] = match
  }
  return mapping
}
export function cleanMapping(headers: string[], raw: unknown): ImportMapping {
  const result: ImportMapping = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return guessMapping(headers)
  for (const key of IMPORT_FIELDS) {
    const value = (raw as Record<string,unknown>)[key]
    if (typeof value === 'string' && headers.includes(value)) result[key] = value
  }
  return result
}
function clean(value: unknown, max = 300): string { return String(value ?? '').trim().slice(0,max) }
function parseMoney(raw: string): number | undefined | null {
  if (!raw) return undefined
  const value = raw.replace(/\s/g,'').replace(/^R\$/i,'')
  if (!/^[0-9.,]+$/.test(value)) return null
  const comma = value.lastIndexOf(',')
  const dot = value.lastIndexOf('.')
  let normal = value
  if (comma > dot) normal = value.replace(/\./g,'').replace(',','.')
  else if (dot > comma) normal = comma<0 && /^[0-9]{1,3}(\.[0-9]{3})+$/.test(value) ? value.replace(/\./g,'') : value.replace(/,/g,'')
  const amount = Number(normal)
  return Number.isFinite(amount) && amount >= 0 && amount <= 1e12 ? amount : null
}
function parseDate(raw: string): Date | undefined | null {
  if (!raw) return undefined
  const dateOnly = raw.trim().split(' ')[0]
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateOnly)
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateOnly)
  if (!br && !iso) return null
  const y = Number(br ? br[3] : iso![1]); const m=Number(br ? br[2] : iso![2]); const d=Number(br ? br[1] : iso![3])
  const result = new Date(Date.UTC(y,m-1,d,12))
  return result.getUTCFullYear()===y && result.getUTCMonth()===m-1 && result.getUTCDate()===d ? result : null
}
function parseStatus(raw: string): ImportInput['status'] | undefined | null {
  if (!raw) return undefined
  const v=normalizeHeader(raw)
  const values: Record<string,ImportInput['status']> = {
    'novo':'NOVO','primeiro contato':'PRIMEIRO_CONTATO','aguardando resposta':'AGUARDANDO_RESPOSTA','orcamento enviado':'ORCAMENTO_ENVIADO','negociando':'NEGOCIANDO',
    'negociacao':'NEGOCIANDO','em negociacao':'NEGOCIANDO','fechado':'FECHADO','perdido':'PERDIDO',
  }
  return values[v] ?? null
}
export function parseLine(headers: string[], mapping: ImportMapping, values: unknown[], line: number): ParsedLine {
  const get=(field:ImportField, max=300) => {
    const index=headers.indexOf(mapping[field] ?? '')
    return index<0 ? '' : clean(values[index], max)
  }
  const phone=get('phone',80)
  const normalizedPhone=normalizePhone(phone)
  const originalName=get('name',160)
  const name=originalName || (normalizedPhone ? `Contato ${normalizedPhone.slice(-4)}` : '')
  const base={line,name,phone,normalizedPhone,status:get('status') || 'NOVO'}
  if (!normalizedPhone) return {...base,error:'Telefone inválido ou ausente'}
  const value=parseMoney(get('value',80))
  if (value===null) return {...base,error:'Valor inválido'}
  const date=parseDate(get('nextFollowup',80))
  if (date===null) return {...base,error:'Data de follow-up inválida'}
  const status=parseStatus(get('status',80))
  if (status===null) return {...base,error:'Status desconhecido'}
  const email=get('email',254)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return {...base,error:'E-mail inválido'}
  const input:ImportInput={line,name,nameProvided:!!originalName,phone,normalizedPhone,status:status??'NOVO',explicitStatus:status!==undefined,
    ...(get('company',200)?{company:get('company',200)}:{}),
    ...(get('service',200)?{service:get('service',200)}:{}),
    ...(value!==undefined?{value}:{}),
    ...(get('notes',4000)?{notes:get('notes',4000)}:{}),
    ...(date?{nextFollowup:date}:{}),
    ...(get('importOrigin',200)?{importOrigin:get('importOrigin',200)}:{}),
    ...(email?{email}:{}),
  }
  return {...base,status:input.status,input}
}
