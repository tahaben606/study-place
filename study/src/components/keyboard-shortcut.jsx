"use client"

import { useEffect, useState } from "react"
import { HelpCircle, X } from "lucide-react"

export default function KeyboardShortcuts({ onToggleFocusMode, onToggleQueue, onPlayPause }) {
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return
      }

      // Show/hide shortcuts panel with "?"
      if (e.key === "?" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setShowShortcuts((prev) => !prev)
        return
      }

      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false)
        return
      }

      // Focus mode toggle with "F"
      if (e.key === "f" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        onToggleFocusMode()
        return
      }

      // Queue toggle with "Q"
      if (e.key === "q" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        onToggleQueue()
        return
      }

      // Play/Pause with Space
      if (e.key === " " && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        onPlayPause()
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showShortcuts, onToggleFocusMode, onToggleQueue, onPlayPause])

  return (
    <>
      <button
        onClick={() => setShowShortcuts(true)}
        className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        title="Keyboard shortcuts"
      >
        <HelpCircle size={20} />
      </button>

      {showShortcuts && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] dark:bg-[#111111] light:bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="p-4 flex items-center justify-between border-b border-zinc-800">
              <h3 className="font-bold text-lg">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">General</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Show/hide shortcuts</span>
                      <span className="flex">
                        <kbd className="shortcut-key">Ctrl</kbd>
                        <kbd className="shortcut-key">?</kbd>
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Toggle focus mode</span>
                      <span className="flex">
                        <kbd className="shortcut-key">F</kbd>
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Video Player</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Play/Pause</span>
                      <span className="flex">
                        <kbd className="shortcut-key">Space</kbd>
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Toggle queue</span>
                      <span className="flex">
                        <kbd className="shortcut-key">Q</kbd>
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Widgets</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Open Music widget</span>
                      <span className="flex">
                        <kbd className="shortcut-key">Alt</kbd>
                        <kbd className="shortcut-key">1</kbd>
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Open Timer widget</span>
                      <span className="flex">
                        <kbd className="shortcut-key">Alt</kbd>
                        <kbd className="shortcut-key">2</kbd>
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Open Notes widget</span>
                      <span className="flex">
                        <kbd className="shortcut-key">Alt</kbd>
                        <kbd className="shortcut-key">3</kbd>
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Open Tasks widget</span>
                      <span className="flex">
                        <kbd className="shortcut-key">Alt</kbd>
                        <kbd className="shortcut-key">4</kbd>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
