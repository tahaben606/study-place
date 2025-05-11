"use client"

import { useEffect, useRef, useState } from "react"
import axios from "axios"
import YouTube from "react-youtube"
import {
  Heart,
  List,
  Pause,
  Play,
  Plus,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  VolumeX,
  X,
  PlusCircle,
  Edit2,
  Save,
  Check,
  PlayCircle,
  Music,
  Search,
  Brain,
  Coffee,
} from "lucide-react"

export default function MusicStation({ focusMusic = false }) {
  const [query, setQuery] = useState("")
  const [track, setTrack] = useState(null)
  const [youtubeId, setYoutubeId] = useState(null)
  const [spotifyToken, setSpotifyToken] = useState("")
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playerRef = useRef(null)
  const [volume, setVolume] = useState(50)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [liked, setLiked] = useState(false)

  // Multiple playlists state
  const [playlists, setPlaylists] = useState([{ id: "default", name: "Study Playlist", tracks: [] }])
  const [activePlaylistId, setActivePlaylistId] = useState("default")
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [editingPlaylistId, setEditingPlaylistId] = useState(null)
  const [editingPlaylistName, setEditingPlaylistName] = useState("")

  // Add to playlist dropdown state
  const [showAddToPlaylistDropdown, setShowAddToPlaylistDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [musicCategory, setMusicCategory] = useState(focusMusic ? "lofi" : "")

  // Add state for selecting a track to add
  const [trackToAdd, setTrackToAdd] = useState(null)
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false)

  // These should be environment variables in a production app
  const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "249a04e3201e4b979d551b0b0ad91fc8"
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "c5739683cf464ea7b32ef57cba754741"

  // Get the active playlist
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) || playlists[0]

  // Suggested study music playlists
  const studyPlaylists = [
    { name: "Lo-fi Beats", query: "lofi study beats", category: "lofi" },
    { name: "Classical Focus", query: "classical music for studying", category: "classical" },
    { name: "Ambient Study", query: "ambient music for concentration", category: "ambient" },
    { name: "Jazz Study", query: "jazz for studying", category: "jazz" },
    { name: "Nature Sounds", query: "nature sounds for focus", category: "nature" },
  ]

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

  // Load playlists from localStorage
  useEffect(() => {
    const savedPlaylists = localStorage.getItem("studyMusicPlaylists")
    if (savedPlaylists) {
      setPlaylists(JSON.parse(savedPlaylists))
    }
  }, [])

  // Save playlists to localStorage when they change
  useEffect(() => {
    localStorage.setItem("studyMusicPlaylists", JSON.stringify(playlists))
  }, [playlists])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target
      if (
        showAddToPlaylistDropdown &&
        !target.closest(".add-to-playlist-dropdown") &&
        !target.closest(".add-to-playlist-button")
      ) {
        setShowAddToPlaylistDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showAddToPlaylistDropdown])

  const getSpotifyToken = async () => {
    try {
      const res = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({ grant_type: "client_credentials" }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
          },
        },
      )
      setSpotifyToken(res.data.access_token)
      return res.data.access_token
    } catch (error) {
      console.error("Error getting Spotify token:", error)
    }
  }

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

  const toggleMute = () => {
    setMuted((prev) => !prev)
  }

  const handleVolumeChange = (e) => {
    const vol = Number.parseInt(e.target.value)
    setVolume(vol)
    if (vol === 0) {
      setMuted(true)
    } else if (muted) {
      setMuted(false)
    }
  }

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      // Play previous track in current playlist
      playTrackFromPlaylist(currentTrackIndex - 1)
    } else if (repeat) {
      // If repeat is on and we're at the first track, go to the last track of current playlist
      playTrackFromPlaylist(activePlaylist.tracks.length - 1)
    }
  }

  const handleNext = () => {
    if (currentTrackIndex < activePlaylist.tracks.length - 1) {
      // Play next track in current playlist
      playTrackFromPlaylist(currentTrackIndex + 1)
    } else {
      // We're at the end of the current playlist
      if (repeat) {
        // If repeat is on, go to the first track of current playlist
        playTrackFromPlaylist(0)
      } else {
        // Find the next playlist
        const currentPlaylistIndex = playlists.findIndex((p) => p.id === activePlaylistId)
        if (currentPlaylistIndex < playlists.length - 1) {
          // There is a next playlist
          const nextPlaylist = playlists[currentPlaylistIndex + 1]
          if (nextPlaylist.tracks.length > 0) {
            // Next playlist has tracks, play the first one
            setActivePlaylistId(nextPlaylist.id)
            playTrackFromPlaylist(0, nextPlaylist.id)
          }
        }
      }
    }
  }

  // Handle end of track
  const onPlayerStateChange = (event) => {
    // YouTube state 0 means the video ended
    if (event.data === 0) {
      handleNext()
    }
  }

  const toggleShuffle = () => {
    setShuffle((prev) => !prev)

    if (!shuffle && activePlaylist.tracks.length > 0) {
      // Implement shuffle logic when turning shuffle on
      const newPlaylists = [...playlists]
      const playlistIndex = newPlaylists.findIndex((p) => p.id === activePlaylistId)

      if (playlistIndex !== -1) {
        // Create a copy of the tracks array
        const tracks = [...newPlaylists[playlistIndex].tracks]

        // Fisher-Yates shuffle algorithm
        for (let i = tracks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
            ;[tracks[i], tracks[j]] = [tracks[j], tracks[i]]
        }

        // Update the playlist with shuffled tracks
        newPlaylists[playlistIndex].tracks = tracks
        setPlaylists(newPlaylists)

        // If a track is currently playing, find its new index
        if (track && currentTrackIndex !== -1) {
          const newIndex = tracks.findIndex((t) => t.name === track.name && t.artist === track.artist)
          setCurrentTrackIndex(newIndex !== -1 ? newIndex : 0)
        }
      }
    }
  }

  const toggleRepeat = () => {
    setRepeat((prev) => !prev)
  }

  const toggleLike = () => {
    setLiked((prev) => !prev)
  }

  const toggleAddToPlaylistDropdown = () => {
    if (!track) return
    setShowAddToPlaylistDropdown((prev) => !prev)
  }

  const handleAddToPlaylist = (track) => {
    setTrackToAdd(track)
    setShowPlaylistDropdown(true)
  }

  const confirmAddToPlaylist = (playlistId) => {
    if (!trackToAdd) return
    const targetPlaylist = playlists.find((p) => p.id === playlistId)
    if (!targetPlaylist) return

    // Check if track already exists in playlist
    const exists = targetPlaylist.tracks.some((item) => item.youtubeId === trackToAdd.youtubeId)

    if (!exists) {
      const updatedPlaylists = playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            tracks: [...playlist.tracks, {
              name: trackToAdd.name,
              artist: trackToAdd.artist,
              image: trackToAdd.image,
              youtubeId: trackToAdd.youtubeId
            }],
          }
        }
        return playlist
      })

      setPlaylists(updatedPlaylists)
      // Save to localStorage immediately
      try {
        localStorage.setItem("studyMusicPlaylists", JSON.stringify(updatedPlaylists))
      } catch (error) {
        console.error("Error saving playlists to localStorage:", error)
      }

      alert(`Added to "${targetPlaylist.name}"!`)
    } else {
      alert(`This track is already in "${targetPlaylist.name}"!`)
    }
    setShowPlaylistDropdown(false)
    setTrackToAdd(null)
  }

  const removeFromPlaylist = (index, playlistId = activePlaylistId) => {
    const updatedPlaylists = playlists.map((playlist) => {
      if (playlist.id === playlistId) {
        const newTracks = [...playlist.tracks]
        newTracks.splice(index, 1)
        return {
          ...playlist,
          tracks: newTracks,
        }
      }
      return playlist
    })

    setPlaylists(updatedPlaylists)

    // Update current track index if needed
    if (playlistId === activePlaylistId) {
      if (index === currentTrackIndex) {
        // We removed the current track
        setCurrentTrackIndex(-1)
      } else if (index < currentTrackIndex) {
        // We removed a track before the current one
        setCurrentTrackIndex(currentTrackIndex - 1)
      }
    }
  }

  const playTrackFromPlaylist = (index, playlistId = activePlaylistId) => {
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist || index < 0 || index >= playlist.tracks.length) return

    const selectedTrack = playlist.tracks[index]
    setTrack({
      name: selectedTrack.name,
      artist: selectedTrack.artist,
      image: selectedTrack.image,
    })
    setYoutubeId(selectedTrack.youtubeId || null)
    setActivePlaylistId(playlistId)
    setCurrentTrackIndex(index)
  }

  // Play entire playlist from the beginning
  const playEntirePlaylist = (playlistId) => {
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist || playlist.tracks.length === 0) {
      alert("This playlist is empty. Add some tracks first!")
      return
    }

    // Play the first track
    playTrackFromPlaylist(0, playlistId)
  }

  const togglePlaylists = () => {
    setShowPlaylists((prev) => !prev)
  }

  const createNewPlaylist = () => {
    if (!newPlaylistName.trim()) {
      alert("Please enter a playlist name")
      return
    }

    const newId = `playlist-${Date.now()}`
    const updatedPlaylists = [
      ...playlists,
      {
        id: newId,
        name: newPlaylistName,
        tracks: [],
      },
    ]

    setPlaylists(updatedPlaylists)
    // Save to localStorage immediately
    try {
      localStorage.setItem("studyMusicPlaylists", JSON.stringify(updatedPlaylists))
    } catch (error) {
      console.error("Error saving playlists to localStorage:", error)
    }

    setNewPlaylistName("")
  }

  const startEditingPlaylist = (id, name) => {
    setEditingPlaylistId(id)
    setEditingPlaylistName(name)
  }

  const savePlaylistEdit = () => {
    if (!editingPlaylistId || !editingPlaylistName.trim()) return

    const updatedPlaylists = playlists.map((playlist) => {
      if (playlist.id === editingPlaylistId) {
        return {
          ...playlist,
          name: editingPlaylistName,
        }
      }
      return playlist
    })

    setPlaylists(updatedPlaylists)
    // Save to localStorage immediately
    try {
      localStorage.setItem("studyMusicPlaylists", JSON.stringify(updatedPlaylists))
    } catch (error) {
      console.error("Error saving playlists to localStorage:", error)
    }

    setEditingPlaylistId(null)
    setEditingPlaylistName("")
  }

  const deletePlaylist = (id) => {
    if (playlists.length <= 1) {
      alert("You must have at least one playlist")
      return
    }

    if (confirm("Are you sure you want to delete this playlist?")) {
      const updatedPlaylists = playlists.filter((playlist) => playlist.id !== id)
      setPlaylists(updatedPlaylists)

      // If we deleted the active playlist, set the first playlist as active
      if (id === activePlaylistId) {
        setActivePlaylistId(updatedPlaylists[0].id)
        setCurrentTrackIndex(-1)
      }
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)

    try {
      // Get token if we don't have one
      const token = spotifyToken || (await getSpotifyToken())
      if (!token) {
        setIsSearching(false)
        return
      }

      // Search Spotify
      const spotifyRes = await axios.get(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      const foundTrack = spotifyRes.data.tracks.items[0]
      if (!foundTrack) {
        alert("No tracks found. Try another search.")
        setIsSearching(false)
        return
      }

      setTrack({
        name: foundTrack.name,
        artist: foundTrack.artists[0].name,
        image: foundTrack.album.images[0].url,
      })

      // Search YouTube
      try {
        // In a production app, this should be a server-side API call
        const ytRes = await axios.get(`https://youtube.googleapis.com/youtube/v3/search`, {
          params: {
            part: "snippet",
            q: `${foundTrack.name} ${foundTrack.artists[0].name} official audio`,
            key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "AIzaSyBLcEftz_mf0AbsemRGSsGK4HiWbMJCgQ4",
            maxResults: 1,
            type: "video",
          },
        })

        if (ytRes.data.items && ytRes.data.items.length > 0) {
          setYoutubeId(ytRes.data.items[0]?.id?.videoId)
          setCurrentTrackIndex(-1) // Reset playlist index when searching
        } else {
          alert("No YouTube video found for this track.")
        }
      } catch (error) {
        console.error("YouTube search error:", error)
        alert("Error searching YouTube. Please try again.")
      }
    } catch (error) {
      console.error("Spotify search error:", error)
      alert("Error searching Spotify. Please try again.")
    } finally {
      setIsSearching(false)
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
          key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "AIzaSyBLcEftz_mf0AbsemRGSsGK4HiWbMJCgQ4",
          maxResults: 1,
          type: "video",
          videoDuration: "long", // Prefer longer videos for study music
        },
      })

      if (ytRes.data.items && ytRes.data.items.length > 0) {
        const video = ytRes.data.items[0]
        setTrack({
          name: video.snippet.title,
          artist: video.snippet.channelTitle,
          image: video.snippet.thumbnails.high.url,
        })
        setYoutubeId(video.id.videoId)
        setCurrentTrackIndex(-1)
      } else {
        alert("No study music found. Try another category.")
      }
    } catch (error) {
      console.error("YouTube search error:", error)
      alert("Error searching YouTube. Please try again.")
    } finally {
      setIsSearching(false)
    }
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

  const handleSeek = (e) => {
    const newProgress = Number.parseFloat(e.target.value)
    const newTime = (newProgress / 100) * duration
    playerRef.current.seekTo(newTime, true)
    setProgress(newProgress)
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

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0")
    return `${m}:${s}`
  }

  return (
    <div className="bg-zinc-900 text-white rounded-xl shadow-2xl overflow-hidden h-full flex flex-col">
      <div className="p-6 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Music className="text-green-500" />
            {focusMusic ? "Study Music" : "Music Station"}
          </h2>
          <button
            onClick={togglePlaylists}
            className={`p-2 rounded-lg text-sm flex items-center gap-1 ${showPlaylists ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
          >
            <List size={16} />
            Playlists
          </button>
        </div>

        {focusMusic && !showPlaylists && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {studyPlaylists.map((playlist) => (
              <button
                key={playlist.category}
                onClick={() => searchStudyMusic(playlist)}
                className={`p-3 rounded-lg text-left transition-colors ${musicCategory === playlist.category
                  ? "bg-green-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
              >
                <div className="flex items-center gap-2">
                  {playlist.category === "lofi" && <Coffee size={18} />}
                  {playlist.category === "classical" && <Music size={18} />}
                  {playlist.category === "ambient" && <Brain size={18} />}
                  {playlist.category === "jazz" && <Music size={18} />}
                  {playlist.category === "nature" && <Music size={18} />}
                  {playlist.name}
                </div>
                <p className="text-xs mt-1 opacity-70">Perfect for focused studying</p>
              </button>
            ))}
          </div>
        )}

        <div className="search-bar flex gap-2 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={focusMusic ? "Search for study music..." : "Enter a song name..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-70"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Main content area - conditionally show playlists or player */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {showPlaylists ? (
            // Playlists Management Section
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-green-500">Your Playlists</h3>
                <button
                  className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-700 transition-colors"
                  onClick={togglePlaylists}
                  aria-label="Close playlists"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Create new playlist */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="New playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createNewPlaylist()}
                  className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={createNewPlaylist}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-2 transition-colors"
                >
                  <PlusCircle size={20} />
                </button>
              </div>

              {/* List of playlists */}
              <ul className="space-y-2 mb-6">
                {playlists.map((playlist) => (
                  <li
                    key={playlist.id}
                    className={`bg-zinc-800 rounded-lg overflow-hidden ${activePlaylistId === playlist.id ? "border-l-4 border-green-500" : ""
                      }`}
                  >
                    {editingPlaylistId === playlist.id ? (
                      <div className="flex p-2 gap-2">
                        <input
                          type="text"
                          value={editingPlaylistName}
                          onChange={(e) => setEditingPlaylistName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && savePlaylistEdit()}
                          autoFocus
                          className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg py-1 px-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button
                          onClick={savePlaylistEdit}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-1 transition-colors"
                        >
                          <Save size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center p-3">
                        <div className="flex-1 cursor-pointer" onClick={() => setActivePlaylistId(playlist.id)}>
                          <span className="font-medium block">{playlist.name}</span>
                          <span className="text-xs text-zinc-400">{playlist.tracks.length} tracks</span>
                        </div>

                        <div className="flex gap-1">
                          <button
                            className="text-green-500 hover:text-green-400 p-1 rounded-full hover:bg-zinc-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              playEntirePlaylist(playlist.id)
                            }}
                            aria-label={`Play ${playlist.name}`}
                            disabled={playlist.tracks.length === 0}
                          >
                            <PlayCircle size={18} />
                          </button>
                          <button
                            className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditingPlaylist(playlist.id, playlist.name)
                            }}
                            aria-label="Edit playlist"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              deletePlaylist(playlist.id)
                            }}
                            aria-label="Delete playlist"
                            disabled={playlists.length <= 1}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {/* Active playlist tracks */}
              <div className="border-t border-zinc-700 pt-4">
                <h4 className="text-green-500 font-medium mb-3">{activePlaylist.name} Tracks</h4>
                {activePlaylist.tracks.length === 0 ? (
                  <p className="text-center text-zinc-500 py-4">This playlist is empty. Add some tracks!</p>
                ) : (
                  <ul className="space-y-2">
                    {activePlaylist.tracks.map((item, index) => (
                      <li
                        key={index}
                        className={`flex items-center bg-zinc-800 rounded-lg p-2 cursor-pointer hover:bg-zinc-700 transition-colors ${currentTrackIndex === index && activePlaylistId === activePlaylist.id
                          ? "border-l-4 border-green-500"
                          : ""
                          }`}
                        onClick={() => playTrackFromPlaylist(index)}
                      >
                        <img
                          src={item.image || "/placeholder.svg?height=40&width=40"}
                          alt={`${item.name} album art`}
                          className="w-10 h-10 rounded object-cover mr-3"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="block font-medium text-sm truncate">{item.name}</span>
                          <span className="block text-xs text-zinc-400 truncate">{item.artist}</span>
                        </div>
                        <button
                          className="text-zinc-400 hover:text-red-500 p-1 rounded-full hover:bg-zinc-700 transition-colors ml-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFromPlaylist(index)
                          }}
                          aria-label="Remove from playlist"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            // Music Player Section
            <div className="flex-1 flex flex-col">
              {track ? (
                <>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="relative group w-full max-w-[220px] mx-auto mb-4">
                      <img
                        src={track.image || "/placeholder.svg?height=220&width=220"}
                        alt={`${track.name} album art`}
                        className="w-full aspect-square rounded-xl shadow-lg object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <button
                          onClick={togglePlay}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                        >
                          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                      </div>
                    </div>

                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold mb-1">{track.name}</h2>
                      <p className="text-zinc-400">{track.artist}</p>
                    </div>

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
                        onStateChange={onPlayerStateChange}
                        className="hidden"
                      />
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="progress-wrapper flex items-center gap-3 mb-4">
                      <span className="text-xs text-zinc-400 tabular-nums w-10">
                        {formatTime((progress / 100) * duration)}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={progress}
                        onChange={handleSeek}
                        className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #10b981 ${progress}%, #3f3f46 ${progress}%)`,
                        }}
                      />
                      <span className="text-xs text-zinc-400 tabular-nums w-10">{formatTime(duration)}</span>
                    </div>

                    <div className="controls flex items-center justify-center gap-6 mb-4">
                      <button
                        className={`text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors ${shuffle ? "text-green-500" : ""
                          }`}
                        onClick={toggleShuffle}
                        aria-label="Shuffle"
                      >
                        <Shuffle size={20} />
                      </button>

                      <button
                        className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors"
                        onClick={handlePrevious}
                        aria-label="Previous track"
                        disabled={currentTrackIndex <= 0 && !repeat}
                      >
                        <SkipBack size={20} />
                      </button>

                      <button
                        onClick={togglePlay}
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 transition-transform hover:scale-105"
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                      </button>

                      <button
                        className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors"
                        onClick={handleNext}
                        aria-label="Next track"
                      >
                        <SkipForward size={20} />
                      </button>

                      <button
                        className={`text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors ${repeat ? "text-green-500" : ""
                          }`}
                        onClick={toggleRepeat}
                        aria-label="Repeat"
                      >
                        <Repeat size={20} />
                      </button>
                    </div>

                    <div className="secondary-controls flex items-center justify-between">
                      <button
                        className={`text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors ${liked ? "text-green-500" : ""
                          }`}
                        onClick={toggleLike}
                        aria-label={liked ? "Unlike" : "Like"}
                      >
                        <Heart size={20} fill={liked ? "#10b981" : "none"} />
                      </button>

                      <div className="relative add-to-playlist-container">
                        <button
                          className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors add-to-playlist-button"
                          onClick={toggleAddToPlaylistDropdown}
                          aria-label="Add to playlist"
                        >
                          <Plus size={20} />
                        </button>

                        {showAddToPlaylistDropdown && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 rounded-lg shadow-xl w-48 z-10 add-to-playlist-dropdown">
                            <div className="p-2 border-b border-zinc-700 text-green-500 text-sm font-medium">
                              Add to playlist:
                            </div>
                            <ul className="max-h-48 overflow-y-auto">
                              {playlists.map((playlist) => (
                                <li
                                  key={playlist.id}
                                  onClick={() => confirmAddToPlaylist(playlist.id)}
                                  className="px-3 py-2 hover:bg-zinc-700 cursor-pointer flex items-center justify-between"
                                >
                                  <span className="text-sm">{playlist.name}</span>
                                  <Check size={16} className="text-green-500 opacity-0 group-hover:opacity-50" />
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <button
                        className={`text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors ${showPlaylists ? "text-green-500" : ""
                          }`}
                        onClick={togglePlaylists}
                        aria-label="Show playlists"
                      >
                        <List size={20} />
                      </button>

                      <div className="flex items-center gap-2 volume-control">
                        <button
                          className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors"
                          onClick={toggleMute}
                          aria-label={muted ? "Unmute" : "Mute"}
                        >
                          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-20 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #10b981 ${volume}%, #3f3f46 ${volume}%)`,
                          }}
                          aria-label="Volume"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <Music size={64} className="text-zinc-700 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No track selected</h3>
                  <p className="text-zinc-500 mb-6">Search for a song to start listening</p>

                  {focusMusic && (
                    <div className="text-center">
                      <p className="text-zinc-400 mb-4">Try one of our study music playlists:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {studyPlaylists.slice(0, 3).map((playlist) => (
                          <button
                            key={playlist.category}
                            onClick={() => searchStudyMusic(playlist)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 px-4 rounded-lg transition-colors"
                          >
                            {playlist.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-3 bg-zinc-800/50 border-t border-zinc-800 flex justify-between text-xs text-zinc-500">
        <span>Album art from Spotify</span>
        <span>Audio from YouTube</span>
      </div>
    </div>
  )
}
