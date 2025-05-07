import React, { useState, useEffect, useRef } from "react";


const presets = [
  { label: "25/5", focus: 25, break: 5 },
  { label: "50/10", focus: 50, break: 10 },
];

const PomodoroTimer = () => {
  const [mode, setMode] = useState("focus"); // "focus" or "break"
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(presets[0]);

  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((sec) => {
          if (sec === 0) {
            if (minutes === 0) {
              switchMode();
              return 0;
            }
            setMinutes((m) => m - 1);
            return 59;
          }
          return sec - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, minutes]);

  const switchMode = () => {
    const nextMode = mode === "focus" ? "break" : "focus";
    setMode(nextMode);
    setMinutes(nextMode === "focus" ? selectedPreset.focus : selectedPreset.break);
    setSeconds(0);
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMode("focus");
    setMinutes(selectedPreset.focus);
    setSeconds(0);
  };

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    resetTimer();
  };

  return (
    <div className="pomodoro">
      <h2>⏱️ Pomodoro Timer</h2>

      <div className="presets">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetChange(preset)}
            className={preset.label === selectedPreset.label ? "active" : ""}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className={`timer ${mode}`}>
        <h3>{mode === "focus" ? "Focus Time" : "Break Time"}</h3>
        <span>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
      </div>

      <div className="controls">
        <button onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={resetTimer}>Reset</button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
