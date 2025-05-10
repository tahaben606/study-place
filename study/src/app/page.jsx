"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import VideoStation from "../components/video-station"
import NoteBlock from "../components/note-block"
import PomodoroTimer from "../components/pomodoro-timer"
import TaskManager from "../components/task-manager"
import StudyAnalytics from "../components/study-analytics"
import MusicStationWidget from "../components/music-station-widget"
import { MusicProvider } from "../context/music-context"
import MiniTimer from "../components/mini-timer"
import {
  Music,
  Video,
  FileText,
  Clock,
  CheckSquare,
  BarChart,
  X,
  BookOpen,
  Play,
  Trash2,
  Plus,
  ListChecks,
  Sun,
  Moon,
} from "lucide-react"
import VideoQueue from "../components/video-queue"
import YouTubePlayer from "../components/youtube-player"
import { useTheme } from "next-themes"
// Add the KeyboardShortcuts component import at the top
import KeyboardShortcuts from "../components/keyboard-shortcut"

// Helper to normalize video object
function normalizeVideo(video) {
  return {
    id: video.id?.videoId || video.id,
    snippet: video.snippet,
    statistics: video.statistics || { viewCount: "0" },
  }
}

export default function Home() {
  const [savedVideos, setSavedVideos] = useState([])
  const [savedShorts, setSavedShorts] = useState([])
  const [activeVideo, setActiveVideo] = useState(null)
  const [videoQueue, setVideoQueue] = useState([])
  const [showQueue, setShowQueue] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [studyTime, setStudyTime] = useState(0)
  const [studyData, setStudyData] = useState({
    focusTime: 0,
    breakTime: 0,
    completedTasks: 0,
    studySessions: [],
  })

  const [queueRepeat, setQueueRepeat] = useState(false)
  const [queueShuffle, setQueueShuffle] = useState(false)

  // Timer state
  const [timerActive, setTimerActive] = useState(false)
  const [timerState, setTimerState] = useState({
    timeLeft: 25 * 60,
    isRunning: false,
    mode: "focus",
    toggleTimer: () => { }, // Initialize with empty function
  })
  const [showMiniTimer, setShowMiniTimer] = useState(false)

  const [activeWidget, setActiveWidget] = useState(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const videoPlayerRef = useRef(null)

  // Load saved data from localStorage with error handling
  useEffect(() => {
    try {
      const savedVideosStr = localStorage.getItem("savedVideos")
      if (savedVideosStr) {
        const parsed = JSON.parse(savedVideosStr)
        if (Array.isArray(parsed)) {
          setSavedVideos(parsed)
        }
      }

      const savedShortsStr = localStorage.getItem("savedShorts")
      if (savedShortsStr) {
        const parsed = JSON.parse(savedShortsStr)
        if (Array.isArray(parsed)) {
          setSavedShorts(parsed)
        }
      }

      const studyDataStr = localStorage.getItem("studyData")
      if (studyDataStr) {
        const parsed = JSON.parse(studyDataStr)
        setStudyData({
          focusTime: typeof parsed.focusTime === "number" ? parsed.focusTime : 0,
          breakTime: typeof parsed.breakTime === "number" ? parsed.breakTime : 0,
          completedTasks: typeof parsed.completedTasks === "number" ? parsed.completedTasks : 0,
          studySessions: Array.isArray(parsed.studySessions) ? parsed.studySessions : [],
        })
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
    }
  }, [])

  // Save data to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("savedVideos", JSON.stringify(savedVideos))
    } catch (error) {
      console.error("Error saving videos to localStorage:", error)
    }
  }, [savedVideos])

  useEffect(() => {
    try {
      localStorage.setItem("savedShorts", JSON.stringify(savedShorts))
    } catch (error) {
      console.error("Error saving shorts to localStorage:", error)
    }
  }, [savedShorts])

  useEffect(() => {
    try {
      localStorage.setItem("studyData", JSON.stringify(studyData))
    } catch (error) {
      console.error("Error saving study data to localStorage:", error)
    }
  }, [studyData])

  // Track study time
  useEffect(() => {
    let interval
    if (focusMode) {
      interval = setInterval(() => {
        setStudyTime((prev) => prev + 1)
        setStudyData((prev) => ({
          ...prev,
          focusTime: prev.focusTime + 1,
        }))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [focusMode])

  // Add this function after the handleBreakTime function
  const requestNotificationPermission = useCallback(() => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification")
      return
    }

    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission()
    }
  }, [])

  // Add this useEffect to request notification permission when the app loads
  useEffect(() => {
    requestNotificationPermission()
  }, [requestNotificationPermission])

  // Add this function to show notifications when timer completes
  const showTimerNotification = useCallback((mode) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return
    }

    try {
      const title =
        mode === "focus"
          ? "Focus Time Complete!"
          : mode === "shortBreak"
            ? "Short Break Complete!"
            : "Long Break Complete!"

      const body = mode === "focus" ? "Time for a break!" : "Time to get back to work!"

      new Notification(title, {
        body,
        icon: "/favicon.ico",
      })
    } catch (error) {
      console.error("Error showing notification:", error)
    }
  }, [])

  // Handle timer updates from PomodoroTimer component
  const handleTimerUpdate = useCallback(
    (timerData) => {
      // Check if timer just completed (previous state was running, current is not, and time is 0)
      const timerJustCompleted = timerState.isRunning && !timerData.isRunning && timerData.timeLeft === 0

      if (timerJustCompleted) {
        showTimerNotification(timerData.mode)
      }

      // Update timer state with the new data
      setTimerState((prev) => ({
        ...prev,
        ...timerData,
        toggleTimer: timerData.toggleTimer || prev.toggleTimer, // Preserve toggleTimer if not provided
      }))

      // Show mini timer if timer is running
      if (timerData.isRunning && !showMiniTimer) {
        setShowMiniTimer(true)
      }

      // Set timer active state
      setTimerActive(timerData.isRunning)
    },
    [showMiniTimer, timerState.isRunning, showTimerNotification],
  )

  // Toggle mini timer visibility
  const toggleMiniTimer = useCallback(() => {
    setShowMiniTimer((prev) => !prev)
  }, [])

  const handleAddVideo = useCallback(
    (video, isShort = false) => {
      if (!video || !video.id) return
      const norm = normalizeVideo(video)
      if (isShort) {
        if (!savedShorts.find((v) => v.id === norm.id)) {
          const updatedShorts = [...savedShorts, norm]
          setSavedShorts(updatedShorts)
        }
      } else {
        if (!savedVideos.find((v) => v.id === norm.id)) {
          const updatedVideos = [...savedVideos, norm]
          setSavedVideos(updatedVideos)
        }
      }
      setActiveVideo(norm)
    },
    [savedVideos, savedShorts],
  )

  const handlePlayVideo = useCallback((video) => {
    setActiveVideo(normalizeVideo(video))
    if (videoPlayerRef.current) {
      videoPlayerRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [])

  const handleRemoveVideo = useCallback(
    (videoId, isShort = false) => {
      if (isShort) {
        setSavedShorts((prev) => prev.filter((v) => v.id !== videoId))
      } else {
        setSavedVideos((prev) => prev.filter((v) => v.id !== videoId))
      }

      if (activeVideo && activeVideo.id === videoId) {
        setActiveVideo(null)
      }
      setVideoQueue((prev) => prev.filter((v) => v.id !== videoId))
    },
    [activeVideo],
  )

  const handleAddToQueue = useCallback(
    (video) => {
      if (!video || !video.id) return
      const norm = normalizeVideo(video)
      if (!videoQueue.find((v) => v.id === norm.id)) {
        setVideoQueue((prev) => [...prev, norm])
      }
    },
    [videoQueue],
  )

  const handleRemoveFromQueue = useCallback((videoId) => {
    setVideoQueue((prev) => prev.filter((v) => v.id !== videoId))
  }, [])

  const handleReorderQueue = useCallback((newQueue) => {
    setVideoQueue(newQueue)
  }, [])

  const toggleQueueRepeat = useCallback(() => {
    setQueueRepeat((prev) => !prev)
  }, [])

  const toggleQueueShuffle = useCallback(() => {
    setQueueShuffle((prev) => {
      if (!prev && videoQueue.length > 1) {
        // Shuffle the queue when turning shuffle on
        const shuffled = [...videoQueue]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        setVideoQueue(shuffled)
      }
      return !prev
    })
  }, [videoQueue])

  const handlePlayNext = useCallback(() => {
    if (videoQueue.length > 0) {
      const nextVideo = videoQueue[0]
      const remainingQueue = videoQueue.slice(1)

      if (queueRepeat && remainingQueue.length === 0) {
        // If repeating and this is the last video, move all videos back to queue
        setVideoQueue(savedVideos.filter((v) => v.id !== nextVideo.id))
      } else {
        setVideoQueue(remainingQueue)
      }

      setActiveVideo(nextVideo)
    }
  }, [videoQueue, queueRepeat, savedVideos])

  const handleVideoEnd = useCallback(() => {
    if (videoQueue.length > 0) {
      handlePlayNext()
    } else if (queueRepeat && savedVideos.length > 0) {
      // If repeating and no queue, start playing from saved videos
      const videosToQueue = savedVideos.filter((v) => v.id !== activeVideo?.id)
      if (videosToQueue.length > 0) {
        if (queueShuffle) {
          // Get a random video
          const randomIndex = Math.floor(Math.random() * videosToQueue.length)
          setActiveVideo(videosToQueue[randomIndex])
        } else {
          // Get the next video in saved list
          const currentIndex = savedVideos.findIndex((v) => v.id === activeVideo?.id)
          const nextIndex = (currentIndex + 1) % savedVideos.length
          setActiveVideo(savedVideos[nextIndex])
        }
      }
    }
  }, [videoQueue, handlePlayNext, queueRepeat, queueShuffle, savedVideos, activeVideo])

  const toggleQueue = useCallback(() => {
    setShowQueue((prev) => !prev)
  }, [])

  // Add a function to handle play/pause for the active video
  // Add this after the toggleQueue function
  const handlePlayPause = useCallback(() => {
    if (activeVideo) {
      // This would need to be implemented in the YouTubePlayer component
      // For now, we'll just log it
      console.log("Play/Pause toggled via keyboard shortcut")
    }
  }, [activeVideo])

  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const newMode = !prev

      // Record study session if turning off focus mode
      if (prev && studyTime > 0) {
        setStudyData((prevData) => ({
          ...prevData,
          studySessions: [
            ...prevData.studySessions,
            {
              date: new Date().toISOString(),
              duration: studyTime,
            },
          ],
        }))
        setStudyTime(0)
      }

      return newMode
    })
  }, [studyTime])

  const handleTaskComplete = useCallback(() => {
    setStudyData((prev) => ({
      ...prev,
      completedTasks: prev.completedTasks + 1,
    }))
  }, [])

  const handleBreakTime = useCallback((minutes) => {
    if (typeof minutes !== "number" || minutes <= 0) return

    setStudyData((prev) => ({
      ...prev,
      breakTime: prev.breakTime + minutes * 60,
    }))
  }, [])

  // Function to convert a regular video to a short
  const convertToShort = useCallback(
    (video) => {
      handleRemoveVideo(video.id)
      handleAddVideo(video, true)
    },
    [handleRemoveVideo, handleAddVideo],
  )

  // Function to convert a short to a regular video
  const convertToRegular = useCallback(
    (video) => {
      handleRemoveVideo(video.id, true)
      handleAddVideo(video, false)
    },
    [handleRemoveVideo, handleAddVideo],
  )

  const handleWidgetClick = (widgetName) => {
    setActiveWidget(activeWidget === widgetName ? null : widgetName)
  }

  // Add a function to close the active widget
  const closeWidget = () => {
    setActiveWidget(null)
  }

  // Add keyboard shortcut handling for widget opening
  // Add this useEffect after the other useEffects
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return
      }

      // Widget shortcuts with Alt + number
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case "1":
            e.preventDefault()
            handleWidgetClick("music")
            break
          case "2":
            e.preventDefault()
            handleWidgetClick("timer")
            break
          case "3":
            e.preventDefault()
            handleWidgetClick("notes")
            break
          case "4":
            e.preventDefault()
            handleWidgetClick("tasks")
            break
          case "5":
            e.preventDefault()
            handleWidgetClick("analytics")
            break
          case "6":
            e.preventDefault()
            handleWidgetClick("resources")
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Handle theme mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {focusMode && (
        <div className="fixed inset-0 bg-black/80 z-40 pointer-events-none">
          <button
            onClick={toggleFocusMode}
            className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full pointer-events-auto"
          >
            <X size={24} />
          </button>
        </div>
      )}

      {/* Mini Timer */}
      {showMiniTimer && timerState.isRunning && (
        <MiniTimer
          timeLeft={timerState.timeLeft}
          isRunning={timerState.isRunning}
          mode={timerState.mode}
          onTogglePlay={timerState.toggleTimer}
          onClose={toggleMiniTimer}
        />
      )}

      <div className="container mx-auto p-4 relative z-50">
        <header className="py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="text-red-500" />
            Study Station
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-zinc-400 text-sm hidden md:block">Your all-in-one platform for focused studying</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          {/* Main Video Section - Takes up 8/12 columns on large screens */}
          <div className="lg:col-span-8 space-y-4">
            {/* Video Player */}
            <div className="bg-[#111111] rounded-xl p-6 shadow-xl" ref={videoPlayerRef}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Video className="text-red-500" />
                  Educational Videos
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={toggleQueue}
                    className={`p-2 rounded-lg text-sm flex items-center gap-1 ${showQueue ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
                  >
                    <ListChecks size={16} />
                    Queue {videoQueue.length > 0 && `(${videoQueue.length})`}
                  </button>
                  {activeVideo && (
                    <button
                      onClick={handlePlayNext}
                      className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={videoQueue.length === 0}
                      title="Play next video in queue"
                    >
                      <Video size={16} />
                    </button>
                  )}
                </div>
              </div>

              {activeVideo ? (
                (() => {
                  console.log("Active video:", activeVideo)
                  console.log("Video ID passed to player:", activeVideo?.id)
                  return (
                    <div className="mb-6">
                      <YouTubePlayer videoId={activeVideo.id} onEnded={handleVideoEnd} />
                      <div className="mt-4">
                        <h3 className="font-bold text-lg">{activeVideo.snippet?.title || "Untitled Video"}</h3>
                        <p className="text-zinc-400 text-sm">{activeVideo.snippet?.channelTitle || "Unknown Channel"}</p>
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="text-center py-12 text-zinc-500 aspect-video flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg">
                  <Video size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No video selected</p>
                  <p className="text-sm mt-2">Search for educational videos to get started</p>
                </div>
              )}

              {/* Video Queue */}
              <VideoQueue
                queue={videoQueue}
                onRemove={handleRemoveFromQueue}
                onPlay={handlePlayVideo}
                onClear={() => setVideoQueue([])}
                onReorder={handleReorderQueue}
                onPlayNext={handlePlayNext}
                isVisible={showQueue}
                onToggleVisibility={toggleQueue}
                activeVideoId={activeVideo?.id}
                repeat={queueRepeat}
                onToggleRepeat={toggleQueueRepeat}
                shuffle={queueShuffle}
                onToggleShuffle={toggleQueueShuffle}
              />

              {/* Saved Videos - 5 videos stacked vertically */}
              <div className="space-y-4 mt-6">
                <h3 className="font-medium text-zinc-400">Saved Educational Videos</h3>
                {savedVideos.length === 0 ? (
                  <p className="text-center py-4 text-zinc-600 text-sm">
                    No videos saved yet. Search for educational videos to add to your library.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {savedVideos.slice(0, 5).map((video) => (
                      <div
                        key={video.id}
                        className={`flex gap-3 p-3 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors ${activeVideo?.id === video.id ? "bg-zinc-800 border-l-2 border-red-500" : "bg-zinc-800/50"}`}
                      >
                        <img
                          src={video.snippet?.thumbnails?.medium?.url || "/placeholder.svg?height=90&width=120"}
                          alt=""
                          className="w-32 h-20 object-cover rounded"
                          onClick={() => handlePlayVideo(video)}
                        />
                        <div className="flex-1 min-w-0" onClick={() => handlePlayVideo(video)}>
                          <h4 className="font-medium text-sm line-clamp-2">{video.snippet?.title || "Untitled"}</h4>
                          <p className="text-zinc-400 text-xs">{video.snippet?.channelTitle || "Unknown"}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              className="text-zinc-400 hover:text-green-500 text-xs flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePlayVideo(video)
                              }}
                            >
                              <Play size={14} /> Play
                            </button>
                            <button
                              className="text-zinc-400 hover:text-blue-500 text-xs flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToQueue(video)
                              }}
                            >
                              <Plus size={14} /> Queue
                            </button>
                            <button
                              className="text-zinc-400 hover:text-yellow-500 text-xs flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                convertToShort(video)
                              }}
                            >
                              <Video size={14} /> To Short
                            </button>
                          </div>
                        </div>
                        <button
                          className="text-zinc-400 hover:text-red-500 p-1 self-start"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveVideo(video.id)
                          }}
                          title="Remove video"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {savedVideos.length > 5 && (
                      <button className="w-full py-2 text-center text-zinc-400 hover:text-white text-sm bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors">
                        Show {savedVideos.length - 5} more videos
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Shorts - 6 videos side by side */}
              <div className="mt-6">
                <h3 className="font-medium text-zinc-400 mb-3">Educational Shorts</h3>
                {savedShorts.length === 0 ? (
                  <p className="text-center py-4 text-zinc-600 text-sm bg-zinc-800/50 rounded-lg">
                    No shorts saved yet. Convert videos to shorts or add new ones.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {savedShorts.slice(0, 6).map((video) => (
                      <div
                        key={video.id}
                        className={`flex flex-col rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors overflow-hidden ${activeVideo?.id === video.id ? "ring-2 ring-red-500" : "bg-zinc-800/50"}`}
                      >
                        <div className="relative" onClick={() => handlePlayVideo(video)}>
                          <img
                            src={video.snippet?.thumbnails?.high?.url || "/placeholder.svg?height=120&width=120"}
                            alt=""
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                            <Play size={24} className="text-white" />
                          </div>
                        </div>
                        <div className="p-2">
                          <h4 className="text-xs font-medium line-clamp-1">{video.snippet?.title || "Untitled"}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <button
                              className="text-zinc-400 hover:text-blue-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToQueue(video)
                              }}
                              title="Add to queue"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              className="text-zinc-400 hover:text-yellow-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                convertToRegular(video)
                              }}
                              title="Convert to regular video"
                            >
                              <Video size={14} />
                            </button>
                            <button
                              className="text-zinc-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveVideo(video.id, true)
                              }}
                              title="Remove short"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Video Search */}
            <div className="bg-[#111111] rounded-xl p-6 shadow-xl">
              <VideoStation onAddVideo={handleAddVideo} onAddToQueue={handleAddToQueue} educationalFocus={true} onPlay={handlePlayVideo} />
            </div>
          </div>

          {/* Widgets Section - Takes up 4/12 columns on large screens */}
          <div className="lg:col-span-4">
            {/* Theme Toggle and Keyboard Shortcuts */}
            <div className="flex justify-end mb-4 gap-2">
              <KeyboardShortcuts
                onToggleFocusMode={toggleFocusMode}
                onToggleQueue={toggleQueue}
                onPlayPause={handlePlayPause}
              />
            </div>

            {/* Widget Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Music Widget */}
              <div
                className="widget-music rounded-xl p-6 flex flex-col items-center justify-center text-center aspect-square cursor-pointer hover:opacity-90 transition-all"
                onClick={() => handleWidgetClick("music")}
              >
                <Music size={32} className="text-green-400 mb-3" />
                <h3 className="font-medium">Study Music</h3>
              </div>

              {/* Pomodoro Timer Widget */}
              <div
                className="widget-timer rounded-xl p-6 flex flex-col items-center justify-center text-center aspect-square cursor-pointer hover:opacity-90 transition-all"
                onClick={() => handleWidgetClick("timer")}
              >
                <Clock size={32} className="text-red-400 mb-3" />
                <h3 className="font-medium">Pomodoro Timer</h3>
              </div>

              {/* Notes Widget */}
              <div
                className="widget-notes rounded-xl p-6 flex flex-col items-center justify-center text-center aspect-square cursor-pointer hover:opacity-90 transition-all"
                onClick={() => handleWidgetClick("notes")}
              >
                <FileText size={32} className="text-purple-400 mb-3" />
                <h3 className="font-medium">Study Notes</h3>
              </div>

              {/* Tasks Widget */}
              <div
                className="widget-tasks rounded-xl p-6 flex flex-col items-center justify-center text-center aspect-square cursor-pointer hover:opacity-90 transition-all"
                onClick={() => handleWidgetClick("tasks")}
              >
                <CheckSquare size={32} className="text-blue-400 mb-3" />
                <h3 className="font-medium">Task Manager</h3>
              </div>

              {/* Analytics Widget */}
              <div
                className="widget-analytics rounded-xl p-6 flex flex-col items-center justify-center text-center aspect-square cursor-pointer hover:opacity-90 transition-all"
                onClick={() => handleWidgetClick("analytics")}
              >
                <BarChart size={32} className="text-indigo-400 mb-3" />
                <h3 className="font-medium">Study Analytics</h3>
              </div>

              {/* Resources Widget */}
              <div
                className="widget-resources rounded-xl p-6 flex flex-col items-center justify-center text-center aspect-square cursor-pointer hover:opacity-90 transition-all"
                onClick={() => handleWidgetClick("resources")}
              >
                <BookOpen size={32} className="text-amber-400 mb-3" />
                <h3 className="font-medium">Study Resources</h3>
              </div>
            </div>

            {/* Widget Content Modals */}
            {activeWidget && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-[#111111] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                  <div className="p-4 flex items-center justify-between border-b border-zinc-800">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {activeWidget === "music" && (
                        <>
                          <Music className="text-green-400" /> Study Music
                        </>
                      )}
                      {activeWidget === "timer" && (
                        <>
                          <Clock className="text-red-400" /> Pomodoro Timer
                        </>
                      )}
                      {activeWidget === "notes" && (
                        <>
                          <FileText className="text-purple-400" /> Study Notes
                        </>
                      )}
                      {activeWidget === "tasks" && (
                        <>
                          <CheckSquare className="text-blue-400" /> Task Manager
                        </>
                      )}
                      {activeWidget === "analytics" && (
                        <>
                          <BarChart className="text-indigo-400" /> Study Analytics
                        </>
                      )}
                      {activeWidget === "resources" && (
                        <>
                          <BookOpen className="text-amber-400" /> Study Resources
                        </>
                      )}
                    </h3>
                    <button
                      onClick={closeWidget}
                      className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    {activeWidget === "music" && (
                      <MusicProvider>
                        <MusicStationWidget focusMusic={true} />
                      </MusicProvider>
                    )}
                    {activeWidget === "timer" && (
                      <PomodoroTimer
                        onFocusStart={toggleFocusMode}
                        onBreakTime={handleBreakTime}
                        onTimerUpdate={handleTimerUpdate}
                        initialTime={timerState.timeLeft}
                        initialMode={timerState.mode}
                        initialIsRunning={timerState.isRunning}
                      />
                    )}
                    {activeWidget === "notes" && <NoteBlock />}
                    {activeWidget === "tasks" && <TaskManager onTaskComplete={handleTaskComplete} />}
                    {activeWidget === "analytics" && <StudyAnalytics data={studyData} />}
                    {activeWidget === "resources" && (
                      <div className="widget-content">
                        <h3 className="text-lg font-medium mb-4">Helpful Study Resources</h3>
                        <ul className="space-y-3">
                          <li className="bg-zinc-800 p-3 rounded-lg">
                            <h4 className="font-medium">Khan Academy</h4>
                            <p className="text-sm text-zinc-400">Free courses on various subjects</p>
                            <a
                              href="https://www.khanacademy.org"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-500 text-sm hover:underline"
                            >
                              Visit Website
                            </a>
                          </li>
                          <li className="bg-zinc-800 p-3 rounded-lg">
                            <h4 className="font-medium">Coursera</h4>
                            <p className="text-sm text-zinc-400">Online courses from top universities</p>
                            <a
                              href="https://www.coursera.org"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-500 text-sm hover:underline"
                            >
                              Visit Website
                            </a>
                          </li>
                          <li className="bg-zinc-800 p-3 rounded-lg">
                            <h4 className="font-medium">MIT OpenCourseWare</h4>
                            <p className="text-sm text-zinc-400">Free MIT course materials</p>
                            <a
                              href="https://ocw.mit.edu"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-500 text-sm hover:underline"
                            >
                              Visit Website
                            </a>
                          </li>
                          <li className="bg-zinc-800 p-3 rounded-lg">
                            <h4 className="font-medium">Quizlet</h4>
                            <p className="text-sm text-zinc-400">Flashcards and study tools</p>
                            <a
                              href="https://quizlet.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-500 text-sm hover:underline"
                            >
                              Visit Website
                            </a>
                          </li>
                          <li className="bg-zinc-800 p-3 rounded-lg">
                            <h4 className="font-medium">edX</h4>
                            <p className="text-sm text-zinc-400">Free online courses from universities worldwide</p>
                            <a
                              href="https://www.edx.org"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-500 text-sm hover:underline"
                            >
                              Visit Website
                            </a>
                          </li>
                          <li className="bg-zinc-800 p-3 rounded-lg">
                            <h4 className="font-medium">Project Gutenberg</h4>
                            <p className="text-sm text-zinc-400">Free eBooks library</p>
                            <a
                              href="https://www.gutenberg.org"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-500 text-sm hover:underline"
                            >
                              Visit Website
                            </a>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
