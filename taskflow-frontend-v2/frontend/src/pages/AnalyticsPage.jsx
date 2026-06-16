import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts'
import { dashboardApi, studyApi, habitsApi, pomodoroApi } from '../services/api.js'
import { TrendingUp, Target, Zap, BookOpen, Timer, Flame, Award, Activity } from 'lucide-react'

const COLORS = ['#6366f1','#8b5cf6','#10b981','#3b82f6','#f59e0b','#ef4444','#ec4899','#0ea5e9']

const TIP = {
  contentStyle: { background:'hsl(222 47% 12%)', border:'1px solid hsl(217 33% 20%)', borderRadius:'0.5rem', fontSize:'12px' },
  labelStyle: { color:'hsl(210 40% 98%)' },
  itemStyle: { color:'hsl(215 20% 60%)' },
}

const WEEKLY = [
  { day:'Mon', tasks:4,  pomodoro:3,  habits:5,  study:2.0 },
  { day:'Tue', tasks:7,  pomodoro:5,  habits:6,  study:3.5 },
  { day:'Wed', tasks:5,  pomodoro:4,  habits:4,  study:1.5 },
  { day:'Thu', tasks:9,  pomodoro:7,  habits:7,  study:4.0 },
  { day:'Fri', tasks:6,  pomodoro:5,  habits:5,  study:2.5 },
  { day:'Sat', tasks:3,  pomodoro:2,  habits:4,  study:3.0 },
  { day:'Sun', tasks:8,  pomodoro:6,  habits:7,  study:2.0 },
]

function MetricCard({ icon: Icon, label, value, sub, color, bg, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay, duration:0.3 }}
      className="glass-card p-5"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </motion.div>
  )
}

export default function AnalyticsPage() {
  const { data: dash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const r = await dashboardApi.get(); return r.data.data },
  })
  const { data: studyStats = [] } = useQuery({
    queryKey: ['study-stats'],
    queryFn: async () => { const r = await studyApi.getStats(); return r.data.data },
  })
  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => { const r = await habitsApi.getAll(); return r.data.data },
  })
  const { data: pomodoros = [] } = useQuery({
    queryKey: ['pomodoro-sessions'],
    queryFn: async () => { const r = await pomodoroApi.getSessions(); return r.data.data },
  })

  const habitChartData = habits.map(h => ({
    name: h.name.length > 10 ? h.name.slice(0,10)+'…' : h.name,
    streak: h.currentStreak,
    rate: Math.round(h.completionRate),
  }))

  const radarData = [
    { metric:'Tasks',    value: Math.min(100, (dash?.tasksCompletedToday ?? 0) * 20) },
    { metric:'Focus',    value: Math.min(100, ((dash?.focusMinutesToday ?? 0)/240)*100) },
    { metric:'Habits',   value: Math.min(100, ((dash?.habitsCompletedToday ?? 0)/(dash?.totalHabits ?? 1))*100) },
    { metric:'Study',    value: Math.min(100, ((dash?.studyHoursThisWeek ?? 0)/20)*100) },
    { metric:'Pomodoro', value: Math.min(100, ((dash?.pomodoroSessionsToday ?? 0)/8)*100) },
  ]

  // Pomodoro by mode
  const modeCount = pomodoros.reduce((acc, s) => {
    if (s.status === 'COMPLETED') acc[s.mode] = (acc[s.mode] || 0) + 1
    return acc
  }, {})
  const modeData = Object.entries(modeCount).map(([mode, count]) => ({ mode, count }))

  const METRICS = [
    { icon:TrendingUp, label:'Tasks Completed',  value: dash?.tasksCompletedToday ?? 0,              sub:'Today',            color:'text-primary',      bg:'bg-primary/10',      delay:0 },
    { icon:Timer,      label:'Focus Minutes',     value: dash?.focusMinutesToday ?? 0,                sub:'Today',            color:'text-purple-400',   bg:'bg-purple-400/10',   delay:0.05 },
    { icon:Flame,      label:'Best Streak',       value: `${dash?.habitStreakMax ?? 0}d`,             sub:'Max habit streak', color:'text-orange-400',   bg:'bg-orange-400/10',   delay:0.1 },
    { icon:Target,     label:'Habits Done',       value: `${dash?.habitsCompletedToday ?? 0}/${dash?.totalHabits ?? 0}`, sub:'Today', color:'text-green-400', bg:'bg-green-400/10', delay:0.15 },
    { icon:BookOpen,   label:'Study Hours',       value: `${(dash?.studyHoursThisWeek ?? 0).toFixed(1)}h`, sub:'This week', color:'text-blue-400', bg:'bg-blue-400/10', delay:0.2 },
    { icon:Activity,   label:'Productivity',      value: `${Math.round(dash?.productivityScore ?? 0)}%`, sub:'Overall score', color:'text-yellow-400', bg:'bg-yellow-400/10', delay:0.25 },
  ]

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your complete productivity insights</p>
        </div>
        <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Score: <span className="text-primary font-bold">{Math.round(dash?.productivityScore ?? 0)}%</span>
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {METRICS.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* Row 1: Weekly Bar + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="section-title">Weekly Activity Overview</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={WEEKLY} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TIP} />
              <Legend wrapperStyle={{ fontSize:'11px', paddingTop:'8px' }} />
              <Bar dataKey="tasks"    name="Tasks"    fill="#6366f1" radius={[3,3,0,0]} />
              <Bar dataKey="pomodoro" name="Pomodoro" fill="#8b5cf6" radius={[3,3,0,0]} />
              <Bar dataKey="habits"   name="Habits"   fill="#10b981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title">Today&apos;s Balance</h3>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} />
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Focus trend + Study breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="section-title">Focus &amp; Study Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={WEEKLY}>
              <defs>
                <linearGradient id="gFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gStudy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TIP} />
              <Legend wrapperStyle={{ fontSize:'11px', paddingTop:'8px' }} />
              <Area type="monotone" dataKey="pomodoro" name="Pomodoro" stroke="#6366f1" strokeWidth={2} fill="url(#gFocus)" />
              <Area type="monotone" dataKey="study"    name="Study (h)"  stroke="#10b981" strokeWidth={2} fill="url(#gStudy)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {studyStats.length > 0 ? (
          <div className="glass-card p-5">
            <h3 className="section-title">Study Hours by Subject</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={studyStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="subject" tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip {...TIP} />
                <Bar dataKey="hours" name="Hours" radius={[0,4,4,0]}>
                  {studyStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="glass-card p-5 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Log study sessions to see subject breakdown</p>
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Habit streaks + Pomodoro modes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {habitChartData.length > 0 ? (
          <div className="glass-card p-5">
            <h3 className="section-title">Habit Streaks &amp; Completion Rate</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={habitChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TIP} />
                <Legend wrapperStyle={{ fontSize:'11px', paddingTop:'8px' }} />
                <Bar dataKey="streak" name="Streak (days)" fill="#f59e0b" radius={[4,4,0,0]} />
                <Bar dataKey="rate"   name="Rate (%)"      fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="glass-card p-5 flex items-center justify-center">
            <div className="text-center">
              <Target className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Create habits to see streak analytics</p>
            </div>
          </div>
        )}

        {modeData.length > 0 ? (
          <div className="glass-card p-5">
            <h3 className="section-title">Pomodoro by Mode</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={modeData} dataKey="count" nameKey="mode" cx="50%" cy="50%" outerRadius={75} innerRadius={40}
                  label={({ mode, percent }) => `${mode} ${(percent*100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {modeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...TIP} />
                <Legend wrapperStyle={{ fontSize:'11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="glass-card p-5 flex items-center justify-center">
            <div className="text-center">
              <Timer className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Complete Pomodoro sessions to see mode breakdown</p>
            </div>
          </div>
        )}
      </div>

      {/* Productivity summary */}
      <div className="glass-card p-5">
        <h3 className="section-title">Weekly Tasks Completion Trend</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={WEEKLY}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} axisLine={false} tickLine={false} />
            <Tooltip {...TIP} />
            <Legend wrapperStyle={{ fontSize:'11px' }} />
            <Line type="monotone" dataKey="tasks" name="Tasks" stroke="#6366f1" strokeWidth={2.5} dot={{ fill:'#6366f1', r:4 }} activeDot={{ r:6 }} />
            <Line type="monotone" dataKey="habits" name="Habits" stroke="#10b981" strokeWidth={2.5} dot={{ fill:'#10b981', r:4 }} activeDot={{ r:6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
