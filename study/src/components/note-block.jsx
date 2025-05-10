"use client"

import { useState, useEffect, useCallback } from "react"
import { FileText, Save, Trash2, Plus, X, Tag, Clock } from "lucide-react"

export default function NoteBlock({ compact = false }) {
  const [notes, setNotes] = useState([])
  const [currentNote, setCurrentNote] = useState({ id: null, title: "", content: "", tags: [], createdAt: null })
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [allTags, setAllTags] = useState([])
  const [tagInput, setTagInput] = useState("")

  // Load notes from localStorage with error handling
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem("studyNotes")
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes)
        if (Array.isArray(parsedNotes)) {
          setNotes(parsedNotes)

          // Extract all unique tags
          const tags = new Set()
          parsedNotes.forEach((note) => {
            if (Array.isArray(note.tags)) {
              note.tags.forEach((tag) => tags.add(tag))
            }
          })
          setAllTags(Array.from(tags))
        }
      }
    } catch (error) {
      console.error("Error loading notes from localStorage:", error)
    }
  }, [])

  // Save notes to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("studyNotes", JSON.stringify(notes))

      // Update all tags
      const tags = new Set()
      notes.forEach((note) => {
        if (Array.isArray(note.tags)) {
          note.tags.forEach((tag) => tags.add(tag))
        }
      })
      setAllTags(Array.from(tags))
    } catch (error) {
      console.error("Error saving notes to localStorage:", error)
    }
  }, [notes])

  const createNewNote = useCallback(() => {
    setCurrentNote({
      id: Date.now(),
      title: "",
      content: "",
      tags: [],
      createdAt: new Date().toISOString(),
    })
    setIsEditing(true)
  }, [])

  const editNote = useCallback((note) => {
    setCurrentNote({
      ...note,
      tags: Array.isArray(note.tags) ? [...note.tags] : [],
    })
    setIsEditing(true)
  }, [])

  const saveNote = useCallback(() => {
    if (!currentNote.title.trim() && !currentNote.content.trim()) {
      return
    }

    // Ensure we have valid data
    const noteToSave = {
      ...currentNote,
      title: currentNote.title.trim(),
      content: currentNote.content.trim(),
      tags: Array.isArray(currentNote.tags) ? currentNote.tags : [],
      createdAt: currentNote.createdAt || new Date().toISOString(),
    }

    const updatedNotes = currentNote.id
      ? notes.map((note) => (note.id === currentNote.id ? noteToSave : note))
      : [...notes, noteToSave]

    setNotes(updatedNotes)
    setCurrentNote({ id: null, title: "", content: "", tags: [], createdAt: null })
    setIsEditing(false)
  }, [currentNote, notes])

  const deleteNote = useCallback(
    (id) => {
      setNotes(notes.filter((note) => note.id !== id))
      if (currentNote.id === id) {
        setCurrentNote({ id: null, title: "", content: "", tags: [], createdAt: null })
        setIsEditing(false)
      }
    },
    [currentNote.id, notes],
  )

  const addTag = useCallback(
    (tag) => {
      if (!tag || !tag.trim()) return

      const trimmedTag = tag.trim()
      if (Array.isArray(currentNote.tags) && !currentNote.tags.includes(trimmedTag)) {
        setCurrentNote({
          ...currentNote,
          tags: [...currentNote.tags, trimmedTag],
        })
      }
      setTagInput("")
    },
    [currentNote],
  )

  const removeTag = useCallback(
    (tag) => {
      if (!Array.isArray(currentNote.tags)) return

      setCurrentNote({
        ...currentNote,
        tags: currentNote.tags.filter((t) => t !== tag),
      })
    },
    [currentNote],
  )

  const handleTagInput = useCallback(
    (e) => {
      if (e.key === "Enter" && tagInput.trim()) {
        addTag(tagInput.trim())
        e.preventDefault()
      }
    },
    [addTag, tagInput],
  )

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTag = tagFilter ? Array.isArray(note.tags) && note.tags.includes(tagFilter) : true

    return matchesSearch && matchesTag
  })

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  return (
    <div
      className={`bg-zinc-900 text-white rounded-xl shadow-2xl overflow-hidden ${compact ? "h-[400px]" : "h-full min-h-[700px]"}`}
    >
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-purple-500" />
            Note Block
          </h2>
          <button
            onClick={createNewNote}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
            title="Create new note"
          >
            <Plus size={18} />
          </button>
        </div>

        {!isEditing ? (
          <div className="flex-1 flex flex-col">
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              {allTags.length > 0 && (
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {filteredNotes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                <FileText size={48} className="mb-4 opacity-50" />
                <p className="text-center">No notes found</p>
                <button
                  onClick={createNewNote}
                  className="mt-4 text-purple-500 hover:text-purple-400 flex items-center gap-1"
                >
                  <Plus size={16} /> Create your first note
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-zinc-800 rounded-lg p-4 cursor-pointer hover:bg-zinc-700 transition-colors"
                    onClick={() => editNote(note)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg line-clamp-1">{note.title || "Untitled Note"}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNote(note.id)
                        }}
                        className="text-zinc-500 hover:text-red-500 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-zinc-400 text-sm line-clamp-2 mb-2">{note.content || "No content"}</p>
                    {Array.isArray(note.tags) && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {note.tags.map((tag) => (
                          <span key={tag} className="bg-zinc-700 text-purple-400 text-xs px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center text-xs text-zinc-500">
                      <Clock size={12} className="mr-1" />
                      {formatDate(note.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Note title"
                value={currentNote.title}
                onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
              />
              <textarea
                placeholder="Write your note here..."
                value={currentNote.content}
                onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent h-40 resize-none"
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={16} className="text-purple-500" />
                <span className="text-sm text-zinc-400">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {Array.isArray(currentNote.tags) &&
                  currentNote.tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-zinc-800 text-purple-400 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="text-zinc-500 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInput}
                    className="bg-zinc-800 border border-zinc-700 rounded-full py-1 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => addTag(tagInput)}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-1 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-auto flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                Save Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
