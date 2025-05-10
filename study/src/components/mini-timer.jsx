"use client"

import { useState } from "react"
import { Pause, Play } from "lucide-react"

export default function MiniTimer({ timeLeft, isRunning, mode, onTogglePlay, onClose }) {
  const [isHovered, setIsHovered] = useState(false)

  const formatTime = (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds)) {
      return "00:00"
    }

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getModeColor = () => {
    switch (mode) {
      case "focus":
        return "bg-red-600"
      case "shortBreak":
        return "bg-green-600"
      case "longBreak":
        return "bg-blue-600"
      default:
        return "bg-zinc-700"
    }
  }

  const pulseEffect = isRunning && timeLeft < 10 // Add pulse effect when timer is about to end

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full shadow-lg transition-all duration-300 animate-fade-in ${pulseEffect ? "pulse-animation" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: isHovered ? "auto" : "auto",
        padding: isHovered ? "0.5rem 1rem" : "0.5rem",
        background: "rgba(24, 24, 27, 0.9)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className={`w-3 h-3 rounded-full ${getModeColor()}`}></div>

      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-white">{formatTime(timeLeft)}</span>

        <button onClick={onTogglePlay} className="text-white hover:text-gray-300 transition-colors">
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {isHovered && (
          <span className="text-xs text-white capitalize ml-1">
            {mode === "focus" ? "Focus" : mode === "shortBreak" ? "Short Break" : "Long Break"}
          </span>
        )}

        {isHovered && (
          <button onClick={onClose} className="ml-1 text-gray-400 hover:text-white transition-colors">
            ×
          </button>
        )}
      </div>
    </div>
  )
}
