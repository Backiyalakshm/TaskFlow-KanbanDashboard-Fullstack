import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../services/api.js'
import { useAuthStore } from '../store/authStore.js'

const FEATURES = [
  'AI Task Prioritization',
  'Drag & Drop Kanban',
  'Habit Streak Tracker',
  'Study Session Logger',
  'Pomodoro Timer',
  'Analytics Dashboard',
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ emailOrUsername: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.emailOrUsername.trim()) e.emailOrUsername = 'Email or username is required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (evt) => {
    evt.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await authApi.login(form)
      const { user, accessToken, refreshToken } = res.data.data
      setAuth(user, accessToken, refreshToken)
      toast.success(`Welcome back, ${user.firstName || user.username}! 👋`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid credentials. Please try again.'
      toast.error(msg)
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setForm({ emailOrUsername: 'demo@taskflow.ai', password: 'demo123456' })
    setErrors({})
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] gradient-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-black/25" />
        {/* Blobs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-white text-center"
        >
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3">TaskFlow AI</h1>
          <p className="text-white/80 text-lg mb-10">Your intelligent productivity companion</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {FEATURES.map((f) => (
              <div key={f} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-2 text-left">
                <CheckCircle className="w-4 h-4 text-green-300 shrink-0" />
                <span className="text-white/90">{f}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right – form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">TaskFlow AI</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to continue your productivity journey</p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email or Username
              </label>
              <input
                type="text"
                value={form.emailOrUsername}
                onChange={(e) => setForm({ ...form, emailOrUsername: e.target.value })}
                placeholder="you@example.com"
                className={`input-base ${errors.emailOrUsername ? 'border-destructive/60' : ''}`}
                autoComplete="username"
                autoFocus
              />
              {errors.emailOrUsername && (
                <p className="text-destructive text-xs mt-1">{errors.emailOrUsername}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className={`input-base pr-10 ${errors.password ? 'border-destructive/60' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Sign up free
              </Link>
            </p>
          </div>

          {/* Demo box */}
          <div className="mt-6 p-4 glass rounded-xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Demo Credentials
              </p>
              <button
                onClick={fillDemo}
                className="text-xs text-primary hover:underline font-medium"
              >
                Use Demo
              </button>
            </div>
            <div className="space-y-1 text-xs text-foreground">
              <p>Email: <span className="text-primary font-mono">demo@taskflow.ai</span></p>
              <p>Password: <span className="text-primary font-mono">demo123456</span></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
