'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import CaptureModal from './CaptureModal'

interface CaptureContextValue {
  openCapture: () => void
}

const CaptureContext = createContext<CaptureContextValue | null>(null)

export function useCaptureModal() {
  const context = useContext(CaptureContext)
  if (!context) {
    throw new Error('useCaptureModal must be used within CaptureProvider')
  }
  return context
}

export default function CaptureProvider({ children }: { children: React.ReactNode }) {
  const [captureOpen, setCaptureOpen] = useState(false)

  // Register Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCaptureOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const openCapture = () => setCaptureOpen(true)

  return (
    <CaptureContext.Provider value={{ openCapture }}>
      {children}
      <CaptureModal open={captureOpen} onOpenChange={setCaptureOpen} />
    </CaptureContext.Provider>
  )
}
