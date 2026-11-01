import {requireUser} from '@/lib/session'
import {prisma} from '@/lib/db'
import {QuotesClient} from '@/components/app/quotes-client'

export const dynamic='force-dynamic'
export default async function QuotesPage() {
  const user=await requireUser()
  const [leads,quotes]=await Promise.all([
    prisma.lead.findMany({where:{userId:user.id},select:{id:true,name:true},orderBy:{name:'asc'}}),
    prisma.quote.findMany({where:{userId:user.id},include:{lead:{select:{name:true}}},orderBy:{createdAt:'desc'}}),
  ])
  return <QuotesClient key={quotes.map(q=>`${q.id}:${q.version}`).join('|')} leads={leads} quotes={quotes.map(q=>({...q,amount:q.amount.toString(),validUntil:q.validUntil?.toISOString()??null,createdAt:q.createdAt.toISOString(),updatedAt:q.updatedAt.toISOString()}))}/>
}
