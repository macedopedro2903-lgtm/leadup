import { z } from 'zod'
import { LEAD_STATUS_ORDER } from '@/lib/format'

export const dateInput = z.string().refine(v => !Number.isNaN(new Date(v).getTime()), 'Data inválida.')
export const moneyInput = z.union([z.number(), z.string(), z.null()]).transform((value, ctx) => {
  if (value == null || value === '') return null
  const text = typeof value === 'string' ? value.trim().replace(/\s|R\$/g, '') : value
  const number = typeof text === 'number' ? text : Number(text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text)
  if (!Number.isFinite(number) || number < 0 || number > 9999999999.99) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe um valor válido e não negativo.' })
    return z.NEVER
  }
  return Math.round(number * 100) / 100
})

export const leadSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(160),
  phone: z.string().trim().max(40).nullish(),
  service: z.string().trim().max(500).nullish(),
  value: moneyInput.optional(),
  status: z.enum(LEAD_STATUS_ORDER).optional(),
  notes: z.string().trim().max(20000).nullish(),
  nextFollowup: dateInput.nullish(),
  followupEnabled: z.boolean().optional(),
  followupAfterDays: z.number().int().min(1).max(365).optional(),
})
