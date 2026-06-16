import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay,
  isToday, addMonths, subMonths
} from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react'
import { tasksApi, habitsApi } from '../services/api.js'

const PRIORITY_COLORS = {
  URGENT: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e'
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState('month')

  const { data: tasks = [] } = useQuery({
    queryKey: ['my-tasks-cal'],
    queryFn: async () => { const r = await tasksApi.getMyTasks(); return r.data.data },
  })

  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => { const r = await habitsApi.getAll(); return r.data.data },
  })

  const getTasksForDay = (day) =>
    tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day))

  // Build calendar grid
  const monthStart  = startOfMonth(currentMonth)
  const monthEnd    = endOfMonth(currentMonth)
  const calStart    = startOfWeek(monthStart)
  const calEnd      = endOfWeek(monthEnd)
  const allDays     = eachDayOfInterval({ start: calStart, end: calEnd })

  const selectedTasks = getTasksForDay(selectedDate)
  const selectedHabits = habits // show all habits on selected day

  // Week view: 7 days starting from start of current week containing selectedDate
  const weekStart = startOfWeek(selectedDate)
  const weekDays  = eachDayOfInterval({ start: weekStart, end: endOfWeek(selectedDate) })

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and visualise your tasks</p>
        </div>
        <div className="flex items-center gap-2">
          {['month','week'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                view === v ? 'gradient-primary text-white shadow-md' : 'glass text-muted-foreground hover:text-foreground'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Calendar grid ── */}
        <div className="lg:col-span-3 glass-card p-5">
          {/* Nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-foreground">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-bold text-muted-foreground py-2 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Month view */}
          {view === 'month' && (
            <div className="grid grid-cols-7 gap-1">
              {allDays.map((day) => {
                const dayTasks    = getTasksForDay(day)
                const inMonth     = isSameMonth(day, currentMonth)
                const isSelected  = isSameDay(day, selectedDate)
                const isTodayDay  = isToday(day)

                return (
                  <motion.button
                    key={day.toISOString()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedDate(day)}
                    className={`relative min-h-[4.5rem] p-1.5 rounded-xl text-left transition-all border-2 ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : isTodayDay
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-transparent hover:border-border hover:bg-secondary/40'
                    } ${!inMonth ? 'opacity-25' : ''}`}
                  >
                    <span className={`text-xs font-bold block mb-1 leading-none ${
                      isTodayDay
                        ? 'w-5 h-5 gradient-primary text-white rounded-full flex items-center justify-center text-[10px]'
                        : isSelected ? 'text-primary' : 'text-foreground'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 2).map(t => (
                        <div
                          key={t.id}
                          className="h-1 rounded-full"
                          style={{ background: PRIORITY_COLORS[t.priority] || '#6366f1' }}
                          title={t.title}
                        />
                      ))}
                      {dayTasks.length > 2 && (
                        <p className="text-[9px] text-muted-foreground font-semibold">+{dayTasks.length - 2}</p>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* Week view */}
          {view === 'week' && (
            <div>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const dayTasks   = getTasksForDay(day)
                  const isSelected = isSameDay(day, selectedDate)
                  const isTodayDay = isToday(day)

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`cursor-pointer rounded-xl p-3 border-2 transition-all min-h-[10rem] ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : isTodayDay
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-transparent hover:border-border hover:bg-secondary/30'
                      }`}
                    >
                      <p className={`text-xs font-bold mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {format(day, 'EEE')}
                      </p>
                      <p className={`text-xl font-bold mb-3 ${isTodayDay ? 'text-primary' : 'text-foreground'}`}>
                        {format(day, 'd')}
                      </p>
                      <div className="space-y-1">
                        {dayTasks.map(t => (
                          <div
                            key={t.id}
                            className="text-[10px] px-2 py-1 rounded-lg text-white font-medium truncate"
                            style={{ background: PRIORITY_COLORS[t.priority] || '#6366f1' }}
                            title={t.title}
                          >
                            {t.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Today button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => { setSelectedDate(new Date()); setCurrentMonth(new Date()) }}
              className="btn-ghost text-xs px-3 py-1.5 rounded-lg"
            >
              Back to Today
            </button>
          </div>
        </div>

        {/* ── Detail panel ── */}
        <div className="space-y-4">
          {/* Selected day */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
            </div>

            {selectedTasks.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tasks due</p>
                {isToday(selectedDate) && (
                  <p className="text-xs text-green-400 mt-1 font-medium">Free day! 🎉</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {selectedTasks.map(task => (
                  <div key={task.id} className="p-3 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-start gap-2">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: PRIORITY_COLORS[task.priority] || '#6366f1' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{task.title}</p>
                        {task.dueDate && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {format(new Date(task.dueDate), 'h:mm a')}
                          </p>
                        )}
                        <span className={`text-[10px] font-semibold mt-1 inline-block px-1.5 py-0.5 rounded ${
                          task.priority === 'URGENT' ? 'text-red-400 bg-red-400/10' :
                          task.priority === 'HIGH'   ? 'text-orange-400 bg-orange-400/10' :
                          task.priority === 'MEDIUM' ? 'text-yellow-400 bg-yellow-400/10' :
                                                       'text-green-400 bg-green-400/10'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* This month summary */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Month Summary</h3>
            <div className="space-y-3 text-xs">
              {[
                {
                  label: 'Total tasks',
                  value: tasks.filter(t => t.dueDate && isSameMonth(new Date(t.dueDate), currentMonth)).length,
                  color: 'text-foreground',
                },
                {
                  label: 'Completed',
                  value: tasks.filter(t => t.dueDate && isSameMonth(new Date(t.dueDate), currentMonth) && t.status === 'COMPLETED').length,
                  color: 'text-green-400',
                },
                {
                  label: 'Upcoming',
                  value: tasks.filter(t => t.dueDate && isSameMonth(new Date(t.dueDate), currentMonth) && t.status !== 'COMPLETED').length,
                  color: 'text-primary',
                },
                {
                  label: 'Urgent',
                  value: tasks.filter(t => t.dueDate && isSameMonth(new Date(t.dueDate), currentMonth) && t.priority === 'URGENT').length,
                  color: 'text-red-400',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Habit status */}
          {habits.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Habit Status</h3>
              <div className="space-y-2">
                {habits.slice(0, 5).map(h => (
                  <div key={h.id} className="flex items-center gap-2">
                    <span className="text-base">{h.icon}</span>
                    <span className="text-xs text-foreground flex-1 truncate">{h.name}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      h.completedToday ? 'bg-green-400 text-white' : 'border-2 border-border text-muted-foreground'
                    }`}>
                      {h.completedToday ? '✓' : h.currentStreak}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
