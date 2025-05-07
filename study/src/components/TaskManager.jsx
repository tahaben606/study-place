import React, { useState } from "react";


const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState("");
  const [priority, setPriority] = useState("low");
  const [subject, setSubject] = useState("");

  const handleAddTask = () => {
    if (task) {
      const newTask = {
        id: Date.now(),
        text: task,
        priority,
        subject,
        completed: false,
      };
      setTasks([...tasks, newTask]);
      setTask("");
      setPriority("low");
      setSubject("");
    }
  };

  const toggleTaskCompletion = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  return (
    <div className="task-manager">
      <h2>✅ Task Manager</h2>
      <div className="task-input">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter task"
        />
        <div className="task-options">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (e.g., Math)"
          />
        </div>
        <button onClick={handleAddTask}>Add Task</button>
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <p>No tasks added yet!</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className={`task-item ${task.completed ? "completed" : ""}`}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTaskCompletion(task.id)}
              />
              <span className="task-text">{task.text}</span>
              <span className={`task-priority ${task.priority}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
              <span className="task-subject">{task.subject}</span>
              <button onClick={() => deleteTask(task.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskManager;
