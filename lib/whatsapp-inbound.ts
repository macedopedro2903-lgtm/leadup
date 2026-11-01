import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { normalizePhone } from '@/lib/whatsapp'
import { effectivePlan, planLimits, ACTIVE_LEAD_STATUSES } from '@/lib/plan'

/**
 * Only call after verifying Meta's webhook signature and resolving the receiving
 * phoneNumberId to a CONNECTED WhatsAppConnection. All writes are tenant-scoped.
 * Serializable transaction avoids overshooting a plan's active lead limit.
 */
export async function recordVerifiedInboundMessage(input: {
  userId: string
  phone: string
  providerMessageId: string
  body: string
  displayName?: string
}) {
  const normalizedPhone=normalizePhone(input.phone)
  if(!normalizedPhone) throw new Error('Invalid telephone')
  if(!input.providerMessageId || input.providerMessageId.length>200) throw new Error('Invalid message ID')
  if(!input.body || input.body.length>20000) throw new Error('Invalid message')
  for(let attempt=0;attempt<4;attempt++) {
    try {
      return await prisma.$transaction(async tx=>{
        const existingMessage=await tx.leadMessage.findUnique({
          where:{userId_providerMessageId:{userId:input.userId,providerMessageId:input.providerMessageId}},
        })
        if(existingMessage) return {leadId:existingMessage.leadId,duplicateMessage:true,createdLead:false}
        const user=await tx.user.findUnique({where:{id:input.userId}})
        if(!user) throw new Error('Unknown LeadUp account')
        let lead=await tx.lead.findUnique({where:{userId_normalizedPhone:{userId:input.userId,normalizedPhone}}})
        if(!lead) {
          // Historical duplicates are not merged or deleted without owner review.
          const legacy=await tx.lead.findMany({where:{userId:input.userId,normalizedPhone:null},select:{id:true,phone:true}})
          const matches=legacy.filter(l=>normalizePhone(l.phone)===normalizedPhone)
          if(matches.length>1) throw new Error('Duplicate legacy leads require manual review')
          if(matches.length===1) lead=await tx.lead.findUnique({where:{id:matches[0].id}})
        }
        let createdLead=false
        if(!lead) {
          if(effectivePlan(user)==='FREE') {
            const count=await tx.lead.count({where:{userId:input.userId,status:{in:[...ACTIVE_LEAD_STATUSES]}}})
            if(count>=planLimits('FREE').activeLeadsLimit) throw new Error('Lead limit reached')
          }
          lead=await tx.lead.create({data:{
            userId:input.userId,
            name:input.displayName?.trim().slice(0,160) || `Contato ${normalizedPhone.slice(-4)}`,
            phone:input.phone,
            normalizedPhone,
            source:'WHATSAPP',createdAutomatically:true,status:'NOVO',
          }})
          createdLead=true
        }
        if(!lead) throw new Error('Lead not found')
        const receivedAt=new Date()
        await tx.leadMessage.create({data:{
          userId:input.userId,leadId:lead.id,providerMessageId:input.providerMessageId,
          body:input.body,receivedAt,
        }})
        await tx.lead.update({where:{id:lead.id},data:{
          normalizedPhone,lastMessageAt:receivedAt,lastContactAt:receivedAt,
        }})
        return {leadId:lead.id,duplicateMessage:false,createdLead}
      },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable})
    } catch(error) {
      if(error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code==='P2034'||error.code==='P2002') && attempt<3) continue
      throw error
    }
  }
  throw new Error('Concurrency retry limit reached')
}
