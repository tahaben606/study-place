"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

export default function PopOutWidget({ title, icon, children, color = "bg-zinc-800" }) {
  const [isOpen, setIsOpen] = useState(false)
  const widgetRef = useRef(null)
  const containerRef = useRef(null)

  // Handle escape key to close widget
  useEffect(() => {
    if (!isOpen) return

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscapeKey)
    return () => {
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={containerRef}>
      {/* Widget Tile - Always visible */}
      <div
        className={`${color} rounded-xl shadow-lg p-4 aspect-square flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 hover:shadow-xl ${isOpen ? "ring-2 ring-white/20" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="text-white mb-3">{icon}</div>
        <h3 className="text-white text-sm font-medium text-center">{title}</h3>
      </div>

      {/* Pop-out Widget - Positioned to the left */}
      {isOpen && (
        <div
          ref={widgetRef}
          className="absolute right-full top-0 mr-4 bg-zinc-900 rounded-xl shadow-2xl w-[350px] h-[500px] flex flex-col overflow-hidden animate-slide-in-left z-10"
          style={{
            maxHeight: "calc(100vh - 6rem)",
          }}
        >
          <div className="p-4 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="font-bold text-lg">{title}</h3>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
              }}
              className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      )}
    </div>
  )
}
