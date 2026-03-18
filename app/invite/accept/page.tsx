import { Suspense } from 'react'
import { RefreshCw } from 'lucide-react'
import AcceptInviteClient from '@/app/api/invite/accept/AcceptInviteClient'
export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <AcceptInviteClient />
    </Suspense>
  )
}