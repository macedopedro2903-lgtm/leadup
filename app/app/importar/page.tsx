import { requireUser } from '@/lib/session'
import { ImportClient } from '@/components/app/import-client'
export const dynamic='force-dynamic'
export default async function ImportPage() {
  await requireUser()
  return <ImportClient />
}
