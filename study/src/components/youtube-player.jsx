"use client"

import { useEffect, useRef, useState } from "react"

export default function YouTubePlayer({
  videoId,
  onEnded,
  onPlay,
  onPause,
  onReady,
  autoplay = true,
  controls = true,
  modestbranding = true,
  className = "",
  theme = "dark"
}) {
  const playerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const loadingTimeoutRef = useRef(null)

  // Load YouTube IFrame API
  useEffect(() => {
    // Skip if already loaded or loading
    if (window.YT || document.getElementById("youtube-api-script")) {
      return
    }

    // Create script element
    const tag = document.createElement("script")
    tag.id = "youtube-api-script"
    tag.src = "https://www.youtube.com/iframe_api"

    // Set up error handling
    tag.onerror = () => {
      console.error("Failed to load YouTube IFrame API")
      setHasError(true)
    }

    // Insert script before first script tag
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

    // Set timeout for API loading
    loadingTimeoutRef.current = setTimeout(() => {
      if (!window.YT) {
        console.error("YouTube API failed to load within timeout")
        setHasError(true)
      }
    }, 10000) // 10 second timeout

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  // Initialize player once API is loaded
  useEffect(() => {
    if (!window.YT || !videoId) return

    const onPlayerReady = (event) => {
      setIsReady(true)
      if (typeof onReady === "function") {
        onReady(event)
      }
    }

    const onPlayerStateChange = (event) => {
      switch (event.data) {
        case window.YT.PlayerState.ENDED:
          if (typeof onEnded === "function") onEnded()
          break
        case window.YT.PlayerState.PLAYING:
          if (typeof onPlay === "function") onPlay()
          break
        case window.YT.PlayerState.PAUSED:
          if (typeof onPause === "function") onPause()
          break
      }
    }

    if (playerRef.current) {
      // Player already exists, just change the video
      playerRef.current.loadVideoById(videoId)
      return
    }

    // Create new player instance
    playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
      videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: controls ? 1 : 0,
        modestbranding: modestbranding ? 1 : 0,
        rel: 0,
        color: theme === "dark" ? "white" : "red",
        disablekb: 0,
        fs: 1,
        iv_load_policy: 3,
        playsinline: 1
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: (error) => {
          console.error("YouTube Player Error:", error)
          setHasError(true)
        }
      }
    })

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [videoId, onEnded, onPlay, onPause, onReady, autoplay, controls, modestbranding, theme])

  // Expose player methods
  useEffect(() => {
    if (window.YT && playerRef.current) {
      window.youtubePlayer = playerRef.current
    }
    return () => {
      window.youtubePlayer = null
    }
  }, [isReady])

  if (hasError) {
    return (
      <div className={`aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center ${className}`}>
        <div className="text-white text-center p-4">
          <p>Failed to load YouTube player</p>
          <p className="text-sm text-gray-400 mt-2">
            Please refresh the page or try again later
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`aspect-video rounded-lg overflow-hidden bg-black ${className}`}>
      <div
        id={`youtube-player-${videoId}`}
        className="w-full h-full"
        aria-label="YouTube video player"
      />

      {!isReady && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      )}
    </div>
  )
}