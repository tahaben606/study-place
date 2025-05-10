"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckSquare, Square, Trash2, Plus, Edit, Calendar, Tag, X, ArrowUp, ArrowDown } from "lucide-react"

export default function TaskManager({ onTaskComplete, compact = false, fullscreen = false }) {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState({ title: "", priority: "medium", subject: "", dueDate: "" })
  const [isEditing, setIsEditing] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [filter, setFilter] = useState({ priority: "", subject: "", completed: "all" })
  const [subjects, setSubjects] = useState([])
  const [sortBy, setSortBy] = useState("dueDate") // dueDate, priority, subject
  const [sortDirection, setSortDirection] = useState("asc") // asc, desc
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)

  // Load tasks from localStorage with error handling
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem("studyTasks")
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks)
        if (Array.isArray(parsedTasks)) {
          setTasks(parsedTasks)

          // Extract all unique subjects
          const subjectSet = new Set()
          parsedTasks.forEach((task) => {
            if (task.subject) subjectSet.add(task.subject)
          })
          setSubjects(Array.from(subjectSet))
        }
      }
    } catch (error) {
      console.error("Error loading tasks from localStorage:", error)
    }
  }, [])

  // Save tasks to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("studyTasks", JSON.stringify(tasks))

      // Extract all unique subjects
      const subjectSet = new Set()
      tasks.forEach((task) => {
        if (task.subject) subjectSet.add(task.subject)
      })
      setSubjects(Array.from(subjectSet))
    } catch (error) {
      console.error("Error saving tasks to localStorage:", error)
    }
  }, [tasks])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPriorityDropdown && !event.target.closest(".priority-dropdown")) {
        setShowPriorityDropdown(false)
      }
      if (showSubjectDropdown && !event.target.closest(".subject-dropdown")) {
        setShowSubjectDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showPriorityDropdown, showSubjectDropdown])

  const addTask = useCallback(() => {
    if (!newTask.title.trim()) return

    const task = {
      id: Date.now(),
      title: newTask.title.trim(),
      completed: false,
      priority: newTask.priority || "medium",
      subject: newTask.subject.trim(),
      dueDate: newTask.dueDate,
      createdAt: new Date().toISOString(),
    }

    setTasks((prev) => [...prev, task])
    setNewTask({ title: "", priority: "medium", subject: "", dueDate: "" })
    setIsEditing(false)
  }, [newTask])

  const toggleTaskCompletion = useCallback(
    (id) => {
      const updatedTasks = tasks.map((task) => {
        if (task.id === id) {
          const newCompletedState = !task.completed

          // Notify parent component if task is completed
          if (newCompletedState && onTaskComplete && typeof onTaskComplete === "function") {
            onTaskComplete()
          }

          return { ...task, completed: newCompletedState }
        }
        return task
      })

      setTasks(updatedTasks)
    },
    [onTaskComplete, tasks],
  )

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }, [])

  const editTask = useCallback((task) => {
    setNewTask({
      title: task.title,
      priority: task.priority || "medium",
      subject: task.subject || "",
      dueDate: task.dueDate || "",
    })
    setIsEditing(true)
    setEditingTaskId(task.id)
  }, [])

  const updateTask = useCallback(() => {
    if (!newTask.title.trim()) return

    const updatedTasks = tasks.map((task) => {
      if (task.id === editingTaskId) {
        return {
          ...task,
          title: newTask.title.trim(),
          priority: newTask.priority,
          subject: newTask.subject.trim(),
          dueDate: newTask.dueDate,
        }
      }
      return task
    })

    setTasks(updatedTasks)
    setNewTask({ title: "", priority: "medium", subject: "", dueDate: "" })
    setIsEditing(false)
    setEditingTaskId(null)
  }, [editingTaskId, newTask, tasks])

  const cancelEdit = useCallback(() => {
    setNewTask({ title: "", priority: "medium", subject: "", dueDate: "" })
    setIsEditing(false)
    setEditingTaskId(null)
  }, [])

  const toggleSort = useCallback(
    (field) => {
      if (sortBy === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc")
      } else {
        setSortBy(field)
        setSortDirection("asc")
      }
    },
    [sortBy, sortDirection],
  )

  const resetFilters = useCallback(() => {
    setFilter({ priority: "", subject: "", completed: "all" })
  }, [])

  const togglePriorityDropdown = useCallback(() => {
    setShowPriorityDropdown((prev) => !prev)
    setShowSubjectDropdown(false)
  }, [])

  const toggleSubjectDropdown = useCallback(() => {
    setShowSubjectDropdown((prev) => !prev)
    setShowPriorityDropdown(false)
  }, [])

  const setPriorityFilter = useCallback((priority) => {
    setFilter((prev) => ({ ...prev, priority }))
    setShowPriorityDropdown(false)
  }, [])

  const setSubjectFilter = useCallback((subject) => {
    setFilter((prev) => ({ ...prev, subject }))
    setShowSubjectDropdown(false)
  }, [])

  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter((task) => {
      const matchesPriority = filter.priority ? task.priority === filter.priority : true
      const matchesSubject = filter.subject ? task.subject === filter.subject : true
      const matchesCompleted =
        filter.completed === "all" ? true : filter.completed === "completed" ? task.completed : !task.completed

      return matchesPriority && matchesSubject && matchesCompleted
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        // Handle empty due dates
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return sortDirection === "asc" ? 1 : -1
        if (!b.dueDate) return sortDirection === "asc" ? -1 : 1

        const dateA = new Date(a.dueDate)
        const dateB = new Date(b.dueDate)
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA
      }

      if (sortBy === "priority") {
        const priorityValues = { high: 3, medium: 2, low: 1 }
        const valueA = priorityValues[a.priority] || 0
        const valueB = priorityValues[b.priority] || 0
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA
      }

      if (sortBy === "subject") {
        if (!a.subject && !b.subject) return 0
        if (!a.subject) return sortDirection === "asc" ? 1 : -1
        if (!b.subject) return sortDirection === "asc" ? -1 : 1

        return sortDirection === "asc" ? a.subject.localeCompare(b.subject) : b.subject.localeCompare(a.subject)
      }

      return 0
    })

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-yellow-500"
      case "low":
        return "text-green-500"
      default:
        return "text-zinc-500"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const taskDate = new Date(dueDate)
      return taskDate < today
    } catch (error) {
      console.error("Error checking if task is overdue:", error)
      return false
    }
  }

  return (
    <div
      className={`bg-zinc-900 text-white rounded-xl shadow-2xl overflow-hidden ${compact ? "h-[400px]" : fullscreen ? "h-[700px]" : "h-full min-h-[500px]"}`}
    >
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckSquare className="text-blue-500" />
            Task Manager
          </h2>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
            title="Add new task"
          >
            <Plus size={18} />
          </button>
        </div>

        {isEditing ? (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            />

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Subject</label>
                <input
                  type="text"
                  list="subjects"
                  placeholder="Subject"
                  value={newTask.subject}
                  onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <datalist id="subjects">
                  {subjects.map((subject) => (
                    <option key={subject} value={subject} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-zinc-400 mb-1">Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={isEditing && editingTaskId ? updateTask : addTask}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex-1"
              >
                {isEditing && editingTaskId ? "Update Task" : "Add Task"}
              </button>
              <button
                onClick={cancelEdit}
                className="bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative priority-dropdown">
              <button
                className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center gap-1"
                onClick={togglePriorityDropdown}
              >
                <Tag size={14} className={filter.priority ? "text-blue-500" : "text-zinc-400"} />
                {filter.priority || "Priority"}
                {filter.priority && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPriorityFilter("")
                    }}
                  >
                    <X size={14} className="ml-1" />
                  </button>
                )}
              </button>
              {showPriorityDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-zinc-800 rounded-lg shadow-lg z-10 w-32">
                  <div
                    className="px-3 py-2 hover:bg-zinc-700 cursor-pointer flex items-center gap-2"
                    onClick={() => setPriorityFilter("high")}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    High
                  </div>
                  <div
                    className="px-3 py-2 hover:bg-zinc-700 cursor-pointer flex items-center gap-2"
                    onClick={() => setPriorityFilter("medium")}
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    Medium
                  </div>
                  <div
                    className="px-3 py-2 hover:bg-zinc-700 cursor-pointer flex items-center gap-2"
                    onClick={() => setPriorityFilter("low")}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Low
                  </div>
                </div>
              )}
            </div>

            <div className="relative subject-dropdown">
              <button
                className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center gap-1"
                onClick={toggleSubjectDropdown}
              >
                <Tag size={14} className={filter.subject ? "text-blue-500" : "text-zinc-400"} />
                {filter.subject || "Subject"}
                {filter.subject && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSubjectFilter("")
                    }}
                  >
                    <X size={14} className="ml-1" />
                  </button>
                )}
              </button>
              {showSubjectDropdown && subjects.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-zinc-800 rounded-lg shadow-lg z-10 w-40 max-h-48 overflow-y-auto">
                  {subjects.map((subject) => (
                    <div
                      key={subject}
                      className="px-3 py-2 hover:bg-zinc-700 cursor-pointer"
                      onClick={() => setSubjectFilter(subject)}
                    >
                      {subject}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <select
              value={filter.completed}
              onChange={(e) => setFilter({ ...filter, completed: e.target.value })}
              className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-3 rounded-lg transition-colors"
            >
              <option value="all">All Tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>

            {(filter.priority || filter.subject || filter.completed !== "all") && (
              <button
                onClick={resetFilters}
                className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center gap-1"
              >
                <X size={14} />
                Reset
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-zinc-400">
            {filteredAndSortedTasks.length}{" "}
            {filter.completed === "completed" ? "completed" : filter.completed === "active" ? "active" : ""} tasks
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Sort by:</span>
            <button
              onClick={() => toggleSort("dueDate")}
              className={`text-xs flex items-center gap-1 py-1 px-2 rounded ${sortBy === "dueDate" ? "bg-blue-900/30 text-blue-400" : "text-zinc-400"}`}
            >
              Date
              {sortBy === "dueDate" && (sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
            </button>
            <button
              onClick={() => toggleSort("priority")}
              className={`text-xs flex items-center gap-1 py-1 px-2 rounded ${sortBy === "priority" ? "bg-blue-900/30 text-blue-400" : "text-zinc-400"}`}
            >
              Priority
              {sortBy === "priority" && (sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
            </button>
            <button
              onClick={() => toggleSort("subject")}
              className={`text-xs flex items-center gap-1 py-1 px-2 rounded ${sortBy === "subject" ? "bg-blue-900/30 text-blue-400" : "text-zinc-400"}`}
            >
              Subject
              {sortBy === "subject" && (sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {filteredAndSortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <CheckSquare size={48} className="mb-4 opacity-50" />
              <p className="text-center">No tasks found</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 text-blue-500 hover:text-blue-400 flex items-center gap-1"
              >
                <Plus size={16} /> Add your first task
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-zinc-800 rounded-lg p-3 flex items-start gap-3 ${task.completed ? "opacity-60" : ""}`}
                >
                  <button onClick={() => toggleTaskCompletion(task.id)} className="mt-1">
                    {task.completed ? (
                      <CheckSquare size={18} className="text-blue-500" />
                    ) : (
                      <Square size={18} className="text-zinc-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-medium ${task.completed ? "line-through text-zinc-500" : "text-white"}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => editTask(task)} className="text-zinc-400 hover:text-blue-500 p-1">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="text-zinc-400 hover:text-red-500 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      {task.priority && (
                        <span className={`text-xs flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                          <Tag size={10} />
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </span>
                      )}

                      {task.subject && (
                        <span className="text-xs flex items-center gap-1 text-blue-400">
                          <Tag size={10} />
                          {task.subject}
                        </span>
                      )}

                      {task.dueDate && (
                        <span
                          className={`text-xs flex items-center gap-1 ${isOverdue(task.dueDate) && !task.completed ? "text-red-400" : "text-zinc-400"}`}
                        >
                          <Calendar size={10} />
                          {formatDate(task.dueDate)}
                          {isOverdue(task.dueDate) && !task.completed && " (Overdue)"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
