import React, { useState, useEffect } from "react";


const NoteBlock = () => {
  const [note, setNote] = useState(() => localStorage.getItem("note") || "");

  useEffect(() => {
    localStorage.setItem("note", note);
  }, [note]);

  return (
    <div className="note-block">
      <h2>📝 Note Block</h2>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write your thoughts, tasks, or notes here..."
      ></textarea>
    </div>
  );
};

export default NoteBlock;
