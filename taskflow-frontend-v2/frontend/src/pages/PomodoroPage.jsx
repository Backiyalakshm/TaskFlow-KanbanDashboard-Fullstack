import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, SkipForward, Settings, X, Loader2 } from 'lucide-react'
import { pomodoroApi, tasksApi } from '../services/api.js'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const MODES = [
  { id:'CLASSIC', label:'🍅 Classic',    work:25, break:5,  desc:'25 min work / 5 min break' },
  { id:'DEEP',    label:'🧠 Deep Focus', work:50, break:10, desc:'50 min work / 10 min break' },
  { id:'CUSTOM',  label:'⚙️ Custom',     work:30, break:10, desc:'Your own schedule' },
]

const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

export default function PomodoroPage() {
  const qc = useQueryClient()
  const [mode, setMode]   = useState('CLASSIC')
  const [cWork, setCWork] = useState(30)
  const [cBreak,setCBreak]= useState(10)
  const [phase, setPhase] = useState('work')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [interruptions, setInterruptions] = useState(0)
  const [taskId, setTaskId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [completed, setCompleted] = useState(0)
  const tickRef = useRef(null)

  const modeObj = MODES.find(m => m.id === mode)
  const workSec  = mode === 'CUSTOM' ? cWork*60  : modeObj.work*60
  const breakSec = mode === 'CUSTOM' ? cBreak*60 : modeObj.break*60
  const total    = phase === 'work' ? workSec : breakSec
  const progress = ((total - timeLeft) / total) * 100

  const { data: tasks = [] } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => { const r = await tasksApi.getMyTasks(); return r.data.data },
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['pomodoro-sessions'],
    queryFn: async () => { const r = await pomodoroApi.getSessions(); return r.data.data },
  })

  const startMut = useMutation({
    mutationFn: (d) => pomodoroApi.start(d),
    onSuccess: (r) => setSessionId(r.data.data.id),
  })

  const completeMut = useMutation({
    mutationFn: ({ id, data }) => pomodoroApi.complete(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['pomodoro-sessions'] })
      qc.invalidateQueries({ queryKey:['dashboard'] })
    },
  })

  const tick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        setRunning(false)
        clearInterval(tickRef.current)
        if (phase === 'work') {
          setCompleted(c => c + 1)
          if (sessionId) completeMut.mutate({ id: sessionId, data: { interruptions } })
          setPhase('break')
          setTimeLeft(breakSec)
          toast.success('🎉 Session complete! Time for a break.', { duration: 6000 })
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('TaskFlow AI – Break Time! ☕', { body: 'Great work! Take a well-deserved rest.' })
          }
        } else {
          setPhase('work')
          setTimeLeft(workSec)
          toast('⏰ Break over! Ready to focus again?', { icon: '🍅', duration: 5000 })
        }
        setSessionId(null)
        setInterruptions(0)
        return 0
      }
      return prev - 1
    })
  }, [phase, workSec, breakSec, sessionId, interruptions])

  useEffect(() => {
    if (running) { tickRef.current = setInterval(tick, 1000) }
    else { clearInterval(tickRef.current) }
    return () => clearInterval(tickRef.current)
  }, [running, tick])

  useEffect(() => {
    document.title = running ? `${fmt(timeLeft)} – TaskFlow AI` : 'TaskFlow AI'
    return () => { document.title = 'TaskFlow AI' }
  }, [timeLeft, running])

  const handleStart = () => {
    if (!running && phase === 'work' && !sessionId) {
      startMut.mutate({
        mode,
        taskId: taskId || undefined,
        workDuration: mode === 'CUSTOM' ? cWork : modeObj.work,
        breakDuration: mode === 'CUSTOM' ? cBreak : modeObj.break,
      })
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
    setRunning(true)
  }

  const handlePause = () => { setRunning(false); setInterruptions(i => i + 1) }
  const handleReset = () => {
    setRunning(false); clearInterval(tickRef.current)
    setPhase('work'); setTimeLeft(workSec); setSessionId(null); setInterruptions(0)
  }
  const handleSkip = () => {
    setRunning(false)
    const next = phase === 'work' ? 'break' : 'work'
    setPhase(next); setTimeLeft(next === 'work' ? workSec : breakSec)
    setSessionId(null); setInterruptions(0)
  }
  const handleModeChange = (m) => {
    setMode(m); setRunning(false)
    const o = MODES.find(x => x.id === m)
    setPhase('work'); setTimeLeft(m === 'CUSTOM' ? cWork*60 : o.work*60)
    setSessionId(null); setInterruptions(0)
  }

  // SVG ring
  const R = 120
  const circ = 2 * Math.PI * R
  const offset = circ - (progress / 100) * circ

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayCount  = sessions.filter(s => s.status === 'COMPLETED' && s.sessionDate === todayStr).length
  const todayMins   = sessions.filter(s => s.status === 'COMPLETED' && s.sessionDate === todayStr).reduce((a,s) => a+s.workDuration, 0)

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pomodoro Timer</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay in flow with time-boxed focus sessions</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`w-9 h-9 flex items-center justify-center rounded-xl glass transition-colors ${showSettings ? 'border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Timer column ── */}
        <div className="lg:col-span-2 flex flex-col items-center gap-6">
          {/* Mode selector */}
          <div className="flex gap-2 glass-card p-1.5 rounded-xl w-full sm:w-auto">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m.id
                    ? 'gradient-primary text-white shadow-lg shadow-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* SVG Ring */}
          <div className="relative flex items-center justify-center">
            <svg width="280" height="280" className="pomodoro-ring -rotate-90">
              <circle cx="140" cy="140" r={R} fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="10" />
              <motion.circle
                cx="140" cy="140" r={R}
                fill="none"
                stroke={phase === 'work' ? '#6366f1' : '#10b981'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                transition={{ duration: 0.4 }}
              />
            </svg>
            <div className="absolute flex flex-col items-center gap-1 text-center">
              <span className="text-base text-muted-foreground font-semibold">
                {phase === 'work' ? '🍅 Focus Time' : '☕ Break Time'}
              </span>
              <span className="text-5xl font-bold font-mono text-foreground tracking-tight tabular-nums">
                {fmt(timeLeft)}
              </span>
              <span className="text-xs text-muted-foreground">
                {running ? 'In progress…' : 'Ready'}
              </span>
              {interruptions > 0 && (
                <span className="text-xs text-orange-400 font-medium">
                  {interruptions} interruption{interruptions !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button onClick={handleReset} className="w-11 h-11 flex items-center justify-center rounded-xl glass hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Reset">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={running ? handlePause : handleStart}
              disabled={startMut.isPending}
              className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-xl shadow-primary/40 hover:scale-105 hover:shadow-primary/60 active:scale-95 transition-all disabled:opacity-60"
            >
              {startMut.isPending
                ? <Loader2 className="w-6 h-6 animate-spin" />
                : running
                  ? <Pause className="w-6 h-6" />
                  : <Play className="w-6 h-6 ml-0.5" />
              }
            </button>
            <button onClick={handleSkip} className="w-11 h-11 flex items-center justify-center rounded-xl glass hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Skip">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {Array.from({ length: Math.max(8, completed + 1) }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-3 h-3 rounded-full transition-all ${
                  i < completed ? 'bg-primary shadow-md shadow-primary/50' : 'bg-secondary'
                }`}
              />
            ))}
          </div>

          {/* Task link */}
          {tasks.length > 0 && (
            <div className="w-full max-w-xs">
              <label className="block text-sm font-medium text-foreground mb-1.5">Link to Task</label>
              <select
                value={taskId || ''}
                onChange={(e) => setTaskId(e.target.value ? Number(e.target.value) : null)}
                className="input-base text-sm"
              >
                <option value="">No task linked</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          )}

          {/* Custom mode settings */}
          <AnimatePresence>
            {showSettings && mode === 'CUSTOM' && (
              <motion.div
                initial={{ opacity:0, height:0 }}
                animate={{ opacity:1, height:'auto' }}
                exit={{ opacity:0, height:0 }}
                className="w-full max-w-xs glass-card p-4 space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Custom Durations</h3>
                  <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Work (min)</label>
                    <input type="number" min={1} max={120} value={cWork} onChange={(e) => { setCWork(Number(e.target.value)); if (phase==='work') setTimeLeft(Number(e.target.value)*60) }} className="input-base text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Break (min)</label>
                    <input type="number" min={1} max={60} value={cBreak} onChange={(e) => { setCBreak(Number(e.target.value)); if (phase==='break') setTimeLeft(Number(e.target.value)*60) }} className="input-base text-sm" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Stats sidebar ── */}
        <div className="space-y-4">
          {/* Today */}
          <div className="glass-card p-5">
            <h3 className="section-title">Today&apos;s Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Sessions Completed</span>
                  <span className="text-foreground font-bold">{todayCount}</span>
                </div>
                <div className="progress-bar">
                  <motion.div className="progress-fill bg-primary" style={{ width:`${Math.min((todayCount/8)*100, 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Goal: 8 sessions</p>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Focus Minutes</span>
                  <span className="text-foreground font-bold">{todayMins} min</span>
                </div>
                <div className="progress-bar">
                  <motion.div className="progress-fill bg-purple-400" style={{ width:`${Math.min((todayMins/240)*100, 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Goal: 4 hours</p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="glass-card p-5">
            <h3 className="section-title">💡 Focus Tips</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {[
                ['📵','Put phone on silent'],
                ['🎵','Listen to lo-fi music'],
                ['🎯','Set one clear goal'],
                ['☕','Prepare before starting'],
                ['🚶','Walk during breaks'],
                ['💧','Stay hydrated'],
              ].map(([e, t]) => (
                <li key={t} className="flex gap-2 items-start">
                  <span className="shrink-0">{e}</span> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Session history */}
          <div className="glass-card p-5">
            <h3 className="section-title">Recent Sessions</h3>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sessions yet. Start your first one!</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 6).map(s => (
                  <div key={s.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${s.status === 'COMPLETED' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <span className="text-foreground font-semibold">{s.workDuration}m</span>
                    <span className="text-muted-foreground truncate flex-1">{s.taskTitle || '—'}</span>
                    <span className="text-muted-foreground shrink-0">
                      {s.sessionDate ? format(new Date(s.sessionDate + 'T00:00:00'), 'MMM d') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
