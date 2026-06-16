import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Flame, Check, Trash2, X, Loader2, TrendingUp, Target } from 'lucide-react'
import { habitsApi } from '../services/api.js'
import toast from 'react-hot-toast'
import { format, subDays, eachDayOfInterval } from 'date-fns'

const PRESETS = [
  { name: 'Exercise',    icon: '🏃', color: '#10b981' },
  { name: 'Read Book',   icon: '📚', color: '#3b82f6' },
  { name: 'DSA Practice',icon: '💻', color: '#6366f1' },
  { name: 'Drink Water', icon: '💧', color: '#0ea5e9' },
  { name: 'Meditate',    icon: '🧘', color: '#8b5cf6' },
  { name: 'Sleep Early', icon: '😴', color: '#f59e0b' },
]
const ICONS   = ['⚡','🏃','📚','💻','💧','🧘','😴','🎯','✍️','🎵','🌿','❤️','🔥','⭐','🚀','🏋️','🎨','🧠']
const PALETTE = ['#6366f1','#8b5cf6','#10b981','#3b82f6','#f59e0b','#ef4444','#ec4899','#0ea5e9','#14b8a6','#84cc16']

// ─── Heatmap ───────────────────────────────────────────────────────────────
function Heatmap({ habitId }) {
  const { data = [] } = useQuery({
    queryKey: ['habit-heatmap', habitId],
    queryFn: async () => {
      const r = await habitsApi.getHeatmap(habitId)
      return r.data.data
    },
  })

  const today = new Date()
  const days = eachDayOfInterval({ start: subDays(today, 111), end: today })
  const done = new Set(data.filter(d => d.completed).map(d => d.date))

  const weeks = []
  let week = []
  days.forEach((d, i) => {
    week.push(d)
    if (week.length === 7 || i === days.length - 1) { weeks.push(week); week = [] }
  })

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {w.map((day) => {
              const ds = format(day, 'yyyy-MM-dd')
              const isDone = done.has(ds)
              return (
                <div
                  key={ds}
                  title={`${format(day, 'MMM d')} – ${isDone ? '✅ Done' : '⬜ Not done'}`}
                  className="heatmap-cell"
                  style={{ background: isDone ? '#10b981' : '#374151', opacity: isDone ? 1 : 0.3 }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Habit Card ────────────────────────────────────────────────────────────
function HabitCard({ habit, onToggle, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: habit.color + '20', border: `1.5px solid ${habit.color}40` }}
        >
          {habit.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-foreground ${habit.completedToday ? 'line-through text-muted-foreground' : ''}`}>
              {habit.name}
            </p>
            {habit.completedToday && <span className="badge badge-success text-xs">Done ✓</span>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              {habit.currentStreak} day streak
            </span>
            <span>Best: {habit.longestStreak}d</span>
            <span>{Math.round(habit.completionRate)}% rate</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            title="View activity"
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              expanded ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(habit.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggle(habit.id)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 font-bold ${
              habit.completedToday
                ? 'bg-green-400 text-white shadow-lg shadow-green-400/30 scale-105'
                : 'border-2 border-border hover:border-primary text-muted-foreground hover:text-primary hover:scale-105'
            }`}
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Weekly Progress</span>
          <span className="font-medium">{Math.min(habit.currentStreak, 7)}/7 days</span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            style={{ background: habit.color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((habit.currentStreak / 7) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Heatmap */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border overflow-hidden"
          >
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Activity – Last 4 Months
            </p>
            <Heatmap habitId={habit.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Add Habit Modal ───────────────────────────────────────────────────────
function AddHabitModal({ open, onClose }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('⚡')
  const [color, setColor] = useState('#6366f1')
  const [frequency, setFrequency] = useState('DAILY')
  const [target, setTarget] = useState(7)

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => habitsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Habit created! 🎯')
      setName(''); setIcon('⚡'); setColor('#6366f1')
      onClose()
    },
    onError: () => toast.error('Failed to create habit'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    mutate({ name, icon, color, frequency, targetDaysPerWeek: target })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="modal-content w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Create New Habit</h3>
              <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            {/* Presets */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Start</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => { setName(p.name); setIcon(p.icon); setColor(p.color) }}
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                      name === p.name ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50 text-foreground'
                    }`}
                  >
                    <span className="text-lg">{p.icon}</span> {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Habit Name *</label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Morning Run"
                  className="input-base" required autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Icon</label>
                  <div className="grid grid-cols-6 gap-1">
                    {ICONS.map(ic => (
                      <button
                        key={ic} type="button" onClick={() => setIcon(ic)}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                          icon === ic ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'hover:bg-secondary'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Color</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PALETTE.map(c => (
                      <button
                        key={c} type="button" onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          color === c ? 'ring-2 ring-white scale-110 shadow-lg' : 'hover:scale-105'
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Frequency</label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="input-base">
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Target (days/week)</label>
                  <input type="number" min={1} max={7} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="input-base" />
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-secondary/50 flex items-center gap-3 border border-border">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: color + '33' }}>
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name || 'Your Habit Name'}</p>
                  <p className="text-xs text-muted-foreground">{frequency} · {target}× per week</p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button type="submit" disabled={isPending || !name.trim()} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Habit
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function HabitsPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const r = await habitsApi.getAll()
      return r.data.data
    },
  })

  const completedToday = habits.filter(h => h.completedToday).length
  const maxStreak = habits.reduce((m, h) => Math.max(m, h.currentStreak), 0)
  const avgRate = habits.length > 0
    ? Math.round(habits.reduce((s, h) => s + h.completionRate, 0) / habits.length)
    : 0

  const toggleMut = useMutation({
    mutationFn: (id) => habitsApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast.error('Failed to update habit'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => habitsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Habit removed')
    },
  })

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Habit Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">Build consistent habits and track your streaks</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Habits',  value: habits.length,                    icon: '🎯', color: 'text-primary' },
          { label: 'Done Today',    value: `${completedToday}/${habits.length}`, icon: '✅', color: 'text-green-400' },
          { label: 'Best Streak',   value: `${maxStreak} days`,              icon: '🔥', color: 'text-orange-400' },
          { label: 'Avg. Rate',     value: `${avgRate}%`,                    icon: '📈', color: 'text-blue-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Habits */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 h-28 animate-pulse shimmer" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-xl font-bold text-foreground mb-2">No habits yet</h2>
          <p className="text-muted-foreground mb-6 max-w-xs mx-auto">Start building positive habits that stick. Small daily actions compound into big results.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create Your First Habit</button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {habits.map(h => (
              <HabitCard
                key={h.id}
                habit={h}
                onToggle={() => toggleMut.mutate(h.id)}
                onDelete={() => deleteMut.mutate(h.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddHabitModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
