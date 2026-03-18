import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import SavedRepliesList from '@/components/SavedRepliesList'

export default async function SavedRepliesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: saved } = await supabase
    .from('saved_responses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <AppShell user={{ email: user.email, full_name: user.user_metadata?.full_name }}>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Saved Replies</h1>
        <p className="text-sm text-gray-500 mt-1">Your library of AI-generated replies approved for reuse.</p>
      </div>
      <SavedRepliesList initialReplies={saved ?? []} />
    </AppShell>
  )
}
