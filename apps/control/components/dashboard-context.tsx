"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"
import type { AutonomyLevelCode } from "@/lib/api/types"

// ── Toast types ──────────────────────────────────────────────────────────────

export interface Toast {
  id: string
  title: string
  description?: string
  variant: "default" | "success" | "warning" | "destructive"
  href?: string
  createdAt: number
}

// ── Context value ────────────────────────────────────────────────────────────

interface DashboardContextValue {
  pipelinePaused: boolean
  togglePipeline: () => void
  autonomyLevel: AutonomyLevelCode
  setAutonomyLevel: (level: AutonomyLevelCode) => void
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id" | "createdAt">) => void
  dismissToast: (id: string) => void
  commandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [pipelinePaused, setPipelinePaused] = useState(false)
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevelCode>("A2")
  const [toasts, setToasts] = useState<Toast[]>([])
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), [])
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), [])

  const togglePipeline = useCallback(() => {
    setPipelinePaused((prev) => !prev)
  }, [])

  const addToast = useCallback(
    (toast: Omit<Toast, "id" | "createdAt">) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { ...toast, id, createdAt: Date.now() }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
    },
    [],
  )

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <DashboardContext.Provider
      value={{
        pipelinePaused,
        togglePipeline,
        autonomyLevel,
        setAutonomyLevel,
        toasts,
        addToast,
        dismissToast,
        commandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return ctx
}
