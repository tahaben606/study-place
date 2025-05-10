"use client"

import { useState, useEffect, useRef } from "react"
import { Clock, Play, Pause, SkipForward, Settings, Volume2, VolumeX, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export default function PomodoroTimer({
  onFocusStart,
  onBreakTime,
  compact = false,
  fullscreen = false,
  onTimerUpdate,
  initialTime = 25 * 60,
  initialMode = "focus",
  initialIsRunning = false,
}) {
  const [mode, setMode] = useState(initialMode)
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(initialIsRunning)
  const [settings, setSettings] = useState({
    focusTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    soundEnabled: true,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'

  const timerRef = useRef(null)
  const alarmSound = useRef(null)

  // Initialize audio - with improved error handling
  useEffect(() => {
    try {
      // Use a built-in notification sound instead of relying on an external file
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()

      // Create a simple beep sound function instead of loading an external file
      const createBeepSound = () => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.type = "sine"
        oscillator.frequency.value = 800
        gainNode.gain.value = 0.5

        return {
          play: () => {
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.3)
          },
        }
      }

      alarmSound.current = {
        play: () => {
          try {
            const beep = createBeepSound()
            beep.play()
            // Play multiple beeps for better notification
            setTimeout(() => {
              const beep2 = createBeepSound()
              beep2.play()
            }, 400)
            setTimeout(() => {
              const beep3 = createBeepSound()
              beep3.play()
            }, 800)
          } catch (error) {
            console.error("Error playing beep sound:", error)
          }
        },
      }
    } catch (error) {
      console.error("Could not initialize audio:", error)
      // Provide a fallback that doesn't throw errors
      alarmSound.current = {
        play: () => console.log("Sound would play here (fallback)"),
      }
    }

    return () => {
      // No need to clean up our custom sound object
    }
  }, [])

  // Load settings from localStorage with error handling
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("pomodoroSettings")
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }

      const savedPomodoros = localStorage.getItem("completedPomodoros")
      if (savedPomodoros) {
        const parsed = Number.parseInt(savedPomodoros, 10)
        if (!isNaN(parsed)) {
          setCompletedPomodoros(parsed)
        }
      }
    } catch (error) {
      console.error("Error loading settings from localStorage:", error)
    }
  }, [])

  // Save settings to localStorage with error handling
  useEffect(() => {
    try {
      localStorage.setItem("pomodoroSettings", JSON.stringify(settings))
    } catch (error) {
      console.error("Error saving settings to localStorage:", error)
    }
  }, [settings])

  useEffect(() => {
    try {
      localStorage.setItem("completedPomodoros", completedPomodoros.toString())
    } catch (error) {
      console.error("Error saving pomodoros to localStorage:", error)
    }
  }, [completedPomodoros])

  // Update parent component with timer state
  useEffect(() => {
    if (onTimerUpdate) {
      onTimerUpdate({
        timeLeft,
        isRunning,
        mode,
        toggleTimer: handleToggleTimer,
      })
    }
  }, [timeLeft, isRunning, mode, onTimerUpdate])

  // Timer logic - fixed to prevent memory leaks and ensure accurate timing
  useEffect(() => {
    if (isRunning) {
      const startTime = Date.now()
      const initialTimeLeft = timeLeft

      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
        const newTimeLeft = Math.max(0, initialTimeLeft - elapsedSeconds)

        setTimeLeft(newTimeLeft)

        if (newTimeLeft <= 0) {
          handleTimerComplete()
        }
      }, 100) // Update more frequently for smoother countdown
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, mode]) // Add mode to dependencies to reset timer when mode changes

  // Set initial time based on mode
  useEffect(() => {
    let newTime = 25 * 60 // Default fallback

    switch (mode) {
      case "focus":
        newTime = settings.focusTime * 60
        break
      case "shortBreak":
        newTime = settings.shortBreakTime * 60
        break
      case "longBreak":
        newTime = settings.longBreakTime * 60
        break
    }

    setTimeLeft(newTime)

    // If timer is running and mode changes, stop it to prevent unexpected behavior
    if (isRunning) {
      setIsRunning(false)
    }
  }, [mode, settings])

  const handleTimerComplete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (settings.soundEnabled && alarmSound.current) {
      try {
        alarmSound.current.play()
      } catch (error) {
        console.error("Error playing alarm sound:", error)
      }
    }

    if (mode === "focus") {
      const newCompletedCount = completedPomodoros + 1
      setCompletedPomodoros(newCompletedCount)

      // Notify parent component about break time
      if (onBreakTime && typeof onBreakTime === "function") {
        if (newCompletedCount % settings.longBreakInterval === 0) {
          onBreakTime(settings.longBreakTime)
        } else {
          onBreakTime(settings.shortBreakTime)
        }
      }

      // Determine which break to take
      if (newCompletedCount % settings.longBreakInterval === 0) {
        setMode("longBreak")
        setIsRunning(settings.autoStartBreaks)
      } else {
        setMode("shortBreak")
        setIsRunning(settings.autoStartBreaks)
      }
    } else {
      // Break is over, back to focus
      setMode("focus")
      setIsRunning(settings.autoStartPomodoros)
    }
  }

  const handleToggleTimer = () => {
    const newIsRunning = !isRunning
    setIsRunning(newIsRunning)

    // If starting a focus session, notify parent
    if (newIsRunning && mode === "focus" && onFocusStart && typeof onFocusStart === "function") {
      onFocusStart()
    }
  }

  const skipToNext = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (mode === "focus") {
      if ((completedPomodoros + 1) % settings.longBreakInterval === 0) {
        setMode("longBreak")
      } else {
        setMode("shortBreak")
      }
    } else {
      setMode("focus")
    }
    setIsRunning(false)
  }

  const formatTime = (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds)) {
      return "00:00"
    }

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getProgressPercent = () => {
    let totalTime
    switch (mode) {
      case "focus":
        totalTime = settings.focusTime * 60
        break
      case "shortBreak":
        totalTime = settings.shortBreakTime * 60
        break
      case "longBreak":
        totalTime = settings.longBreakTime * 60
        break
      default:
        totalTime = 25 * 60 // Fallback
    }

    // Prevent division by zero
    if (totalTime <= 0) totalTime = 1

    return ((totalTime - timeLeft) / totalTime) * 100
  }

  const toggleSoundEnabled = () => {
    setSettings((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }))
  }

  const toggleDarkMode = () => {
    // This function is no longer used as the theme is managed by next-themes
  }

  // Validate settings input to prevent negative values
  const updateSetting = (key, value) => {
    const numValue = Number.parseInt(value, 10)
    if (isNaN(numValue) || numValue < 1) return

    setSettings((prev) => ({
      ...prev,
      [key]: numValue,
    }))
  }

  return (
    <div
      className={`${isDarkMode ? "bg-zinc-900" : "bg-zinc-100"} ${isDarkMode ? "text-white" : "text-zinc-900"} rounded-xl shadow-2xl overflow-hidden ${compact ? "h-[400px]" : fullscreen ? "h-[700px]" : "h-full min-h-[500px]"}`}
    >
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
            <Clock className="text-red-500" />
            Pomodoro Timer
          </h2>
          <div className="flex gap-2">
            <button
              onClick={toggleSoundEnabled}
              className={`p-2 rounded-full ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-200"} transition-colors`}
              title={settings.soundEnabled ? "Mute" : "Unmute"}
            >
              {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={() => setShowSettings((prev) => !prev)}
              className={`p-2 rounded-full ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-200"} transition-colors`}
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {showSettings ? (
          <div className="flex-1 flex flex-col">
            <h3 className={`font-medium mb-4 ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`}>Timer Settings</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm ${isDarkMode ? "text-zinc-400" : "text-zinc-600"} mb-1`}>
                  Focus Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.focusTime}
                  onChange={(e) => updateSetting("focusTime", e.target.value)}
                  className={`w-full ${isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-300"} border rounded-lg py-2 px-3 ${isDarkMode ? "text-white" : "text-zinc-900"} focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
              </div>
              <div>
                <label className={`block text-sm ${isDarkMode ? "text-zinc-400" : "text-zinc-600"} mb-1`}>
                  Short Break (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.shortBreakTime}
                  onChange={(e) => updateSetting("shortBreakTime", e.target.value)}
                  className={`w-full ${isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-300"} border rounded-lg py-2 px-3 ${isDarkMode ? "text-white" : "text-zinc-900"} focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
              </div>
              <div>
                <label className={`block text-sm ${isDarkMode ? "text-zinc-400" : "text-zinc-600"} mb-1`}>
                  Long Break (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.longBreakTime}
                  onChange={(e) => updateSetting("longBreakTime", e.target.value)}
                  className={`w-full ${isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-300"} border rounded-lg py-2 px-3 ${isDarkMode ? "text-white" : "text-zinc-900"} focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
              </div>
              <div>
                <label className={`block text-sm ${isDarkMode ? "text-zinc-400" : "text-zinc-600"} mb-1`}>
                  Long Break After (pomodoros)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.longBreakInterval}
                  onChange={(e) => updateSetting("longBreakInterval", e.target.value)}
                  className={`w-full ${isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-300"} border rounded-lg py-2 px-3 ${isDarkMode ? "text-white" : "text-zinc-900"} focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoStartBreaks"
                  checked={settings.autoStartBreaks}
                  onChange={() => setSettings({ ...settings, autoStartBreaks: !settings.autoStartBreaks })}
                  className="mr-2"
                />
                <label
                  htmlFor="autoStartBreaks"
                  className={`text-sm ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`}
                >
                  Auto-start breaks
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoStartPomodoros"
                  checked={settings.autoStartPomodoros}
                  onChange={() => setSettings({ ...settings, autoStartPomodoros: !settings.autoStartPomodoros })}
                  className="mr-2"
                />
                <label
                  htmlFor="autoStartPomodoros"
                  className={`text-sm ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`}
                >
                  Auto-start pomodoros
                </label>
              </div>
            </div>

            <div className="mt-auto">
              <button
                onClick={() => setShowSettings(false)}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors w-full"
              >
                Save Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative mb-8">
              <svg className="w-64 h-64">
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke={isDarkMode ? "#27272a" : "#e4e4e7"}
                  strokeWidth="4"
                  transform="translate(32, 32) scale(3.5) translate(-32, -32)"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke={mode === "focus" ? "#ef4444" : "#10b981"}
                  strokeWidth="4"
                  strokeDasharray="188.5"
                  strokeDashoffset={188.5 - (188.5 * getProgressPercent()) / 100}
                  transform="translate(32, 32) scale(3.5) translate(-32, -32) rotate(-90, 32, 32)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-5xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className={`text-lg font-medium ${mode === "focus" ? "text-red-500" : "text-green-500"}`}>
                  {mode === "focus" ? "Focus" : mode === "shortBreak" ? "Short Break" : "Long Break"}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button
                onClick={handleToggleTimer}
                className={`${mode === "focus" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white p-4 rounded-full transition-colors`}
              >
                {isRunning ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button
                onClick={skipToNext}
                className={`${isDarkMode ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-200 hover:bg-zinc-300"} ${isDarkMode ? "text-white" : "text-zinc-900"} p-4 rounded-full transition-colors`}
                disabled={isRunning}
              >
                <SkipForward size={24} />
              </button>
            </div>

            <div className={`text-center ${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}>
              <p className="mb-1">Completed Pomodoros: {completedPomodoros}</p>
              <p>
                Next long break in: {settings.longBreakInterval - (completedPomodoros % settings.longBreakInterval)}{" "}
                pomodoros
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
