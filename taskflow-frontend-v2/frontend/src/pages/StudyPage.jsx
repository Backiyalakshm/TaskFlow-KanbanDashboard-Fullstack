import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen, Clock, Brain, X, Loader2, Trash2 } from 'lucide-react'
import { studyApi } from '../services/api.js'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const SUBJECTS = ['DSA','Java','Spring Boot','SQL','Aptitude','System Design','React','TypeScript','Python','Other']
const DIFFS    = ['EASY','MEDIUM','HARD']
const SUBJ_COLORS = ['#6366f1','#8b5cf6','#10b981','#3b82f6','#f59e0b','#ef4444','#ec4899','#0ea5e9','#14b8a6','#84cc16']
const TIP = {
  contentStyle:{ background:'hsl(222 47% 12%)', border:'1px solid hsl(217 33% 20%)', borderRadius:'0.5rem', fontSize:'12px' },
  labelStyle:{ color:'hsl(210 40% 98%)' },
}

function DiffBadge({ d }) {
  const map = { EASY:'badge-success', MEDIUM:'badge-warning', HARD:'badge-danger' }
  return <span className={`badge ${map[d] || 'badge-primary'} text-xs`}>{d}</span>
}

function AddSessionModal({ open, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ subject:'DSA', topic:'', hoursStudied:'', problemsSolved:'', notes:'', difficulty:'MEDIUM' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => studyApi.createSession(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['study-sessions'] })
      qc.invalidateQueries({ queryKey:['study-stats'] })
      qc.invalidateQueries({ queryKey:['dashboard'] })
      toast.success('Study session logged! 📚')
      setForm({ subject:'DSA', topic:'', hoursStudied:'', problemsSolved:'', notes:'', difficulty:'MEDIUM' })
      onClose()
    },
    onError: () => toast.error('Failed to log session'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.hoursStudied) return
    mutate({ ...form, hoursStudied: parseFloat(form.hoursStudied), problemsSolved: parseInt(form.problemsSolved) || 0 })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale:0.92, opacity:0 }}
            animate={{ scale:1, opacity:1 }}
            exit={{ scale:0.92, opacity:0 }}
            className="modal-content w-full max-w-lg"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Log Study Session</h3>
              <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Subject *</label>
                  <select value={form.subject} onChange={set('subject')} className="input-base">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Difficulty</label>
                  <select value={form.difficulty} onChange={set('difficulty')} className="input-base">
                    {DIFFS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Topic</label>
                <input value={form.topic} onChange={set('topic')} placeholder="e.g., Binary Trees, JWT Auth" className="input-base" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Hours Studied *</label>
                  <input type="number" step="0.25" min="0.25" max="24" value={form.hoursStudied} onChange={set('hoursStudied')} placeholder="1.5" className="input-base" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Problems Solved</label>
                  <input type="number" min="0" value={form.problemsSolved} onChange={set('problemsSolved')} placeholder="0" className="input-base" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={set('notes')} placeholder="What did you learn today?" rows={3} className="textarea-base" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Log Session
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function StudyPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['study-sessions'],
    queryFn: async () => { const r = await studyApi.getSessions(); return r.data.data },
  })
  const { data: stats = [] } = useQuery({
    queryKey: ['study-stats'],
    queryFn: async () => { const r = await studyApi.getStats(); return r.data.data },
  })
  const { data: weeklyHours = 0 } = useQuery({
    queryKey: ['weekly-hours'],
    queryFn: async () => { const r = await studyApi.getWeeklyHours(); return r.data.data },
  })

  const delMut = useMutation({
    mutationFn: (id) => studyApi.deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['study-sessions'] })
      qc.invalidateQueries({ queryKey:['study-stats'] })
      toast.success('Session deleted')
    },
  })

  const totalHours = sessions.reduce((s, ss) => s + ss.hoursStudied, 0)
  const totalProblems = sessions.reduce((s, ss) => s + ss.problemsSolved, 0)

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Study Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your learning progress across all subjects</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Total Hours',    value:`${totalHours.toFixed(1)}h`,  icon:'⏱️', color:'text-primary' },
          { label:'This Week',      value:`${(weeklyHours||0).toFixed(1)}h`, icon:'📅', color:'text-blue-400' },
          { label:'Problems Solved',value:totalProblems,               icon:'🧩', color:'text-green-400' },
          { label:'Sessions',       value:sessions.length,             icon:'📖', color:'text-purple-400' },
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

      {/* Charts */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="section-title">Hours per Subject</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="subject" tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'hsl(215 20% 60%)', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TIP} />
                <Bar dataKey="hours" name="Hours" radius={[4,4,0,0]}>
                  {stats.map((_, i) => <Cell key={i} fill={SUBJ_COLORS[i % SUBJ_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-5">
            <h3 className="section-title">Subject Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats} dataKey="hours" nameKey="subject" cx="50%" cy="50%" outerRadius={80}
                  label={({ subject, percent }) => `${subject} ${(percent*100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stats.map((_, i) => <Cell key={i} fill={SUBJ_COLORS[i % SUBJ_COLORS.length]} />)}
                </Pie>
                <Tooltip {...TIP} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div>
        <h2 className="section-title">Recent Sessions</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => <div key={i} className="glass-card h-20 animate-pulse shimmer" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-1">No study sessions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start tracking your learning journey today</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">Log First Session</button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sessions.map(s => (
                <motion.div
                  key={s.id}
                  initial={{ opacity:0, y:8 }}
                  animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, scale:0.95 }}
                  className="glass-card p-4 flex items-center gap-4"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: SUBJ_COLORS[SUBJECTS.indexOf(s.subject) % SUBJ_COLORS.length] + '22' }}
                  >📚</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">{s.subject}</p>
                      {s.topic && <span className="text-xs text-muted-foreground">— {s.topic}</span>}
                      <DiffBadge d={s.difficulty} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.hoursStudied}h</span>
                      {s.problemsSolved > 0 && <span className="flex items-center gap-1"><Brain className="w-3 h-3" />{s.problemsSolved} problems</span>}
                      <span>{format(new Date(s.sessionDate), 'MMM d, yyyy')}</span>
                    </div>
                    {s.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{s.notes}</p>}
                  </div>
                  <button
                    onClick={() => delMut.mutate(s.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AddSessionModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
