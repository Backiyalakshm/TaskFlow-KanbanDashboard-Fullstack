import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Palette, Bell, Shield, LogOut, Sun, Moon, Check, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore.js'
import { useUIStore } from '../store/uiStore.js'

function Section({ icon: Icon, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </motion.div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-primary' : 'bg-secondary border border-border'
      }`}
    >
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    bio:       user?.bio       || '',
    timezone:  user?.timezone  || 'UTC',
  })

  const [notifs, setNotifs] = useState({
    email:          true,
    push:           true,
    taskReminders:  true,
    habitReminders: true,
    weeklyReport:   false,
  })

  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' })
  const [pwdError, setPwdError] = useState('')

  const handleSaveProfile = () => {
    toast.success('Profile updated! ✨')
  }

  const handleSavePwd = () => {
    setPwdError('')
    if (!pwd.current)                        { setPwdError('Current password is required'); return }
    if (pwd.newPwd.length < 8)               { setPwdError('New password must be 8+ characters'); return }
    if (pwd.newPwd !== pwd.confirm)          { setPwdError('Passwords do not match'); return }
    toast.success('Password updated!')
    setPwd({ current:'', newPwd:'', confirm:'' })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Signed out')
  }

  const initial = (user?.firstName || user?.username || 'U')[0].toUpperCase()
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.username

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Section icon={User} title="Profile">
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {initial}
          </div>
          <div>
            <p className="font-bold text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {user?.roles?.map(r => (
                <span key={r} className="badge badge-primary text-[10px] font-semibold">
                  {r.replace('ROLE_', '')}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">First Name</label>
            <input
              value={profile.firstName}
              onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
              className="input-base text-sm"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Last Name</label>
            <input
              value={profile.lastName}
              onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
              className="input-base text-sm"
              placeholder="Doe"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Bio</label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              rows={2}
              className="textarea-base text-sm"
              placeholder="Tell us about yourself…"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Timezone</label>
            <select
              value={profile.timezone}
              onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
              className="input-base text-sm"
            >
              {['UTC','America/New_York','America/Los_Angeles','Europe/London','Asia/Kolkata','Asia/Tokyo','Australia/Sydney'].map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={handleSaveProfile} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Profile
        </button>
      </Section>

      {/* Appearance */}
      <Section icon={Palette} title="Appearance">
        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/40 border border-border">
          <div>
            <p className="text-sm font-semibold text-foreground">Interface Theme</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Currently: <span className="text-primary font-semibold capitalize">{theme}</span>
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 glass px-4 py-2.5 rounded-xl hover:border-primary/40 transition-all font-semibold text-sm"
          >
            {theme === 'dark'
              ? <><Sun className="w-4 h-4 text-yellow-400" /> Light Mode</>
              : <><Moon className="w-4 h-4 text-primary" /> Dark Mode</>
            }
          </button>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <div className="space-y-4">
          {[
            { key:'email',          label:'Email notifications',   desc:'Receive task updates by email' },
            { key:'push',           label:'Push notifications',    desc:'Browser desktop notifications' },
            { key:'taskReminders',  label:'Task reminders',        desc:'Alerts before task due dates' },
            { key:'habitReminders', label:'Habit reminders',       desc:'Daily habit completion nudges' },
            { key:'weeklyReport',   label:'Weekly report',         desc:'Summary every Monday morning' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Toggle
                checked={notifs[key]}
                onChange={(v) => setNotifs(n => ({ ...n, [key]: v }))}
              />
            </div>
          ))}
        </div>
        <button onClick={() => toast.success('Notification preferences saved!')} className="btn-primary mt-4 flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Preferences
        </button>
      </Section>

      {/* Security */}
      <Section icon={Shield} title="Security">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Current Password</label>
            <input
              type="password"
              value={pwd.current}
              onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
              placeholder="••••••••"
              className="input-base text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                value={pwd.newPwd}
                onChange={e => setPwd(p => ({ ...p, newPwd: e.target.value }))}
                placeholder="••••••••"
                className="input-base text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                value={pwd.confirm}
                onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
                placeholder="••••••••"
                className="input-base text-sm"
              />
            </div>
          </div>
          {pwdError && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {pwdError}
            </p>
          )}
          <button onClick={handleSavePwd} className="btn-primary flex items-center gap-2">
            <Shield className="w-4 h-4" /> Update Password
          </button>
        </div>
      </Section>

      {/* Danger zone */}
      <div className="glass-card p-6 border-2 border-destructive/20">
        <h2 className="text-sm font-bold text-destructive mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Danger Zone
        </h2>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Sign out of TaskFlow AI</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You will need to sign in again to access your account
            </p>
          </div>
          <button onClick={handleLogout} className="btn-danger flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
