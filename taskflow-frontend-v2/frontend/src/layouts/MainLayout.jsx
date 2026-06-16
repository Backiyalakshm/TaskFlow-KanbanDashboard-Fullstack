import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Kanban, Target, BookOpen, Timer,
  BarChart3, Calendar, Settings, Bell, Search,
  Sun, Moon, Menu, X, Zap, LogOut, ChevronDown, Plus,
  Command
} from 'lucide-react'
import { useAuthStore } from '../store/authStore.js'
import { useUIStore } from '../store/uiStore.js'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '../services/api.js'

const NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/kanban',    icon: Kanban,          label: 'Kanban Board', badge: null },
  { path: '/habits',   icon: Target,           label: 'Habits' },
  { path: '/study',    icon: BookOpen,         label: 'Study Tracker' },
  { path: '/pomodoro', icon: Timer,            label: 'Pomodoro' },
  { path: '/analytics',icon: BarChart3,        label: 'Analytics' },
  { path: '/calendar', icon: Calendar,         label: 'Calendar' },
]

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore()
  const [searchQ, setSearchQ] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notif-unread'],
    queryFn: async () => {
      const r = await notificationsApi.getUnreadCount()
      return r.data.data
    },
    refetchInterval: 30000,
  })

  const initial = (user?.firstName || user?.username || 'U')[0].toUpperCase()
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.username

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -270, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -270, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="w-64 h-full flex flex-col border-r border-border bg-card/60 backdrop-blur-xl z-30 shrink-0"
          >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 h-14 border-b border-border shrink-0">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-none">TaskFlow AI</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">Smart Productivity</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-3">
                Main Menu
              </p>
              {NAV.map(({ path, icon: Icon, label, badge }) => (
                <Link
                  key={path}
                  to={path}
                  className={`sidebar-item ${isActive(path) ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                      {badge}
                    </span>
                  )}
                </Link>
              ))}

              <div className="pt-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-3">
                  Account
                </p>
                <Link to="/settings" className={`sidebar-item ${isActive('/settings') ? 'active' : ''}`}>
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Settings</span>
                </Link>
              </div>
            </nav>

            {/* User panel */}
            <div className="p-3 border-t border-border">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/80 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 right-0 mb-2 glass-card rounded-xl overflow-hidden shadow-xl"
                    >
                      <div className="p-3 border-b border-border">
                        <p className="text-xs font-medium text-foreground">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground">{user?.email}</p>
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" /> Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-card/40 backdrop-blur-xl flex items-center gap-3 px-4 shrink-0 z-20">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search tasks, boards…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm input-base h-8"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Quick Add */}
            <Link to="/kanban" className="btn-primary h-8 flex items-center gap-1.5 px-3 text-xs font-semibold">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Task</span>
            </Link>

            {/* Theme */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 gradient-primary rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Avatar */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              {initial}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 h-full">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
