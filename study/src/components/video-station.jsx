"use client"

import React from "react"
console.log('React import:', React)
import { useState, useEffect, useCallback, useRef } from "react"
import axios from "axios"
import {
  Play,
  Search,
  Plus,
  X,
  List,
  BookOpen,
  GraduationCap,
  Clock,
  AlertCircle,
  Video as VideoIcon,
  MoreVertical,
  Loader2
} from "lucide-react"

export default function VideoStation({
  onAddVideo,
  onAddToQueue,
  onPlay,
  educationalFocus = false,
  theme = "dark"
}) {
  const [query, setQuery] = useState("")
  const [videos, setVideos] = useState([])
  const [shorts, setShorts] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchType, setSearchType] = useState("all")
  const [error, setError] = useState("")
  const [showMoreMenu, setShowMoreMenu] = useState(null)
  const searchInputRef = useRef(null)
  const modalRef = useRef(null)
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "AIzaSyBLcEftz_mf0AbsemRGSsGK4HiWbMJCgQ4"
  const [visibleCount, setVisibleCount] = useState(20)

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal()
      }
    }

    if (selectedVideo) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [selectedVideo])

  // Helper to normalize video object
  const normalizeVideo = useCallback((video) => {
    return {
      id: video.id?.videoId || video.id,
      snippet: video.snippet,
      statistics: video.statistics || { viewCount: "0" },
    }
  }, [])

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError("Please enter a search term")
      return
    }

    if (!YOUTUBE_API_KEY) {
      setError("YouTube API key is missing")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      // Modify the search query based on the search type
      let searchQuery = query
      if (educationalFocus) {
        if (searchType === "lectures") {
          searchQuery = `${query} lecture educational`
        } else if (searchType === "tutorials") {
          searchQuery = `${query} tutorial how to`
        } else if (searchType === "pomodoro") {
          searchQuery = `pomodoro timer study with me ${query}`
        }
      }

      const res = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
          part: "snippet",
          maxResults: 25,
          key: YOUTUBE_API_KEY,
          q: searchQuery,
          type: "video",
          videoDuration: searchType === "pomodoro" ? "long" : "any",
        },
      })

      if (res.data.items && Array.isArray(res.data.items)) {
        const regularVideos = []
        const shortVideos = []

        res.data.items.forEach((video) => {
          const title = video.snippet?.title?.toLowerCase() || ""
          const description = video.snippet?.description?.toLowerCase() || ""
          const norm = normalizeVideo(video)

          if (title.includes("short") || description.includes("short") ||
            title.includes("#shorts") || description.includes("#shorts")) {
            shortVideos.push(norm)
          } else {
            regularVideos.push(norm)
          }
        })

        setVideos(regularVideos)
        setShorts(shortVideos)

        if (res.data.items.length === 0) {
          setError("No videos found. Try a different search term.")
        }
      } else {
        setError("Invalid response from YouTube API")
        setVideos([])
        setShorts([])
      }
    } catch (err) {
      console.error("Error fetching videos:", err)
      setError(err.response?.data?.error?.message || "Error searching videos. Please try again.")
      setVideos([])
      setShorts([])
    } finally {
      setIsLoading(false)
    }
  }, [query, educationalFocus, searchType, YOUTUBE_API_KEY, normalizeVideo])

  const handleVideoClick = useCallback(async (videoId) => {
    if (!YOUTUBE_API_KEY) {
      setError("YouTube API key is missing")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      const detailRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          part: "snippet,statistics,contentDetails",
          id: videoId,
          key: YOUTUBE_API_KEY,
        },
      })

      if (detailRes.data.items && detailRes.data.items.length > 0) {
        const videoData = detailRes.data.items[0]
        setSelectedVideo(videoData)
      } else {
        setError("Video details not found")
      }
    } catch (err) {
      console.error("Error loading video details:", err)
      setError("Error loading video details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [YOUTUBE_API_KEY])

  const closeModal = useCallback(() => {
    setSelectedVideo(null)
    setShowMoreMenu(null)
  }, [])

  const handleAddToHome = useCallback((isShort = false) => {
    if (selectedVideo && typeof onAddVideo === "function") {
      onAddVideo(selectedVideo, isShort)
      closeModal()
    }
  }, [selectedVideo, onAddVideo, closeModal])

  const handleAddToQueue = useCallback(() => {
    if (selectedVideo && typeof onAddToQueue === "function") {
      onAddToQueue(selectedVideo)
      closeModal()
    }
  }, [selectedVideo, onAddToQueue, closeModal])

  const handleQuickAdd = useCallback((video, isShort = false) => {
    if (video && typeof onAddVideo === "function") {
      onAddVideo(normalizeVideo(video), isShort)
    }
  }, [onAddVideo, normalizeVideo])

  const handleQuickAddToQueue = useCallback((video) => {
    if (video && typeof onAddToQueue === "function") {
      onAddToQueue(normalizeVideo(video))
    }
  }, [onAddToQueue, normalizeVideo])

  const handlePlay = useCallback((video) => {
    if (typeof onPlay === "function") {
      onPlay(normalizeVideo(video))
    }
  }, [onPlay, normalizeVideo])

  // Theme-based styling
  const bgColor = theme === "dark" ? "bg-zinc-800" : "bg-gray-100"
  const textColor = theme === "dark" ? "text-white" : "text-gray-800"
  const secondaryTextColor = theme === "dark" ? "text-zinc-400" : "text-gray-500"
  const hoverBgColor = theme === "dark" ? "hover:bg-zinc-700" : "hover:bg-gray-200"
  const activeBgColor = theme === "dark" ? "bg-zinc-700" : "bg-gray-300"
  const borderColor = theme === "dark" ? "border-zinc-700" : "border-gray-300"
  const inputBgColor = theme === "dark" ? "bg-zinc-800" : "bg-white"
  const inputBorderColor = theme === "dark" ? "border-zinc-700" : "border-gray-300"

  const displayedVideos = videos.slice(0, visibleCount)
  let shortsIndex = 0

  return (
    <div className={`video-station ${textColor}`}>
      <div className="search-bar flex flex-col gap-2 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={educationalFocus ? "Search for educational videos..." : "Search YouTube..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className={`w-full ${inputBgColor} border ${inputBorderColor} rounded-lg py-3 px-4 pl-10 ${textColor} focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              aria-label="Search for videos"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
          </div>
          <button
            onClick={handleSearch}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            disabled={isLoading || !query.trim()}
            aria-label="Search videos"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5 mx-auto" />
            ) : (
              "Search"
            )}
          </button>
        </div>

        {educationalFocus && (
          <div className="flex gap-2">
            <button
              onClick={() => setSearchType("all")}
              className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 ${searchType === "all"
                ? "bg-red-600 text-white"
                : `${bgColor} ${secondaryTextColor} ${hoverBgColor}`
                }`}
              aria-label="Search all videos"
            >
              <Search size={16} />
              All
            </button>
            <button
              onClick={() => setSearchType("lectures")}
              className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 ${searchType === "lectures"
                ? "bg-red-600 text-white"
                : `${bgColor} ${secondaryTextColor} ${hoverBgColor}`
                }`}
              aria-label="Search lectures"
            >
              <GraduationCap size={16} />
              Lectures
            </button>
            <button
              onClick={() => setSearchType("tutorials")}
              className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 ${searchType === "tutorials"
                ? "bg-red-600 text-white"
                : `${bgColor} ${secondaryTextColor} ${hoverBgColor}`
                }`}
              aria-label="Search tutorials"
            >
              <BookOpen size={16} />
              Tutorials
            </button>
            <button
              onClick={() => setSearchType("pomodoro")}
              className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 ${searchType === "pomodoro"
                ? "bg-red-600 text-white"
                : `${bgColor} ${secondaryTextColor} ${hoverBgColor}`
                }`}
              aria-label="Search pomodoro videos"
            >
              <Clock size={16} />
              Pomodoro
            </button>
          </div>
        )}

        {error && (
          <div className={`bg-red-900/30 text-red-400 p-2 rounded-lg flex items-center gap-2 text-sm ${textColor}`}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      <div className={`overflow-y-auto pr-2 max-h-[600px] ${bgColor} rounded-lg p-2`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-red-500" />
          </div>
        ) : videos.length > 0 || shorts.length > 0 ? (
          <div className="space-y-6">
            {/* Regular Videos */}
            {videos.length > 0 && (
              <div className="space-y-4">
                <h3 className={`font-medium ${secondaryTextColor}`}>Videos</h3>
                <div className="space-y-3">
                  {displayedVideos.map((video, idx) => (
                    <React.Fragment key={video.id}>
                      <div
                        className={`flex gap-3 p-3 rounded-lg cursor-pointer ${hoverBgColor} transition-colors ${theme === "dark" ? "bg-zinc-800/50" : "bg-white"
                          }`}
                        onClick={() => handleVideoClick(video.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Video: ${video.snippet?.title || "Untitled"}`}
                        onKeyDown={(e) => e.key === "Enter" && handleVideoClick(video.id)}
                      >
                        <img
                          src={
                            video.snippet?.thumbnails?.medium?.url ||
                            video.snippet?.thumbnails?.default?.url ||
                            "/placeholder.svg"
                          }
                          alt={video.snippet?.title || "Video thumbnail"}
                          className="w-32 h-20 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{video.snippet?.title || "Untitled"}</h4>
                          <p className={`${secondaryTextColor} text-xs`}>
                            {video.snippet?.channelTitle || "Unknown Channel"}
                          </p>
                          <div className="flex items-center gap-2 mt-2 relative">
                            <button
                              className={`${secondaryTextColor} hover:text-green-500 text-xs flex items-center gap-1`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePlay(video)
                              }}
                              aria-label={`Play ${video.snippet?.title || "video"}`}
                            >
                              <Play size={14} /> Play
                            </button>
                            <button
                              className={`${secondaryTextColor} hover:text-zinc-200 text-xs flex items-center gap-1`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowMoreMenu(showMoreMenu === video.id ? null : video.id)
                              }}
                              aria-label="More options"
                            >
                              <MoreVertical size={14} />
                            </button>
                            {showMoreMenu === video.id && (
                              <div
                                className={`absolute right-0 top-8 w-40 ${theme === "dark" ? "bg-zinc-900" : "bg-white"} rounded shadow-lg z-50 border ${borderColor} flex flex-col`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className={`px-4 py-2 text-left ${hoverBgColor} text-sm ${textColor}`}
                                  onClick={() => { handleQuickAdd(video, false); setShowMoreMenu(null) }}
                                  aria-label="Save video"
                                >
                                  <VideoIcon size={14} className="inline mr-2" /> Save Video
                                </button>
                                <button
                                  className={`px-4 py-2 text-left ${hoverBgColor} text-sm ${textColor}`}
                                  onClick={() => { handleQuickAddToQueue(video); setShowMoreMenu(null) }}
                                  aria-label="Add to queue"
                                >
                                  <Plus size={14} className="inline mr-2" /> Add to Queue
                                </button>
                                <button
                                  className={`px-4 py-2 text-left ${hoverBgColor} text-sm ${textColor}`}
                                  onClick={() => { handleVideoClick(video.id); setShowMoreMenu(null) }}
                                  aria-label="View details"
                                >
                                  <List size={14} className="inline mr-2" /> View Details
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {(idx + 1) % 6 === 0 && shorts.length > shortsIndex && (
                        <div className="mt-6">
                          <h3 className="font-medium text-zinc-400 mb-3">Shorts</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {shorts.slice(shortsIndex, shortsIndex + 6).map((short) => (
                              <div
                                key={short.id}
                                className={`flex flex-col rounded-lg cursor-pointer ${hoverBgColor} transition-colors overflow-hidden ${theme === "dark" ? "bg-zinc-800/50" : "bg-white"
                                  }`}
                                onClick={() => handleVideoClick(short.id)}
                                role="button"
                                tabIndex={0}
                                aria-label={`Short: ${short.snippet?.title || "Untitled"}`}
                                onKeyDown={(e) => e.key === "Enter" && handleVideoClick(short.id)}
                              >
                                <div className="relative">
                                  <img
                                    src={
                                      short.snippet?.thumbnails?.high?.url ||
                                      short.snippet?.thumbnails?.default?.url ||
                                      "/placeholder.svg"
                                    }
                                    alt={short.snippet?.title || "Short thumbnail"}
                                    className="w-full aspect-square object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                                    <Play size={24} className="text-white" />
                                  </div>
                                </div>
                                <div className="p-2">
                                  <h4 className="text-xs font-medium line-clamp-1">{short.snippet?.title || "Untitled"}</h4>
                                  <div className="flex items-center justify-between mt-2">
                                    <button
                                      className={`${secondaryTextColor} hover:text-blue-500`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleQuickAddToQueue(short)
                                      }}
                                      aria-label="Add to queue"
                                    >
                                      <Plus size={14} />
                                    </button>
                                    <button
                                      className={`${secondaryTextColor} hover:text-amber-500`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleQuickAdd(short, true)
                                      }}
                                      aria-label="Save as short"
                                    >
                                      <VideoIcon size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) && (shortsIndex += 6)}
                    </React.Fragment>
                  ))}
                  {videos.length > visibleCount && (
                    <button
                      className="w-full py-2 text-center text-zinc-400 hover:text-white text-sm bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                      onClick={() => setVisibleCount((c) => c + 20)}
                    >
                      Show More
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Shorts */}
            {shorts.length > 0 && (
              <div className="mt-6">
                <h3 className={`font-medium ${secondaryTextColor} mb-3`}>Shorts</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {shorts.slice(0, 6).map((video) => (
                    <div
                      key={video.id}
                      className={`flex flex-col rounded-lg cursor-pointer ${hoverBgColor} transition-colors overflow-hidden ${theme === "dark" ? "bg-zinc-800/50" : "bg-white"
                        }`}
                      onClick={() => handleVideoClick(video.id)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Short: ${video.snippet?.title || "Untitled"}`}
                      onKeyDown={(e) => e.key === "Enter" && handleVideoClick(video.id)}
                    >
                      <div className="relative">
                        <img
                          src={
                            video.snippet?.thumbnails?.high?.url ||
                            video.snippet?.thumbnails?.default?.url ||
                            "/placeholder.svg"
                          }
                          alt={video.snippet?.title || "Short thumbnail"}
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
                            className={`${secondaryTextColor} hover:text-blue-500`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleQuickAddToQueue(video)
                            }}
                            aria-label="Add to queue"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            className={`${secondaryTextColor} hover:text-amber-500`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleQuickAdd(video, true)
                            }}
                            aria-label="Save as short"
                          >
                            <VideoIcon size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : query ? (
          <div className="empty-state text-center py-6">
            <div className={secondaryTextColor}>
              <Search size={36} className="mx-auto mb-3 opacity-50" />
              <p>No videos found for "{query}"</p>
              <p className="text-sm mt-2">Try different keywords or search terms</p>
            </div>
          </div>
        ) : (
          <div className="empty-state text-center py-6">
            <div className={secondaryTextColor}>
              {educationalFocus ? (
                <>
                  <GraduationCap size={36} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Search for educational videos to get started</p>
                </>
              ) : (
                <>
                  <Search size={36} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Search for videos to get started</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className={`video-modal-content ${theme === "dark" ? "bg-zinc-900" : "bg-white"} rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col`}
          >
            <div className={`flex justify-between items-center p-4 border-b ${borderColor}`}>
              <h3 className="font-bold text-lg line-clamp-1">{selectedVideo.snippet?.title || "Video"}</h3>
              <button
                onClick={closeModal}
                className={`${secondaryTextColor} hover:${textColor} p-1 rounded-full ${hoverBgColor} transition-colors`}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                  title={selectedVideo.snippet?.title || "YouTube Video"}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  aria-label="YouTube video player"
                ></iframe>
              </div>

              <div className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <div>
                    <p className={secondaryTextColor}>
                      <strong>Channel:</strong> {selectedVideo.snippet?.channelTitle || "Unknown Channel"}
                    </p>
                    <p className={secondaryTextColor}>
                      <strong>Views:</strong>{" "}
                      {selectedVideo.statistics?.viewCount
                        ? Number.parseInt(selectedVideo.statistics.viewCount).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                      className={`flex items-center gap-2 ${theme === "dark" ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-200 hover:bg-gray-300"
                        } ${textColor} font-medium py-2 px-4 rounded-lg transition-colors flex-1 md:flex-none`}
                      onClick={handleAddToQueue}
                      aria-label="Add to queue"
                    >
                      <List size={18} />
                      Add to Queue
                    </button>
                    <button
                      className={`flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex-1 md:flex-none`}
                      onClick={() => handleAddToHome(true)}
                      aria-label="Save as short"
                    >
                      <VideoIcon size={18} />
                      Save as Short
                    </button>
                    <button
                      className={`flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex-1 md:flex-none`}
                      onClick={() => handleAddToHome(false)}
                      aria-label="Save video"
                    >
                      <Plus size={18} />
                      Save Video
                    </button>
                  </div>
                </div>

                <div className={`${theme === "dark" ? "bg-zinc-800" : "bg-gray-100"} p-4 rounded-lg`}>
                  <p className="text-sm whitespace-pre-line">
                    {selectedVideo.snippet?.description || "No description available."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}