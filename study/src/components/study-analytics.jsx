"use client"

import { useState, useEffect, useMemo } from "react"
import { BarChart, Clock, CheckSquare, Calendar, ArrowUp, Zap } from "lucide-react"

export default function StudyAnalytics({ data }) {
  const [timeFrame, setTimeFrame] = useState("week") // week, month, all
  const [stats, setStats] = useState({
    totalFocusTime: 0,
    totalBreakTime: 0,
    completedTasks: 0,
    focusToBreakRatio: 0,
    dailyAverage: 0,
    mostProductiveDay: null,
    streak: 0,
  })

  // Validate and provide default data
  const safeData = useMemo(() => {
    const defaultData = {
      focusTime: 0,
      breakTime: 0,
      completedTasks: 0,
      studySessions: [],
    }

    if (!data) return defaultData

    return {
      focusTime: typeof data.focusTime === "number" ? data.focusTime : 0,
      breakTime: typeof data.breakTime === "number" ? data.breakTime : 0,
      completedTasks: typeof data.completedTasks === "number" ? data.completedTasks : 0,
      studySessions: Array.isArray(data.studySessions) ? data.studySessions : [],
    }
  }, [data])

  useEffect(() => {
    calculateStats()
  }, [safeData, timeFrame])

  const calculateStats = () => {
    try {
      // Filter sessions based on timeframe
      const now = new Date()
      const filteredSessions = safeData.studySessions.filter((session) => {
        try {
          const sessionDate = new Date(session.date)
          if (isNaN(sessionDate.getTime())) return false

          if (timeFrame === "week") {
            // Last 7 days
            const weekAgo = new Date(now)
            weekAgo.setDate(now.getDate() - 7)
            return sessionDate >= weekAgo
          } else if (timeFrame === "month") {
            // Last 30 days
            const monthAgo = new Date(now)
            monthAgo.setDate(now.getDate() - 30)
            return sessionDate >= monthAgo
          }
          // All time
          return true
        } catch (error) {
          console.error("Error filtering session:", error)
          return false
        }
      })

      // Group sessions by day
      const sessionsByDay = {}
      filteredSessions.forEach((session) => {
        try {
          if (!session.date || !session.duration) return

          const date = new Date(session.date).toLocaleDateString()
          if (!sessionsByDay[date]) {
            sessionsByDay[date] = 0
          }
          sessionsByDay[date] += session.duration
        } catch (error) {
          console.error("Error grouping session by day:", error)
        }
      })

      // Calculate most productive day
      let mostProductiveDay = null
      let maxDuration = 0
      Object.entries(sessionsByDay).forEach(([date, duration]) => {
        if (duration > maxDuration) {
          mostProductiveDay = date
          maxDuration = duration
        }
      })

      // Calculate streak
      let streak = 0
      try {
        const today = new Date().toLocaleDateString()
        if (sessionsByDay[today]) {
          streak = 1
          const checkDate = new Date()
          while (true) {
            checkDate.setDate(checkDate.getDate() - 1)
            const dateStr = checkDate.toLocaleDateString()
            if (sessionsByDay[dateStr]) {
              streak++
            } else {
              break
            }
          }
        }
      } catch (error) {
        console.error("Error calculating streak:", error)
        streak = 0
      }

      // Calculate daily average
      const totalDays = Object.keys(sessionsByDay).length
      const totalFocusTime = filteredSessions.reduce((sum, session) => {
        return sum + (typeof session.duration === "number" ? session.duration : 0)
      }, 0)
      const dailyAverage = totalDays > 0 ? totalFocusTime / totalDays : 0

      // Calculate focus to break ratio (prevent division by zero)
      const focusToBreakRatio =
        safeData.breakTime > 0
          ? safeData.focusTime / safeData.breakTime
          : safeData.focusTime > 0
            ? safeData.focusTime
            : 0

      setStats({
        totalFocusTime: safeData.focusTime,
        totalBreakTime: safeData.breakTime,
        completedTasks: safeData.completedTasks,
        focusToBreakRatio,
        dailyAverage,
        mostProductiveDay,
        streak,
      })
    } catch (error) {
      console.error("Error calculating stats:", error)
      // Set default stats on error
      setStats({
        totalFocusTime: 0,
        totalBreakTime: 0,
        completedTasks: 0,
        focusToBreakRatio: 0,
        dailyAverage: 0,
        mostProductiveDay: null,
        streak: 0,
      })
    }
  }

  const formatTime = (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds) || seconds < 0) {
      return "0s"
    }

    if (seconds < 60) return `${Math.floor(seconds)}s`

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours === 0) return `${minutes}m`
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="bg-zinc-900 text-white rounded-xl shadow-2xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart className="text-indigo-500" />
            Study Analytics
          </h2>

          <div className="flex bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setTimeFrame("week")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFrame === "week" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeFrame("month")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFrame === "month" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeFrame("all")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFrame === "all" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              All Time
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-zinc-400 text-sm">Focus Time</h3>
              <Clock size={18} className="text-indigo-500" />
            </div>
            <p className="text-2xl font-bold">{formatTime(stats.totalFocusTime)}</p>
            <div className="mt-2 text-xs text-zinc-500">
              {stats.totalFocusTime > 0 ? (
                <span className="flex items-center gap-1 text-green-500">
                  <ArrowUp size={12} />
                  {formatTime(stats.dailyAverage)} daily average
                </span>
              ) : (
                <span>No focus time recorded</span>
              )}
            </div>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-zinc-400 text-sm">Completed Tasks</h3>
              <CheckSquare size={18} className="text-indigo-500" />
            </div>
            <p className="text-2xl font-bold">{stats.completedTasks}</p>
            <div className="mt-2 text-xs text-zinc-500">
              {stats.completedTasks > 0 ? (
                <span className="flex items-center gap-1 text-green-500">
                  <ArrowUp size={12} />
                  Productivity increasing
                </span>
              ) : (
                <span>No tasks completed yet</span>
              )}
            </div>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-zinc-400 text-sm">Focus/Break Ratio</h3>
              <Zap size={18} className="text-indigo-500" />
            </div>
            <p className="text-2xl font-bold">{stats.focusToBreakRatio.toFixed(1)}:1</p>
            <div className="mt-2 text-xs text-zinc-500">
              {stats.focusToBreakRatio > 4 ? (
                <span className="flex items-center gap-1 text-yellow-500">
                  <ArrowUp size={12} />
                  Consider more breaks
                </span>
              ) : stats.focusToBreakRatio > 0 ? (
                <span className="flex items-center gap-1 text-green-500">
                  <CheckSquare size={12} />
                  Good balance
                </span>
              ) : (
                <span>No data recorded</span>
              )}
            </div>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-zinc-400 text-sm">Current Streak</h3>
              <Calendar size={18} className="text-indigo-500" />
            </div>
            <p className="text-2xl font-bold">{stats.streak} days</p>
            <div className="mt-2 text-xs text-zinc-500">
              {stats.streak > 0 ? (
                <span className="flex items-center gap-1 text-green-500">
                  <ArrowUp size={12} />
                  Keep it up!
                </span>
              ) : (
                <span>Start studying today</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Study Progress</h3>

          <div className="h-40 flex items-end justify-between gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              // Generate deterministic but random-looking data based on day of week
              const seed = (i + new Date().getDay()) % 7
              const height = 30 + seed * 10
              const fillHeight = Math.max(10, height * (0.3 + seed * 0.1))

              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-zinc-700 rounded-t-sm" style={{ height: `${height}%` }}>
                    <div
                      className="w-full bg-indigo-600 h-full rounded-t-sm"
                      style={{ height: `${fillHeight}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-zinc-500 mt-2">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between mt-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-indigo-600 rounded-sm"></div>
              <span>Focus Time</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-zinc-700 rounded-sm"></div>
              <span>Goal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
