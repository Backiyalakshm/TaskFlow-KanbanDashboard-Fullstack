import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  CheckCircle2, Clock, Flame, BookOpen, Timer,
  Target, ArrowRight, Calendar, Zap, Activity, TrendingUp
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { dashboardApi, habitsApi } from '../services/api.js'
import { useAuthStore } from '../store/authStore.js'

const CHART_DATA = [
  { day: 'Mon', tasks: 4, pomodoro: 3, habits: 5 },
  { day: 'Tue', tasks: 7, pomodoro: 5, habits: 6 },
  { day: 'Wed', tasks: 5, pomodoro: 4, habits: 4 },
  { day: 'Thu', tasks: 9, pomodoro: 7, habits: 7 },
  { day: 'Fri', tasks: 6, pomodoro: 5, habits: 5 },
  { day: 'Sat', tasks: 3, pomodoro: 2, habits: 4 },
  { day: 'Sun', tasks: 8, pomodoro: 6, habits: 7 },
]

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'hsl(222 47% 12%)',
    border: '1px solid hsl(217 33% 20%)',
    borderRadius: '0.5rem',
    fontSize: '12px',
  },
  labelStyle: { color: 'hsl(210 40% 98%)' },
  itemStyle: { color: 'hsl(215 20% 60%)' },
}

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="stat-card"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="stat-card animate-pulse">
      <div className="w-10 h-10 bg-secondary rounded-xl shimmer" />
      <div className="space-y-2">
        <div className="h-6 w-14 bg-secondary rounded shimmer" />
        <div className="h-3 w-20 bg-secondary rounded shimmer" />
        <div className="h-3 w-16 bg-secondary rounded shimmer" />
      </div>
    </div>
  )
}

function PriorityBadge({ p }) {
  const map = {
    URGENT: 'priority-urgent',
    HIGH: 'priority-high',
    MEDIUM: 'priority-medium',
    LOW: 'priority-low',
  }
  return (
    <span className={`badge text-[10px] font-semibold px-2 py-0.5 ${map[p] || 'badge-primary'}`}>
      {p}
    </span>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const r = await dashboardApi.get()
      return r.data.data
    },
  })

  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const r = await habitsApi.getAll()
      return r.data.data
    },
  })

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const name = user?.firstName || user?.username || 'there'

  const STATS = [
    { icon: CheckCircle2, label: 'Completed Today', value: dash?.tasksCompletedToday ?? 0, sub: 'tasks done', iconBg: 'bg-green-400/10', iconColor: 'text-green-400', delay: 0 },
    { icon: Clock,       label: 'Pending Tasks',   value: dash?.pendingTasks ?? 0,          sub: 'need attention', iconBg: 'bg-yellow-400/10', iconColor: 'text-yellow-400', delay: 0.05 },
    { icon: Calendar,    label: 'Due Today',        value: dash?.tasksDueToday ?? 0,         sub: 'tasks due', iconBg: 'bg-red-400/10', iconColor: 'text-red-400', delay: 0.1 },
    { icon: Timer,       label: 'Focus Sessions',   value: dash?.pomodoroSessionsToday ?? 0, sub: `${dash?.focusMinutesToday ?? 0} min focus`, iconBg: 'bg-purple-400/10', iconColor: 'text-purple-400', delay: 0.15 },
    { icon: Flame,       label: 'Habit Streak',     value: `${dash?.habitStreakMax ?? 0}🔥`,  sub: `${dash?.habitsCompletedToday ?? 0}/${dash?.totalHabits ?? 0} today`, iconBg: 'bg-orange-400/10', iconColor: 'text-orange-400', delay: 0.2 },
    { icon: BookOpen,    label: 'Study Hours',      value: `${(dash?.studyHoursThisWeek ?? 0).toFixed(1)}h`, sub: 'this week', iconBg: 'bg-blue-400/10', iconColor: 'text-blue-400', delay: 0.25 },
  ]

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greet()}, <span className="gradient-text">{name}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · Here&apos;s your productivity overview
          </p>
        </div>
        <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Score: <span className="text-primary">{Math.round(dash?.productivityScore ?? 0)}%</span>
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoading
          ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : STATS.map((s) => <StatCard key={s.label} {...s} />)
        }
      </div>

      {/* Charts + Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title mb-0">Weekly Activity</h2>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="gTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPomo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'hsl(215 20% 60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 20% 60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="tasks"    name="Tasks"    stroke="#6366f1" strokeWidth={2} fill="url(#gTasks)" />
              <Area type="monotone" dataKey="pomodoro" name="Pomodoro" stroke="#8b5cf6" strokeWidth={2} fill="url(#gPomo)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Today's habits */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Today&apos;s Habits</h2>
            <Link to="/habits" className="text-xs text-primary hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {!dash?.todayHabits?.length && (
              <div className="text-center py-6">
                <Target className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No habits yet</p>
                <Link to="/habits" className="text-xs text-primary hover:underline">
                  Add your first habit →
                </Link>
              </div>
            )}
            {dash?.todayHabits?.slice(0, 6).map((h) => (
              <div key={h.id} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: h.color + '22' }}
                >
                  {h.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${h.completedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {h.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{h.currentStreak} day streak 🔥</p>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                  h.completedToday ? 'bg-green-400 border-green-400' : 'border-border'
                }`}>
                  {h.completedToday && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Due Today */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Due Today</h2>
          <Link to="/kanban" className="text-xs text-primary hover:underline flex items-center gap-1">
            Open Kanban <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {!dash?.dueTodayTasks?.length ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-foreground font-semibold">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No tasks due today 🎉</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dash.dueTodayTasks.map((task) => (
              <div key={task.id} className="task-card cursor-default">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">{task.title}</p>
                  <PriorityBadge p={task.priority} />
                </div>
                {task.aiPriority && (
                  <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" /> {task.aiPriority}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{task.dueDate ? format(new Date(task.dueDate), 'h:mm a') : 'No time set'}</span>
                  {task.estimatedHours > 0 && (
                    <span className="ml-auto text-xs">{task.estimatedHours}h est.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { to: '/kanban',   emoji: '🗂️', label: 'Open Kanban',    desc: 'Manage tasks' },
          { to: '/pomodoro', emoji: '🍅', label: 'Start Pomodoro', desc: 'Focus session' },
          { to: '/study',    emoji: '📚', label: 'Log Study',      desc: 'Track learning' },
          { to: '/analytics',emoji: '📊', label: 'Analytics',      desc: 'View insights' },
        ].map(({ to, emoji, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="glass-card-hover p-5 flex flex-col gap-2 group"
          >
            <span className="text-2xl">{emoji}</span>
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
