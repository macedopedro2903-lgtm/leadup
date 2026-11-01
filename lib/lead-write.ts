import type { z } from 'zod'
import { normalizePhone } from '@/lib/whatsapp'
import { ACTIVE_LEAD_STATUSES, effectivePlan, planLimits } from '@/lib/plan'
import { BusinessError, serializable } from '@/lib/transactions'
import type { leadSchema } from '@/lib/lead-validation'

export async function saveLead(userId: string, data: Partial<z.infer<typeof leadSchema>>, id?: string) {
  return serializable(async tx => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new BusinessError('Não autorizado.', 401)
    const current = id ? await tx.lead.findFirst({ where: { id, userId } }) : null
    if (id && !current) throw new BusinessError('Lead não encontrado.', 404)
    const phone = data.phone === undefined ? current?.phone : data.phone
    const normalizedPhone = normalizePhone(phone)
    if (phone && !normalizedPhone) throw new BusinessError('Telefone inválido. Informe DDD e número brasileiro.')
    if (normalizedPhone) {
      const possible = await tx.lead.findMany({ where: { userId, ...(id ? {id:{not:id}} : {}), OR:[{normalizedPhone},{normalizedPhone:null}] }, select:{phone:true,normalizedPhone:true} })
      if (possible.some(l => (l.normalizedPhone || normalizePhone(l.phone)) === normalizedPhone)) throw new BusinessError('Já existe um lead com este telefone.', 409)
    }
    const status = data.status ?? current?.status ?? 'NOVO'
    const active = (s: string) => (ACTIVE_LEAD_STATUSES as readonly string[]).includes(s)
    if (active(status) && (!current || !active(current.status))) {
      const limit = planLimits(effectivePlan(user)).activeLeadsLimit
      if (limit !== Infinity && await tx.lead.count({where:{userId,status:{in:[...ACTIVE_LEAD_STATUSES]}}}) >= limit) throw new BusinessError(`Você atingiu o limite de ${limit} leads ativos do plano grátis.`, 403)
    }
    const fields = { ...data, ...(data.phone !== undefined || !id ? {phone:phone || null,normalizedPhone} : {}), ...(data.nextFollowup !== undefined ? {nextFollowup:data.nextFollowup ? new Date(data.nextFollowup) : null} : {}) }
    const lead = current ? await tx.lead.update({where:{id:current.id,userId},data:fields}) : await tx.lead.create({data:{...fields,userId,name:data.name!,status}})
    if (current && current.status !== status) await tx.leadActivity.create({data:{userId,leadId:lead.id,kind:'STATUS',summary:`${current.status} → ${status}`}})
    return lead
  })
}
