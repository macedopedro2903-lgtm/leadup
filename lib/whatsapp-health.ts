import {prisma} from '@/lib/db'
import {decryptStoredToken,metaGraph,MetaAuthorizationError,publicMetaSettings} from '@/lib/whatsapp-meta'

/** Checks only the signed-in owner's connection; transient outages never revoke it. */
export async function checkConnection(userId:string) {
  const connection=await prisma.whatsAppConnection.findUnique({where:{userId}})
  if(!connection||connection.status==='REAUTH_REQUIRED')return
  const expired=connection.tokenExpiresAt&&connection.tokenExpiresAt<=new Date()
  const markInvalid=()=>prisma.whatsAppConnection.updateMany({where:{id:connection.id,userId,encryptedToken:connection.encryptedToken},data:{status:'REAUTH_REQUIRED',encryptedToken:'',lastCheckedAt:new Date(),lastError:'Autorização expirada ou revogada. Conecte novamente.'}})
  if(expired){await markInvalid();return}
  if(!publicMetaSettings().ready||(connection.lastCheckedAt&&Date.now()-connection.lastCheckedAt.getTime()<300000))return
  try {
    await metaGraph(`/${connection.phoneNumberId}?fields=id`,decryptStoredToken(connection.encryptedToken))
    await prisma.whatsAppConnection.updateMany({where:{id:connection.id,userId,encryptedToken:connection.encryptedToken},data:{lastCheckedAt:new Date()}})
  }catch(error){
    if(error instanceof MetaAuthorizationError)await markInvalid()
    else await prisma.whatsAppConnection.updateMany({where:{id:connection.id,userId,encryptedToken:connection.encryptedToken},data:{lastCheckedAt:new Date()}})
  }
}
