import React, { useState } from "react";


const StudyRooms = () => {
  const [roomName, setRoomName] = useState("");
  const [roomList, setRoomList] = useState([
    { name: "Math Study Room", participants: 5 },
    { name: "Science Study Room", participants: 8 },
    { name: "Language Study Room", participants: 3 },
  ]);

  const handleCreateRoom = () => {
    if (roomName) {
      const newRoom = { name: roomName, participants: 1 };
      setRoomList([...roomList, newRoom]);
      setRoomName("");
    }
  };

  return (
    <div className="study-rooms">
      <h2>🤝 Community Study Rooms</h2>

      <div className="create-room">
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter Room Name"
        />
        <button onClick={handleCreateRoom}>Create Room</button>
      </div>

      <div className="room-list">
        {roomList.map((room, index) => (
          <div key={index} className="room-item">
            <span>{room.name}</span>
            <span>{room.participants} Participants</span>
            <button>Join</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyRooms;
