"use client"

import { useState, useRef, useEffect } from "react"
import { X, Trash2, Shuffle, Repeat, ChevronUp, GripVertical, Play } from "lucide-react"

export default function VideoQueue({
  queue = [],
  onRemove,
  onPlay,
  onClear,
  onReorder,
  onPlayNext,
  isVisible = false,
  onToggleVisibility,
  activeVideoId,
  repeat = false,
  onToggleRepeat,
  shuffle = false,
  onToggleShuffle,
  theme = "dark",
}) {
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [focusedIndex, setFocusedIndex] = useState(null)
  const queueRef = useRef(null)

  const handleDragStart = (index) => {
    setDraggingIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggingIndex === null) return
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = () => {
    if (draggingIndex === null || dragOverIndex === null || draggingIndex === dragOverIndex) {
      resetDragState()
      return
    }

    const newQueue = [...queue]
    const draggedItem = newQueue[draggingIndex]
    newQueue.splice(draggingIndex, 1)
    newQueue.splice(dragOverIndex, 0, draggedItem)

    onReorder(newQueue)
    resetDragState()
  }

  const handleDragEnd = () => {
    resetDragState()
  }

  const resetDragState = () => {
    setDraggingIndex(null)
    setDragOverIndex(null)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible) return

      switch (e.key) {
        case "Escape":
          onToggleVisibility()
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusedIndex(prev => (prev === null || prev <= 0 ? queue.length - 1 : prev - 1))
          break
        case "ArrowDown":
          e.preventDefault()
          setFocusedIndex(prev => (prev === null || prev >= queue.length - 1 ? 0 : prev + 1))
          break
        case "Enter":
          if (focusedIndex !== null && queue[focusedIndex]) {
            onPlay(queue[focusedIndex])
          }
          break
        case "Delete":
          if (focusedIndex !== null && queue[focusedIndex]) {
            onRemove(queue[focusedIndex].id)
            setFocusedIndex(prev => (prev >= queue.length - 1 ? queue.length - 2 : prev))
          }
          break
        case " ":
          if (focusedIndex === 0 && queue.length > 0) {
            onPlayNext()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isVisible, onToggleVisibility, focusedIndex, queue, onPlay, onRemove, onPlayNext])

  // Focus management
  useEffect(() => {
    if (focusedIndex !== null && queueRef.current) {
      const items = queueRef.current.querySelectorAll('[data-queue-item]')
      if (items[focusedIndex]) {
        items[focusedIndex].focus()
      }
    }
  }, [focusedIndex])

  if (!isVisible) return null

  const bgColor = theme === "dark" ? "bg-zinc-800" : "bg-gray-100"
  const textColor = theme === "dark" ? "text-white" : "text-gray-800"
  const secondaryTextColor = theme === "dark" ? "text-zinc-400" : "text-gray-500"
  const hoverBgColor = theme === "dark" ? "hover:bg-zinc-700" : "hover:bg-gray-200"
  const activeBgColor = theme === "dark" ? "bg-zinc-700" : "bg-gray-300"
  const borderColor = theme === "dark" ? "border-zinc-700" : "border-gray-300"

  return (
    <div
      className={`${bgColor} rounded-lg p-4 transition-all duration-300 animate-slide-up shadow-lg ${textColor}`}
      ref={queueRef}
      aria-label="Video queue"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-red-500 flex items-center gap-2">
          Video Queue
          <span className={`${theme === "dark" ? "bg-zinc-700" : "bg-gray-200"} text-xs px-2 py-0.5 rounded-full`}>
            {queue.length}
          </span>
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleShuffle}
            className={`p-1 ${secondaryTextColor} hover:text-red-500 rounded-full transition-colors ${shuffle ? "text-red-500" : ""}`}
            title={shuffle ? "Shuffle on" : "Shuffle off"}
            aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
          >
            <Shuffle size={16} />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-1 ${secondaryTextColor} hover:text-red-500 rounded-full transition-colors ${repeat ? "text-red-500" : ""}`}
            title={repeat ? "Repeat queue" : "Don't repeat"}
            aria-label={repeat ? "Disable repeat" : "Enable repeat"}
          >
            <Repeat size={16} />
          </button>

          <button
            onClick={onClear}
            className={`p-1 ${secondaryTextColor} hover:text-red-500 rounded-full ${hoverBgColor} transition-colors`}
            disabled={queue.length === 0}
            title="Clear queue"
            aria-label="Clear queue"
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={onToggleVisibility}
            className={`p-1 ${secondaryTextColor} hover:text-white rounded-full ${hoverBgColor} transition-colors`}
            title="Hide queue"
            aria-label="Hide queue"
          >
            <ChevronUp size={16} />
          </button>
        </div>
      </div>

      {queue.length === 0 ? (
        <p className={`text-center py-4 ${secondaryTextColor} text-sm`}>
          Queue is empty. Add videos by clicking the "Add to Queue" button.
        </p>
      ) : (
        <ul className="grid gap-2 max-h-[300px] overflow-y-auto pr-2" aria-label="Queue items">
          {queue.map((video, index) => (
            <li
              key={`queue-${video.id}-${index}`}
              data-queue-item
              tabIndex={0}
              className={`flex gap-2 p-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 ${draggingIndex === index
                  ? `${activeBgColor} opacity-70`
                  : dragOverIndex === index
                    ? "border-t-2 border-red-500"
                    : activeVideoId === video.id
                      ? `${activeBgColor} border-l-2 border-red-500`
                      : `${bgColor} ${hoverBgColor}`
                } transition-colors`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onClick={() => onPlay(video)}
              onKeyDown={(e) => {
                if (e.key === " ") {
                  e.preventDefault()
                  onPlay(video)
                }
              }}
              aria-label={`Queue item ${index + 1}: ${video.snippet?.title || "Untitled video"}`}
            >
              <div
                className={`${secondaryTextColor} cursor-move flex items-center justify-center hover:text-white`}
                title="Drag to reorder"
                aria-hidden="true"
              >
                <GripVertical size={16} />
              </div>

              <div className={`${secondaryTextColor} font-mono text-sm flex items-center justify-center w-6`}>
                {index + 1}
              </div>

              <img
                src={video.snippet?.thumbnails?.medium?.url || "/placeholder.svg?height=90&width=120"}
                alt=""
                className="w-20 h-12 object-cover rounded"
                aria-hidden="true"
              />

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1">{video.snippet?.title || "Untitled"}</h4>
                <p className={`${secondaryTextColor} text-xs`}>{video.snippet?.channelTitle || "Unknown"}</p>
              </div>

              <button
                className={`${secondaryTextColor} hover:text-red-500 self-center p-1`}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(video.id)
                }}
                title="Remove from queue"
                aria-label={`Remove ${video.snippet?.title || "video"} from queue`}
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {queue.length > 0 && (
        <div className="mt-3 flex justify-between items-center">
          <button
            onClick={onPlayNext}
            className="bg-red-600 hover:bg-red-700 text-sm text-white py-1 px-4 rounded-lg transition-colors flex items-center gap-1"
            aria-label="Play next video in queue"
          >
            <Play size={14} />
            Play Next
          </button>
          <p className={`text-xs ${secondaryTextColor}`}>
            {queue.length} video{queue.length !== 1 ? "s" : ""} in queue
          </p>
        </div>
      )}
    </div>
  )
}