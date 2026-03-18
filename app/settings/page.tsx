import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import SettingsClient from '@/components/SettingsClient'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, integrationsRes] = await Promise.all([
    supabase
      .from('users')
      .select('plan, full_name, notify_urgent, notify_digest, auto_reply_enabled, auto_reply_threshold')
      .eq('id', user.id)
      .single(),
    supabase
      .from('integrations')
      .select('platform')
      .eq('user_id', user.id)
      .eq('status', 'connected'),
  ])

  const profile  = profileRes.data
  const platforms = (integrationsRes.data ?? []).map((i: any) => i.platform)

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and AI preferences.</p>
      </div>
      <SettingsClient
        user={{
          email:                user.email ?? '',
          full_name:            profile?.full_name ?? user.user_metadata?.full_name ?? '',
          plan:                 profile?.plan ?? 'starter',
          notify_urgent:        profile?.notify_urgent        ?? true,
          notify_digest:        profile?.notify_digest        ?? true,
          auto_reply_enabled:   profile?.auto_reply_enabled   ?? false,
          auto_reply_threshold: profile?.auto_reply_threshold ?? 0,
          connected_platforms:  platforms,
        }}
      />
    </AppShell>
  )
}