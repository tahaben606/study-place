"use client"

import { useState, useEffect, useCallback } from "react"
import VideoStation from "@/components/video-station"
import NoteBlock from "@/components/note-block"
import PomodoroTimer from "@/components/pomodoro-timer"
import TaskManager from "@/components/task-manager"
import StudyAnalytics from "@/components/study-analytics"
import PopOutWidget from "@/components/pop-out-widget"
import MusicStationWidget from "@/components/music-station-widget"
import { Music, Video, FileText, Clock, CheckSquare, BarChart, X, BookOpen } from "lucide-react"
import VideoQueue from "@/components/video-queue"
import YouTubePlayer from "@/components/youtube-player"

export default function Home() {
  const [savedVideos, setSavedVideos] = useState([])
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

  const handleAddVideo = useCallback(
    (video) => {
      if (!video || !video.id) return

      if (!savedVideos.find((v) => v.id === video.id)) {
        const updatedVideos = [...savedVideos, video]
        setSavedVideos(updatedVideos)
      }
      setActiveVideo(video)
    },
    [savedVideos],
  )

  const handlePlayVideo = useCallback((video) => {
    setActiveVideo(video)
  }, [])

  const handleRemoveVideo = useCallback(
    (videoId) => {
      setSavedVideos((prev) => prev.filter((v) => v.id !== videoId))
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

      if (!videoQueue.find((v) => v.id === video.id)) {
        setVideoQueue((prev) => [...prev, video])
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

  return (
    <div className={`min-h-screen bg-zinc-950 text-white ${focusMode ? "focus-mode" : ""}`}>
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

      <div className="container mx-auto p-4 relative z-50">
        <header className="py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="text-red-500" />
            Study Station
          </h1>
          <p className="text-zinc-400 text-sm hidden md:block">Your all-in-one platform for focused studying</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          {/* Main Video Section - Takes up 8/12 columns on large screens */}
          <div className="lg:col-span-8 space-y-4">
            {/* Video Player */}
            <div className="bg-zinc-900 rounded-xl p-6 shadow-xl">
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
                    <CheckSquare size={16} />
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
                <div className="mb-6">
                  <YouTubePlayer videoId={activeVideo.id} onEnded={handleVideoEnd} />
                  <div className="mt-4">
                    <h3 className="font-bold text-lg">{activeVideo.snippet?.title || "Untitled Video"}</h3>
                    <p className="text-zinc-400 text-sm">{activeVideo.snippet?.channelTitle || "Unknown Channel"}</p>
                  </div>
                </div>
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

              <div className="space-y-4">
                <h3 className="font-medium text-zinc-400">Saved Educational Videos</h3>
                {savedVideos.length === 0 ? (
                  <p className="text-center py-4 text-zinc-600 text-sm">
                    No videos saved yet. Search for educational videos to add to your library.
                  </p>
                ) : (
                  <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {savedVideos.map((video) => (
                      <div
                        key={video.id}
                        className={`flex gap-3 p-2 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors ${activeVideo?.id === video.id ? "bg-zinc-800 border-l-2 border-red-500" : ""}`}
                      >
                        <img
                          src={video.snippet?.thumbnails?.medium?.url || "/placeholder.svg?height=90&width=120"}
                          alt=""
                          className="w-24 h-16 object-cover rounded"
                          onClick={() => handlePlayVideo(video)}
                        />
                        <div className="flex-1 min-w-0" onClick={() => handlePlayVideo(video)}>
                          <h4 className="font-medium text-sm line-clamp-2">{video.snippet?.title || "Untitled"}</h4>
                          <p className="text-zinc-400 text-xs">{video.snippet?.channelTitle || "Unknown"}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            className="text-zinc-400 hover:text-green-500 p-1 rounded-full hover:bg-zinc-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToQueue(video)
                            }}
                            title="Add to queue"
                          >
                            <CheckSquare size={16} />
                          </button>
                          <button
                            className="text-zinc-400 hover:text-red-500 p-1 rounded-full hover:bg-zinc-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveVideo(video.id)
                            }}
                            title="Remove video"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Video Search */}
            <div className="bg-zinc-900 rounded-xl p-6 shadow-xl">
              <VideoStation onAddVideo={handleAddVideo} onAddToQueue={handleAddToQueue} educationalFocus={true} />
            </div>
          </div>

          {/* Widgets Section - Takes up 4/12 columns on large screens */}
          <div className="lg:col-span-4">
            {/* Widget Grid */}
            <div className="widget-grid pl-12">
              {/* Music Widget */}
              <PopOutWidget
                title="Study Music"
                icon={<Music size={24} className="text-green-500" />}
                color="bg-green-900/30"
              >
                <div className="h-[450px]">
                  <MusicStationWidget focusMusic={true} />
                </div>
              </PopOutWidget>

              {/* Pomodoro Widget */}
              <PopOutWidget
                title="Pomodoro Timer"
                icon={<Clock size={24} className="text-red-500" />}
                color="bg-red-900/30"
              >
                <div className="h-[450px]">
                  <PomodoroTimer onFocusStart={toggleFocusMode} onBreakTime={handleBreakTime} compact={true} />
                </div>
              </PopOutWidget>

              {/* Notes Widget */}
              <PopOutWidget
                title="Study Notes"
                icon={<FileText size={24} className="text-purple-500" />}
                color="bg-purple-900/30"
              >
                <div className="h-[450px]">
                  <NoteBlock compact={true} />
                </div>
              </PopOutWidget>

              {/* Tasks Widget */}
              <PopOutWidget
                title="Task Manager"
                icon={<CheckSquare size={24} className="text-blue-500" />}
                color="bg-blue-900/30"
              >
                <div className="h-[450px]">
                  <TaskManager onTaskComplete={handleTaskComplete} compact={true} />
                </div>
              </PopOutWidget>

              {/* Analytics Widget */}
              <PopOutWidget
                title="Study Analytics"
                icon={<BarChart size={24} className="text-indigo-500" />}
                color="bg-indigo-900/30"
              >
                <div className="h-[450px]">
                  <StudyAnalytics data={studyData} />
                </div>
              </PopOutWidget>

              {/* Resources Widget */}
              <PopOutWidget
                title="Study Resources"
                icon={<BookOpen size={24} className="text-amber-500" />}
                color="bg-amber-900/30"
              >
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
                  </ul>
                </div>
              </PopOutWidget>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
