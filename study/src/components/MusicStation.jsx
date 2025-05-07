"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Coffee,
  Brain,
  Search,
  X,
  Plus,
  List,
  Heart,
  ArrowLeft,
} from "lucide-react"
import { useMusic } from "@/contexts/music-context"

export default function MusicStationWidget({ focusMusic = true }) {
  const {
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
  } = useMusic()

  const [spotifyToken, setSpotifyToken] = useState("")
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [musicCategory, setMusicCategory] = useState(focusMusic ? "lofi" : "")
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [liked, setLiked] = useState(false)

  // Playlist management
  const [playlists, setPlaylists] = useState([{ id: "default", name: "Study Playlist", tracks: [] }])
  const [activePlaylistId, setActivePlaylistId] = useState("default")
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("")

  // These should be environment variables in a production app
  const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "249a04e3201e4b979d551b0b0ad91fc8"
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "c5739683cf464ea7b32ef57cba754741"
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "AIzaSyBLcEftz_mf0AbsemRGSsGK4HiWbMJCgQ4"

  // Suggested study music playlists
  const studyPlaylists = [
    { name: "Lo-fi Beats", query: "lofi study beats", category: "lofi" },
    { name: "Classical Focus", query: "classical music for studying", category: "classical" },
    { name: "Ambient Study", query: "ambient music for concentration", category: "ambient" },
    { name: "Jazz Study", query: "jazz for studying", category: "jazz" },
  ]

  // Get the active playlist
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) || playlists[0]

  // Filter playlists based on search query
  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(playlistSearchQuery.toLowerCase()),
  )

  // Filter tracks in active playlist based on search if in playlist view
  const filteredTracks = activePlaylist.tracks.filter(
    (track) =>
      track.name.toLowerCase().includes(playlistSearchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(playlistSearchQuery.toLowerCase()),
  )

  // Load playlists from localStorage
  useEffect(() => {
    try {
      const savedPlaylists = localStorage.getItem("studyMusicPlaylists")
      if (savedPlaylists) {
        setPlaylists(JSON.parse(savedPlaylists))
      }
    } catch (error) {
      console.error("Error loading playlists from localStorage:", error)
    }
  }, [])

  // Save playlists to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("studyMusicPlaylists", JSON.stringify(playlists))
    } catch (error) {
      console.error("Error saving playlists to localStorage:", error)
    }
  }, [playlists])

  const toggleShuffle = () => {
    setShuffle((prev) => !prev)
  }

  const toggleRepeat = () => {
    setRepeat((prev) => !prev)
  }

  const toggleLike = () => {
    setLiked((prev) => !prev)

    // Add current track to favorites playlist if liked
    if (!liked && track) {
      // Find or create favorites playlist
      let favoritesPlaylist = playlists.find((p) => p.name === "Favorites")

      if (!favoritesPlaylist) {
        // Create favorites playlist if it doesn't exist
        favoritesPlaylist = { id: `playlist-${Date.now()}`, name: "Favorites", tracks: [] }
        setPlaylists((prev) => [...prev, favoritesPlaylist])
      }

      // Check if track is already in favorites
      const exists = favoritesPlaylist.tracks.some((t) => t.youtubeId === track.youtubeId)

      if (!exists && track.youtubeId) {
        // Add track to favorites
        const updatedPlaylists = playlists.map((p) => {
          if (p.id === favoritesPlaylist.id) {
            return {
              ...p,
              tracks: [
                ...p.tracks,
                {
                  name: track.name,
                  artist: track.artist,
                  image: track.image,
                  youtubeId: track.youtubeId,
                },
              ],
            }
          }
          return p
        })

        setPlaylists(updatedPlaylists)
      }
    }
  }

  const searchStudyMusic = async (playlist) => {
    setIsSearching(true)
    setMusicCategory(playlist.category)

    try {
      // Search YouTube directly for study music
      const ytRes = await axios.get(`https://youtube.googleapis.com/youtube/v3/search`, {
        params: {
          part: "snippet",
          q: playlist.query,
          key: YOUTUBE_API_KEY,
          maxResults: 1,
          type: "video",
          videoDuration: "long", // Prefer longer videos for study music
        },
      })

      if (ytRes.data.items && ytRes.data.items.length > 0) {
        const video = ytRes.data.items[0]
        const newTrack = {
          name: video.snippet.title,
          artist: video.snippet.channelTitle,
          image: video.snippet.thumbnails.high.url,
          youtubeId: video.id.videoId,
        }

        playTrack(newTrack, video.id.videoId)
      } else {
        console.error("No study music found")
      }
    } catch (error) {
      console.error("YouTube search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])

    try {
      // Search YouTube for music
      const ytRes = await axios.get(`https://youtube.googleapis.com/youtube/v3/search`, {
        params: {
          part: "snippet",
          q: `${searchQuery} music audio`,
          key: YOUTUBE_API_KEY,
          maxResults: 10,
          type: "video",
        },
      })

      if (ytRes.data.items && ytRes.data.items.length > 0) {
        const results = ytRes.data.items.map((item) => ({
          id: item.id.videoId,
          name: item.snippet.title,
          artist: item.snippet.channelTitle,
          image: item.snippet.thumbnails.high.url,
        }))
        setSearchResults(results)
      }
    } catch (error) {
      console.error("YouTube search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const playSearchResult = (result) => {
    const newTrack = {
      name: result.name,
      artist: result.artist,
      image: result.image,
      youtubeId: result.id,
    }

    playTrack(newTrack, result.id)
    setShowSearch(false)
  }

  const addToPlaylist = (track) => {
    if (!activePlaylist) return

    // Check if track is already in the playlist
    const exists = activePlaylist.tracks.some((t) => t.youtubeId === track.id)

    if (!exists) {
      const updatedPlaylists = playlists.map((p) => {
        if (p.id === activePlaylistId) {
          return {
            ...p,
            tracks: [
              ...p.tracks,
              {
                name: track.name,
                artist: track.artist,
                image: track.image,
                youtubeId: track.id,
              },
            ],
          }
        }
        return p
      })

      setPlaylists(updatedPlaylists)
    }
  }

  const createNewPlaylist = () => {
    if (!newPlaylistName.trim()) return

    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name: newPlaylistName,
      tracks: [],
    }

    setPlaylists((prev) => [...prev, newPlaylist])
    setNewPlaylistName("")
  }

  const removeFromPlaylist = (trackIndex) => {
    const updatedPlaylists = playlists.map((p) => {
      if (p.id === activePlaylistId) {
        const newTracks = [...p.tracks]
        newTracks.splice(trackIndex, 1)
        return {
          ...p,
          tracks: newTracks,
        }
      }
      return p
    })

    setPlaylists(updatedPlaylists)
  }

  const playTrackFromPlaylist = (trackData) => {
    playTrack(
      {
        name: trackData.name,
        artist: trackData.artist,
        image: trackData.image,
        youtubeId: trackData.youtubeId,
      },
      trackData.youtubeId,
    )
    setShowPlaylists(false)
  }

  // Render the search interface
  if (showSearch) {
    return (
      <div className="bg-zinc-900 text-white rounded-xl overflow-hidden h-full flex flex-col">
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setShowSearch(false)} className="text-zinc-400 hover:text-white p-1 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold">Search Music</h2>
            <div className="w-8"></div>
          </div>

          <div className="search-bar flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search for music..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-70"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Search results */}
          <div className="flex-1 overflow-y-auto pr-2">
            {isSearching ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <img
                      src={result.image || "/placeholder.svg?height=60&width=60"}
                      alt={result.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">{result.name}</h4>
                      <p className="text-xs text-zinc-400 line-clamp-1">{result.artist}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => playSearchResult(result)}
                        className="p-2 text-green-500 hover:bg-zinc-700 rounded-full"
                        title="Play"
                      >
                        <Play size={16} />
                      </button>
                      <button
                        onClick={() => addToPlaylist(result)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full"
                        title={`Add to ${activePlaylist.name}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <p className="mb-2">No results found for "{searchQuery}"</p>
                <p className="text-sm">Try different keywords</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <Search size={48} className="mb-4 opacity-30" />
                <p className="mb-2">Search for your favorite music</p>
                <p className="text-sm">Try searching for artist, song or playlist</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render the playlists interface
  if (showPlaylists) {
    return (
      <div className="bg-zinc-900 text-white rounded-xl overflow-hidden h-full flex flex-col">
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setShowPlaylists(false)} className="text-zinc-400 hover:text-white p-1 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold">Your Playlists</h2>
            <div className="w-8"></div>
          </div>

          {/* Playlists search */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Search playlists or tracks..."
              value={playlistSearchQuery}
              onChange={(e) => setPlaylistSearchQuery(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
            {playlistSearchQuery && (
              <button
                onClick={() => setPlaylistSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Create new playlist */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="New playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={createNewPlaylist}
              disabled={!newPlaylistName.trim()}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 transition-colors disabled:opacity-50"
            >
              Create
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Playlist list */}
            {!playlistSearchQuery && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Your Playlists</h3>
                <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2">
                  {filteredPlaylists.length > 0 ? (
                    filteredPlaylists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => setActivePlaylistId(playlist.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          activePlaylistId === playlist.id
                            ? "bg-green-600/30 text-green-400"
                            : "hover:bg-zinc-800 text-white"
                        }`}
                      >
                        {playlist.name} <span className="text-xs text-zinc-500">({playlist.tracks.length})</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-zinc-500 py-2">No playlists found</p>
                  )}
                </div>
              </div>
            )}

            {/* Tracks in active playlist */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">
                {playlistSearchQuery ? "Search Results" : `${activePlaylist.name} Tracks`}
              </h3>

              {filteredTracks.length > 0 ? (
                <div className="space-y-2">
                  {filteredTracks.map((track, index) => (
                    <div
                      key={`${track.youtubeId}-${index}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <img
                        src={track.image || "/placeholder.svg?height=60&width=60"}
                        alt={track.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playTrackFromPlaylist(track)}>
                        <h4 className="font-medium text-sm line-clamp-1">{track.name}</h4>
                        <p className="text-xs text-zinc-400 line-clamp-1">{track.artist}</p>
                      </div>
                      <button
                        onClick={() => removeFromPlaylist(index)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-700 rounded-full"
                        title="Remove from playlist"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-500 py-4">
                  <Music size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">
                    {playlistSearchQuery ? "No tracks matching your search" : "This playlist is empty"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 text-white rounded-xl overflow-hidden h-full flex flex-col">
      <div className="p-4 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Music className="text-green-500" />
            Study Music
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              title="Search music"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => setShowPlaylists(true)}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              title="Your playlists"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {studyPlaylists.map((playlist) => (
            <button
              key={playlist.category}
              onClick={() => searchStudyMusic(playlist)}
              className={`p-2 rounded-lg text-left transition-colors ${
                musicCategory === playlist.category
                  ? "bg-green-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {playlist.category === "lofi" && <Coffee size={16} />}
                {playlist.category === "classical" && <Music size={16} />}
                {playlist.category === "ambient" && <Brain size={16} />}
                {playlist.category === "jazz" && <Music size={16} />}
                {playlist.name}
              </div>
            </button>
          ))}
        </div>

        {track ? (
          <>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative group w-full max-w-[160px] mx-auto mb-3">
                <img
                  src={track.image || "/placeholder.svg?height=160&width=160"}
                  alt={`${track.name} album art`}
                  className="w-full aspect-square rounded-lg shadow-lg object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={togglePlay}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                </div>
              </div>

              <div className="text-center mb-3 w-full">
                <h2 className="text-base font-bold truncate">{track.name}</h2>
                <p className="text-zinc-400 text-sm truncate">{track.artist}</p>
              </div>
            </div>

            <div className="mt-auto">
              <div className="progress-wrapper flex items-center gap-2 mb-3">
                <span className="text-xs text-zinc-400 tabular-nums w-8">
                  {formatTime((progress / 100) * duration)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress}
                  onChange={(e) => handleSeek(Number.parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10b981 ${progress}%, #3f3f46 ${progress}%)`,
                  }}
                />
                <span className="text-xs text-zinc-400 tabular-nums w-8">{formatTime(duration)}</span>
              </div>

              <div className="controls flex items-center justify-center gap-4 mb-3">
                <button
                  className={`text-zinc-400 hover:text-white p-1 ${shuffle ? "text-green-500" : ""}`}
                  onClick={toggleShuffle}
                  aria-label="Shuffle"
                >
                  <Shuffle size={16} />
                </button>

                <button className="text-zinc-400 hover:text-white p-1" aria-label="Previous track">
                  <SkipBack size={16} />
                </button>

                <button
                  onClick={togglePlay}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 transition-transform hover:scale-105"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <button className="text-zinc-400 hover:text-white p-1" aria-label="Next track">
                  <SkipForward size={16} />
                </button>

                <button
                  className={`text-zinc-400 hover:text-white p-1 ${repeat ? "text-green-500" : ""}`}
                  onClick={toggleRepeat}
                  aria-label="Repeat"
                >
                  <Repeat size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between px-1">
                <button
                  className={`text-zinc-400 hover:text-white p-1 ${liked ? "text-green-500" : ""}`}
                  onClick={toggleLike}
                  aria-label={liked ? "Unlike" : "Like"}
                >
                  <Heart size={16} fill={liked ? "#10b981" : "none"} />
                </button>

                <div className="flex items-center gap-2 volume-control">
                  <button
                    className="text-zinc-400 hover:text-white p-1"
                    onClick={toggleMute}
                    aria-label={muted ? "Unmute" : "Mute"}
                  >
                    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => handleVolumeChange(e.target.value)}
                    className="w-20 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 ${volume}%, #3f3f46 ${volume}%)`,
                    }}
                    aria-label="Volume"
                  />
                </div>

                <button
                  onClick={() => setShowPlaylists(true)}
                  className="text-zinc-400 hover:text-white p-1"
                  aria-label="Show playlists"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <Music size={48} className="text-zinc-700 mb-3" />
            <h3 className="text-base font-medium mb-2">No track selected</h3>
            <p className="text-zinc-500 mb-4 text-sm">Select a music style to start listening</p>
            <button
              onClick={() => setShowSearch(true)}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Search Music
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
