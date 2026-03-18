'use client'

import { useState } from 'react'
import {
  UserPlus, Trash2, RefreshCw, Check, Crown,
  Shield, User, Mail, Clock, ChevronDown, X,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import TimeAgo from '@/components/ui/TimeAgo'
import type { WorkspaceMember } from '@/lib/workspace'

interface Invite {
  id:         string
  email:      string
  role:       string
  accepted:   boolean
  expires_at: string
  created_at: string
}

interface TeamManagerProps {
  members:     WorkspaceMember[]
  invites:     Invite[]
  currentRole: string
  currentUserId: string
  workspaceName: string
}

const ROLE_CONFIG = {
  owner: { label: 'Owner',  icon: Crown,  color: 'text-amber-600 bg-amber-50 border-amber-200' },
  admin: { label: 'Admin',  icon: Shield, color: 'text-blue-600  bg-blue-50  border-blue-200'  },
  agent: { label: 'Agent',  icon: User,   color: 'text-gray-600  bg-gray-50   border-gray-200'  },
}

export default function TeamManager({
  members:      initialMembers,
  invites:      initialInvites,
  currentRole,
  currentUserId,
  workspaceName,
}: TeamManagerProps) {
  const [members,     setMembers]     = useState<WorkspaceMember[]>(initialMembers)
  const [invites,     setInvites]     = useState<Invite[]>(initialInvites)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState<'admin' | 'agent'>('agent')
  const [sending,     setSending]     = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSent,  setInviteSent]  = useState(false)
  const [removing,    setRemoving]    = useState<string | null>(null)
  const [revoking,    setRevoking]    = useState<string | null>(null)

  const canManage = currentRole === 'owner' || currentRole === 'admin'

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setSending(true)
    setInviteError(null)

    try {
      const res  = await fetch('/api/team/invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send invite')

      setInviteSent(true)
      setInviteEmail('')
      setTimeout(() => setInviteSent(false), 3000)

      // Refresh invites list
      const invRes  = await fetch('/api/team/invite')
      const invData = await invRes.json()
      setInvites(invData)
    } catch (err: any) {
      setInviteError(err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Remove this member from the workspace?')) return
    setRemoving(memberId)
    try {
      await fetch(`/api/team/members?id=${memberId}`, { method: 'DELETE' })
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } finally {
      setRemoving(null)
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    setRevoking(inviteId)
    try {
      await fetch(`/api/team/invite?id=${inviteId}`, { method: 'DELETE' })
      setInvites(prev => prev.filter(i => i.id !== inviteId))
    } finally {
      setRevoking(null)
    }
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    await fetch('/api/team/members', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ member_id: memberId, role: newRole }),
    })
    setMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, role: newRole as any } : m
    ))
  }

  const pendingInvites = invites.filter(i => !i.accepted && new Date(i.expires_at) > new Date())

  return (
    <div className="space-y-5">

      {/* Invite form */}
      {canManage && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Invite a team member</h2>
          <p className="text-xs text-gray-400 mb-4">
            They'll receive an email with a link to join <span className="font-medium text-gray-600">{workspaceName}</span>.
          </p>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); setInviteError(null) }}
              className="form-input flex-1 min-w-[200px]"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as any)}
              className="form-input !w-auto"
            >
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={sending} className="btn-primary !py-2 shrink-0">
              {sending ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending…</>
              ) : inviteSent ? (
                <><Check className="w-3.5 h-3.5" /> Sent!</>
              ) : (
                <><UserPlus className="w-3.5 h-3.5" /> Send invite</>
              )}
            </button>
          </form>
          {inviteError && (
            <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {inviteError}
            </p>
          )}

          {/* Role descriptions */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { role: 'Agent',  desc: 'Analyze tickets, view insights, use saved replies' },
              { role: 'Admin',  desc: 'All agent permissions + invite members, manage settings' },
            ].map(r => (
              <div key={r.role} className="bg-gray-50 rounded-xl px-3 py-2.5 text-xs">
                <span className="font-semibold text-gray-700">{r.role}</span>
                <span className="text-gray-400 ml-1">— {r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current members */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Team members <span className="text-gray-400 font-normal">({members.length})</span>
        </h2>
        <div className="space-y-1">
          {members.map(member => {
            const roleConf  = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.agent
            const RoleIcon  = roleConf.icon
            const isCurrentUser = member.user_id === currentUserId
            const canRemove     = canManage && member.role !== 'owner' && !isCurrentUser

            return (
              <div key={member.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold shrink-0">
                  {((member.users?.full_name ?? member.users?.email ?? 'U')[0]).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.users?.full_name ?? member.users?.email}
                      {isCurrentUser && <span className="text-gray-400 font-normal ml-1">(you)</span>}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{member.users?.email}</p>
                </div>

                {/* Role badge / selector */}
                {canManage && member.role !== 'owner' && !isCurrentUser ? (
                  <div className="relative">
                    <select
                      value={member.role}
                      onChange={e => handleChangeRole(member.id, e.target.value)}
                      className={cn(
                        'text-xs font-medium px-2.5 py-1 rounded-full border appearance-none cursor-pointer pr-6',
                        roleConf.color
                      )}
                    >
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                  </div>
                ) : (
                  <span className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border',
                    roleConf.color
                  )}>
                    <RoleIcon className="w-3 h-3" />
                    {roleConf.label}
                  </span>
                )}

                {/* Last seen */}
                <span className="text-xs text-gray-400 hidden sm:block shrink-0">
                  {member.last_seen_at
                    ? <TimeAgo date={member.last_seen_at} />
                    : 'Never'}
                </span>

                {/* Remove button */}
                {canRemove && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={removing === member.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    title="Remove member"
                  >
                    {removing === member.id
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Pending invites <span className="text-gray-400 font-normal">({pendingInvites.length})</span>
          </h2>
          <div className="space-y-1">
            {pendingInvites.map(invite => (
              <div key={invite.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{invite.email}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-400">
                      Expires <TimeAgo date={invite.expires_at} />
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                  {invite.role}
                </span>
                {canManage && (
                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    disabled={revoking === invite.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    title="Revoke invite"
                  >
                    {revoking === invite.id
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <X className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}