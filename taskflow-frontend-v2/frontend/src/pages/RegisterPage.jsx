import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../services/api.js'
import { useAuthStore } from '../store/authStore.js'

const PERKS = [
  { icon: '🤖', text: 'AI-powered task prioritization' },
  { icon: '🗂️', text: 'Visual drag-and-drop Kanban' },
  { icon: '✅', text: 'Habit tracking with streaks' },
  { icon: '📚', text: 'Study session tracker' },
  { icon: '🍅', text: 'Pomodoro focus timer' },
  { icon: '📊', text: 'Beautiful analytics dashboard' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.username.trim() || form.username.length < 3) e.username = 'Username must be at least 3 chars'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (evt) => {
    evt.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await authApi.register(form)
      const { user, accessToken, refreshToken } = res.data.data
      setAuth(user, accessToken, refreshToken)
      toast.success('Account created! Welcome to TaskFlow AI 🎉')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const field = (label, key, type = 'text', placeholder = '', extra = {}) => (
    <div {...extra}>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={set(key)}
        placeholder={placeholder}
        className={`input-base ${errors[key] ? 'border-destructive/60' : ''}`}
      />
      {errors[key] && <p className="text-destructive text-xs mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left */}
      <div className="hidden lg:flex lg:w-[45%] gradient-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-black/25" />
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
          <h1 className="text-4xl font-bold mb-3">Join TaskFlow AI</h1>
          <p className="text-white/80 text-lg mb-10">Start your productivity transformation</p>
          <div className="space-y-2.5 text-left">
            {PERKS.map((p) => (
              <div key={p.text} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-xl">{p.icon}</span>
                <span className="text-sm text-white/90">{p.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">TaskFlow AI</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Create account</h2>
            <p className="text-muted-foreground mt-2">Get started with your free account today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              {field('First Name', 'firstName', 'text', 'John')}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Last Name</label>
                <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Doe" className="input-base" />
              </div>
            </div>

            {field('Username', 'username', 'text', 'johndoe')}
            {field('Email', 'email', 'email', 'you@example.com')}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 8 characters"
                  className={`input-base pr-10 ${errors.password ? 'border-destructive/60' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-muted-foreground text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
