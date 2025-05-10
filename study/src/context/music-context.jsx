    "use client"

import { createContext, useContext, useState, useEffect, useRef } from "react"
import YouTube from "react-youtube"

// Create context
const MusicContext = createContext(null)

// Provider component
export function MusicProvider({ children }) {
  const [track, setTrack] = useState(null)
  const [youtubeId, setYoutubeId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const playerRef = useRef(null)

  // Update progress
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        const current = playerRef.current.getCurrentTime()
        const total = playerRef.current.getDuration()
        setProgress((current / total) * 100)
        setDuration(total)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying])

  // Sync volume with YouTube player
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === "function") {
      playerRef.current.setVolume(volume)
    }
  }, [volume])

  // Sync mute toggle
  useEffect(() => {
    if (playerRef.current) {
      if (muted) {
        playerRef.current.mute()
      } else {
        playerRef.current.unMute()
      }
    }
  }, [muted])

  const playTrack = (newTrack, newYoutubeId) => {
    setTrack(newTrack)
    setYoutubeId(newYoutubeId)
  }

  const togglePlay = () => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
      setIsPlaying(false)
    } else {
      playerRef.current.playVideo()
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    setMuted((prev) => !prev)
  }

  const handleVolumeChange = (newVolume) => {
    const vol = Number.parseInt(newVolume)
    setVolume(vol)
    if (vol === 0) {
      setMuted(true)
    } else if (muted) {
      setMuted(false)
    }
  }

  const handleSeek = (newProgress) => {
    const newTime = (newProgress / 100) * duration
    playerRef.current.seekTo(newTime, true)
    setProgress(newProgress)
  }

  const onPlayerReady = (event) => {
    playerRef.current = event.target
    setDuration(event.target.getDuration())
    playerRef.current.playVideo()
    setIsPlaying(true)

    // Set initial volume
    playerRef.current.setVolume(volume)
    if (muted) {
      playerRef.current.mute()
    }
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0")
    return `${m}:${s}`
  }

  return (
    <MusicContext.Provider
      value={{
        track,
        isPlaying,
        volume,
        muted,
        progress,
        duration,
        playTrack,
        togglePlay,
        toggleMute,
        handleVolumeChange,
        handleSeek,
        formatTime,
      }}
    >
      {children}
      {youtubeId && (
        <YouTube
          videoId={youtubeId}
          opts={{
            height: "0",
            width: "0",
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              rel: 0,
            },
          }}
          onReady={onPlayerReady}
          className="hidden"
        />
      )}
    </MusicContext.Provider>
  )
}

// Custom hook to use the music context
export function useMusic() {
  const context = useContext(MusicContext)
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider")
  }
  return context
}
