import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home.jsx';
import VideoStation from './components/VideoStation';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<VideoStation />} />
      </Routes>
    </Router>
  );
}

export default App;
