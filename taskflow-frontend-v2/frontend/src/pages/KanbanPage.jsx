import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext, DragOverlay, closestCorners,
  useSensor, useSensors, PointerSensor, KeyboardSensor
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Clock, MessageSquare, Paperclip, Calendar,
  Loader2, X, Zap, Star, Archive, MoreHorizontal
} from 'lucide-react'
import { boardsApi, tasksApi, workspacesApi } from '../services/api.js'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const PRIORITY_DOTS = { URGENT: 'bg-red-400', HIGH: 'bg-orange-400', MEDIUM: 'bg-yellow-400', LOW: 'bg-green-400' }
const PRIORITY_TEXT = { URGENT: 'priority-urgent', HIGH: 'priority-high', MEDIUM: 'priority-medium', LOW: 'priority-low' }
const COL_COLORS = { Backlog: '#6b7280', 'To Do': '#3b82f6', 'In Progress': '#f59e0b', Review: '#8b5cf6', Testing: '#ec4899', Done: '#10b981' }

// ─── Task Card ─────────────────────────────────────────────────────────────
function TaskCard({ task, isDragging = false }) {
  const done = task.checklists?.filter(c => c.isCompleted).length ?? 0
  const total = task.checklists?.length ?? 0
  const pct = total > 0 ? Math.round((done / total) * 100) : null

  return (
    <div className={`task-card select-none ${isDragging ? 'shadow-2xl shadow-primary/30 rotate-2 scale-105' : ''}`}>
      {/* Priority row */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOTS[task.priority] ?? 'bg-muted'}`} />
        <span className={`badge text-[10px] font-semibold px-1.5 py-0.5 ${PRIORITY_TEXT[task.priority] ?? ''}`}>
          {task.priority}
        </span>
        {task.aiPriority && (
          <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5 text-primary" />
            {task.aiPriority.split(' ')[0]}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground mb-2 line-clamp-2 leading-snug">{task.title}</p>

      {/* Checklist progress */}
      {pct !== null && (
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{done}/{total} done</span>
            <span>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Labels */}
      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map(l => (
            <span key={l.id} className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium" style={{ background: l.color }}>
              {l.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border">
        {task.dueDate && (
          <span className="flex items-center gap-0.5">
            <Calendar className="w-2.5 h-2.5" />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
        {task.commentCount > 0 && (
          <span className="flex items-center gap-0.5">
            <MessageSquare className="w-2.5 h-2.5" />
            {task.commentCount}
          </span>
        )}
        {task.attachmentCount > 0 && (
          <span className="flex items-center gap-0.5">
            <Paperclip className="w-2.5 h-2.5" />
            {task.attachmentCount}
          </span>
        )}
        {task.estimatedHours > 0 && (
          <span className="flex items-center gap-0.5 ml-auto">
            <Clock className="w-2.5 h-2.5" />
            {task.estimatedHours}h
          </span>
        )}
        {task.assignee && (
          <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-white text-[9px] font-bold ml-auto">
            {(task.assignee.firstName || task.assignee.username)[0].toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sortable Task ──────────────────────────────────────────────────────────
function SortableTask({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${task.id}`,
    data: { type: 'task', task },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
    </div>
  )
}

// ─── Kanban Column ──────────────────────────────────────────────────────────
function KanbanColumn({ column, onAddTask }) {
  const { setNodeRef, isOver } = useSortable({
    id: `col-${column.id}`,
    data: { type: 'column', column },
  })

  const colColor = COL_COLORS[column.title] ?? '#6366f1'
  const taskIds = column.tasks.map(t => `task-${t.id}`)

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column transition-all duration-200 ${isOver ? 'ring-2 ring-primary/40' : ''}`}
    >
      {/* Header */}
      <div className="glass-card rounded-b-none border-b-0 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colColor }} />
          <span className="text-sm font-bold text-foreground">{column.title}</span>
          <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full font-semibold">
            {column.tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Add task"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tasks drop zone */}
      <div className={`glass rounded-t-none min-h-[8rem] p-2 space-y-2 transition-colors ${isOver ? 'bg-primary/5' : ''}`}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map(task => <SortableTask key={task.id} task={task} />)}
        </SortableContext>

        {column.tasks.length === 0 && !isOver && (
          <button
            onClick={() => onAddTask(column.id)}
            className="w-full h-16 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add a task
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Add Task Modal ─────────────────────────────────────────────────────────
function AddTaskModal({ open, onClose, columnId, boardId }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [hours, setHours] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => tasksApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board'] })
      toast.success('Task created! ✅')
      setTitle(''); setDesc(''); setPriority('MEDIUM'); setDueDate(''); setHours('')
      onClose()
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to create task'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !columnId) return
    mutate({
      title: title.trim(),
      description: desc.trim() || undefined,
      boardId,
      columnId,
      priority,
      dueDate: dueDate || undefined,
      estimatedHours: hours ? parseFloat(hours) : undefined,
    })
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
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="modal-content w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Add New Task</h3>
              <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="input-base"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Add details…"
                  rows={2}
                  className="textarea-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-base">
                    <option value="LOW">🟢 Low</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="URGENT">🔴 Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Est. Hours</label>
                  <input
                    type="number" step="0.5" min="0"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="0"
                    className="input-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Due Date</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-base"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button type="submit" disabled={isPending || !title.trim()} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Create Board Modal ─────────────────────────────────────────────────────
function CreateBoardModal({ open, onClose, workspaceId }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const { mutate, isPending } = useMutation({
    mutationFn: (data) => boardsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boards'] })
      toast.success('Board created! 🗂️')
      setName('')
      onClose()
    },
    onError: () => toast.error('Failed to create board'),
  })

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
            className="modal-content w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Create New Board</h3>
              <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Board name (e.g., Sprint 1, Project Alpha)"
                className="input-base"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && workspaceId && mutate({ name, workspaceId })}
              />
              <p className="text-xs text-muted-foreground">A board will be created with 6 default columns: Backlog, To Do, In Progress, Review, Testing, Done.</p>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button
                  onClick={() => name.trim() && workspaceId && mutate({ name, workspaceId })}
                  disabled={isPending || !name.trim()}
                  className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Board
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main Kanban Page ───────────────────────────────────────────────────────
export default function KanbanPage() {
  const qc = useQueryClient()
  const [taskModal, setTaskModal] = useState({ open: false, columnId: null })
  const [boardModal, setBoardModal] = useState(false)
  const [activeTask, setActiveTask] = useState(null)
  const [selectedBoardId, setSelectedBoardId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const { data: workspace } = useQuery({
    queryKey: ['personal-workspace'],
    queryFn: async () => {
      const r = await workspacesApi.getPersonal()
      return r.data.data
    },
  })

  const { data: boards = [], isLoading: boardsLoading } = useQuery({
    queryKey: ['boards', workspace?.id],
    queryFn: async () => {
      const r = await boardsApi.getByWorkspace(workspace.id)
      return r.data.data
    },
    enabled: !!workspace?.id,
  })

  const activeBoardId = selectedBoardId || boards[0]?.id

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['board', activeBoardId],
    queryFn: async () => {
      const r = await boardsApi.getById(activeBoardId)
      return r.data.data
    },
    enabled: !!activeBoardId,
  })

  const moveTask = useMutation({
    mutationFn: ({ taskId, columnId, position }) => tasksApi.move(taskId, columnId, position),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', activeBoardId] }),
    onError: () => qc.invalidateQueries({ queryKey: ['board', activeBoardId] }),
  })

  const handleDragStart = (e) => {
    if (e.active.data.current?.type === 'task') setActiveTask(e.active.data.current.task)
  }

  const handleDragEnd = useCallback((e) => {
    setActiveTask(null)
    const { active, over } = e
    if (!over || !board) return

    const activeId = active.id.toString()
    const overId = over.id.toString()
    if (activeId === overId) return

    const taskId = parseInt(activeId.replace('task-', ''))
    let colId = null
    let pos = 0

    if (overId.startsWith('col-')) {
      colId = parseInt(overId.replace('col-', ''))
      const col = board.columns.find(c => c.id === colId)
      pos = col?.tasks.length ?? 0
    } else if (overId.startsWith('task-')) {
      const overTaskId = parseInt(overId.replace('task-', ''))
      for (const col of board.columns) {
        const idx = col.tasks.findIndex(t => t.id === overTaskId)
        if (idx !== -1) { colId = col.id; pos = idx; break }
      }
    }

    if (colId) moveTask.mutate({ taskId, columnId: colId, position: pos })
  }, [board])

  if (boardsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0 gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Kanban Board</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Drag & drop tasks to update their status</p>
        </div>
        <div className="flex items-center gap-3">
          {boards.length > 0 && (
            <select
              value={activeBoardId || ''}
              onChange={(e) => setSelectedBoardId(Number(e.target.value))}
              className="input-base text-sm h-9 min-w-40"
            >
              {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <button onClick={() => setBoardModal(true)} className="btn-primary h-9 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Board
          </button>
        </div>
      </div>

      {/* Empty state */}
      {boards.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-5 opacity-60">
              <Zap className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No boards yet</h2>
            <p className="text-muted-foreground mb-6 max-w-xs">Create your first Kanban board to start organizing tasks visually</p>
            <button onClick={() => setBoardModal(true)} className="btn-primary">
              Create Your First Board
            </button>
          </div>
        </div>
      )}

      {/* Board */}
      {board && (
        <div className="flex-1 overflow-x-auto pb-4">
          {boardLoading ? (
            <div className="flex gap-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="kanban-column animate-pulse">
                  <div className="h-11 bg-secondary rounded-t-xl shimmer" />
                  <div className="h-64 bg-secondary/50 rounded-b-xl space-y-2 p-2">
                    {[80, 60, 72].map((h, j) => (
                      <div key={j} className="bg-secondary rounded-xl shimmer" style={{ height: h }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 items-start">
                <SortableContext items={board.columns.map(c => `col-${c.id}`)} strategy={verticalListSortingStrategy}>
                  {board.columns.map(col => (
                    <KanbanColumn
                      key={col.id}
                      column={col}
                      onAddTask={(cId) => setTaskModal({ open: true, columnId: cId })}
                    />
                  ))}
                </SortableContext>
              </div>
              <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
                {activeTask && <TaskCard task={activeTask} isDragging />}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateBoardModal open={boardModal} onClose={() => setBoardModal(false)} workspaceId={workspace?.id} />
      {activeBoardId && (
        <AddTaskModal
          open={taskModal.open}
          onClose={() => setTaskModal({ open: false, columnId: null })}
          columnId={taskModal.columnId}
          boardId={activeBoardId}
        />
      )}
    </div>
  )
}
