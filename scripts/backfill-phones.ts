/** Run after prisma db push; review any conflicts manually before launch. */
import { PrismaClient } from '@prisma/client'
import { normalizePhone } from '../lib/whatsapp'
const prisma = new PrismaClient()
async function run() {
  // Never write to production simply because this diagnostic script was invoked.
  const apply = process.argv.includes('--apply')
  if (apply && !process.argv.includes('--backup-confirmed')) {
    throw new Error('Apply requires --backup-confirmed; validate a test database first.')
  }
  const leads=await prisma.lead.findMany({select:{id:true,userId:true,phone:true,normalizedPhone:true}})
  const grouped=new Map<string,typeof leads>()
  for(const lead of leads) {
    const normalizedPhone=normalizePhone(lead.phone)
    if(!normalizedPhone) continue
    const key=lead.userId+':'+normalizedPhone
    grouped.set(key,[...(grouped.get(key)??[]),lead])
  }
  let updated=0,conflicts=0,review=0
  for(const group of grouped.values()) {
    if(group.length!==1) {conflicts+=group.length;continue}
    const lead=group[0],normalizedPhone=normalizePhone(lead.phone)
    if(lead.normalizedPhone && lead.normalizedPhone!==normalizedPhone) {
      review++ // Do not overwrite a normalized phone that disagrees with the original.
      continue
    }
    if(lead.normalizedPhone!==normalizedPhone) {
      if(apply) await prisma.lead.update({where:{id:lead.id},data:{normalizedPhone}})
      updated++
    }
  }
  console.log(`${apply?'Applied':'Dry run only'}: ${updated} candidates; ${conflicts} entries with duplicate phones; ${review} records with conflicting existing keys.`)
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect())
