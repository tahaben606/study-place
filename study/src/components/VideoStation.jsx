import React, { useState } from "react";
import axios from "axios";


const API_KEY = "AIzaSyBLcEftz_mf0AbsemRGSsGK4HiWbMJCgQ4";

const VideoStation = () => {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [savedVideos, setSavedVideos] = useState([]);


  const handleSearch = async () => {
    try {
      const normalRes = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
          part: "snippet",
          maxResults: 25,
          key: API_KEY,
          q: query,
          type: "video",
          videoDuration: "medium"
        }
      });

      const shortsRes = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
          part: "snippet",
          maxResults: 10,
          key: API_KEY,
          q: query,
          type: "video",
          videoDuration: "short"
        }
      });

      setVideos(normalRes.data.items);
      setShorts(shortsRes.data.items);
    } catch (err) {
      console.error("Error fetching videos:", err);
    }
  };

  const handleVideoClick = async (videoId) => {
    try {
      const detailRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          part: "snippet,statistics,contentDetails",
          id: videoId,
          key: API_KEY
        }
      });
      const videoData = detailRes.data.items[0];
      setSelectedVideo(videoData);
    } catch (err) {
      console.error("Error loading video details:", err);
    }
  };

  const closeModal = () => setSelectedVideo(null);
  const handleAddToHome = () => {
  if (selectedVideo) {
    // Avoid duplicates
    if (!savedVideos.find((v) => v.id === selectedVideo.id)) {
      setSavedVideos((prev) => [...prev, selectedVideo]);
    }
    closeModal(); // Optional: close after adding
  }
};


  return (
    <div className="video-station">
      <h2>🎥 Video Station</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search YouTube..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      <div className="home-section">
  <h3>🏠 Home</h3>
  {savedVideos.length === 0 ? (
    <p className="home-placeholder">No video selected. Please search and add a video.</p>
  ) : (
    savedVideos.map((video) => (
      <div key={video.id} className="video-row single">
        <div className="video-card">
          <img src={video.snippet.thumbnails.medium.url} alt="" />
          <div className="video-info">
            <h4>{video.snippet.title}</h4>
            <p>{video.snippet.channelTitle}</p>
          </div>
        </div>
      </div>
    ))
  )}
</div>


      {videos.map((video, index) => (
  <React.Fragment key={video.id.videoId}>
    <div className="video-row single" onClick={() => handleVideoClick(video.id.videoId)}>
            <div className="video-card">
              <img src={video.snippet.thumbnails.medium.url} alt="" />
              <div className="video-info">
                <h4>{video.snippet.title}</h4>
                <p>{video.snippet.channelTitle}</p>
              </div>
            </div>
          </div>

          {(index + 1) % 5 === 0 && (
      <div>
        <h3 className="shorts-title">📱 Shorts</h3>
        <div className="shorts-row">
                {shorts.slice((index / 5) * 5, (index / 5) * 5 + 5).map((short) => (
                  <div className="shorts-card" key={short.id.videoId}>
                    <img
                      src={short.snippet.thumbnails.medium.url}
                      alt=""
                      onClick={() => handleVideoClick(short.id.videoId)}
                    />
                    <div className="shorts-info">
                      <h5>{short.snippet.title}</h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </React.Fragment>
      ))}

      {selectedVideo && (
        <div className="video-modal">
          <div className="video-modal-content">
            <button className="close-btn" onClick={closeModal}>✕</button>
            <iframe
                width="100%"
                height="400"
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.snippet.title}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                ></iframe>

            <h3>{selectedVideo.snippet.title}</h3>
            <p><strong>Channel:</strong> {selectedVideo.snippet.channelTitle}</p>
            <p><strong>Views:</strong> {selectedVideo.statistics.viewCount}</p>
            <p className="desc">{selectedVideo.snippet.description}</p>
            <button className="add-btn" onClick={handleAddToHome}>+ Add to Home</button>

          </div>
        </div>
      )}
    </div>
  );
};

export default VideoStation;
