import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      theme: 'dark',
      selectedWorkspaceId: null,
      selectedBoardId: null,

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.classList.toggle('light', next === 'light')
        document.documentElement.classList.toggle('dark', next === 'dark')
        set({ theme: next })
      },

      setWorkspace: (id) => set({ selectedWorkspaceId: id }),
      setBoard: (id) => set({ selectedBoardId: id }),
    }),
    {
      name: 'tf-ui-store',
      partialize: (s) => ({
        theme: s.theme,
        sidebarOpen: s.sidebarOpen,
        selectedWorkspaceId: s.selectedWorkspaceId,
      }),
    }
  )
)
