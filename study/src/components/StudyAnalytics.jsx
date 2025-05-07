import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StudyAnalytics = () => {
  // Sample data for study time (in hours) and task completion for the week
  const studyData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Study Time (hrs)",
        data: [2, 3, 4, 5, 2, 6, 7], // Replace with your actual data
        borderColor: "#3e3f58",
        backgroundColor: "rgba(62, 63, 88, 0.2)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Completed Tasks",
        data: [5, 8, 10, 12, 5, 7, 10], // Replace with your actual data
        borderColor: "#2e8b57",
        backgroundColor: "rgba(46, 139, 87, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="study-analytics">
      <h2>📊 Study Analytics Dashboard</h2>

      <div className="chart-container">
        <Line data={studyData} options={{ responsive: true }} />
      </div>

      <div className="focus-break-ratio">
        <h3>Focus vs Break Ratio</h3>
        <div className="ratio">
          <span className="focus">Focus: 70%</span>
          <span className="break">Break: 30%</span>
        </div>
      </div>
    </div>
  );
};

export default StudyAnalytics;
