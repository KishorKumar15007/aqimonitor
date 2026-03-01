import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { app } from "../firebase";
import { getDatabase } from "firebase/database";

const db = getDatabase(app);

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
  Filler
);

export default function Analytics() {
  const [range, setRange] = useState("raw_10s");
  const [dataPoints, setDataPoints] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState({
    aqi: true,
    pm1: false,
    pm25: false,
    pm10: false,
  });

  useEffect(() => {
    const dataRef = ref(db, `devices/device01/${range}`);

    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const raw = snapshot.val();

      const sorted = Object.keys(raw)
        .map((k) => ({
          timestamp: parseInt(k),
          ...raw[k],
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      setDataPoints(sorted);
    });

    return () => unsubscribe();
  }, [range]);

  // ----------------------------
  // FIXED LABEL FORMATTING
  // ----------------------------

  const formatLabel = (timestamp) => {
    const date = new Date(timestamp * 1000);

    if (range === "raw_10s") {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    if (range === "bucket_1min") {
      // 24 hours → show date + hour
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
      });
    }

    // 7 days → show only date
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const labels = dataPoints.map((d) => formatLabel(d.timestamp));

  const buildRawDataset = (key, color) => ({
    label: key.toUpperCase(),
    data: dataPoints.map((d) => d[key]),
    borderColor: color,
    backgroundColor: color + "22",
    tension: 0.4,
    fill: true,
    pointRadius: 3,
    pointHoverRadius: 6,
  });

  const buildBucketDataset = (key, color) => ({
    label: key.toUpperCase(),
    data: dataPoints.map((d) => d[key]?.avg),
    borderColor: color,
    backgroundColor: color + "22",
    tension: 0.4,
    fill: true,
    pointRadius: 3,
    pointHoverRadius: 6,
  });

  const datasets = [];

  const metricColors = {
    aqi: "#22c55e",
    pm1: "#3b82f6",
    pm25: "#f59e0b",
    pm10: "#ef4444",
  };

  Object.keys(selectedMetrics).forEach((metric) => {
    if (!selectedMetrics[metric]) return;

    if (range === "raw_10s") {
      datasets.push(buildRawDataset(metric, metricColors[metric]));
    } else {
      datasets.push(buildBucketDataset(metric, metricColors[metric]));
    }
  });

  return (
    <div className="p-8 text-white">

      <h1 className="text-3xl font-bold mb-6">Analytics</h1>

      {/* Range Selector */}
      <div className="flex gap-4 mb-6">
        <RangeButton label="1 Hour" value="raw_10s" current={range} setRange={setRange} />
        <RangeButton label="24 Hours" value="bucket_1min" current={range} setRange={setRange} />
        <RangeButton label="7 Days" value="bucket_10min" current={range} setRange={setRange} />
      </div>

      {/* Metric Toggles */}
      <div className="flex gap-6 mb-6 flex-wrap">
        {Object.keys(selectedMetrics).map((metric) => (
          <label
            key={metric}
            className="flex items-center gap-2 cursor-pointer hover:scale-105 transition"
          >
            <input
              type="checkbox"
              checked={selectedMetrics[metric]}
              onChange={() =>
                setSelectedMetrics({
                  ...selectedMetrics,
                  [metric]: !selectedMetrics[metric],
                })
              }
            />
            {metric.toUpperCase()}
          </label>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-xl relative overflow-hidden">

        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-green-500 to-blue-500 blur-3xl"></div>

        <Line
          data={{
            labels,
            datasets,
          }}
          options={{
            responsive: true,
            animation: {
              duration: 1200,
              easing: "easeInOutQuart",
            },
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: {
                labels: { color: "white" },
              },
              tooltip: {
                backgroundColor: "#0f172a",
                borderColor: "#22c55e",
                borderWidth: 1,
                callbacks: {
                  title: function (context) {
                    const index = context[0].dataIndex;
                    const epoch = dataPoints[index]?.timestamp;
                    return new Date(epoch * 1000).toLocaleString();
                  },
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  color: "white",
                  maxRotation: 45,
                  minRotation: 45,
                },
                grid: { display: false },
              },
              y: {
                ticks: { color: "white" },
                grid: { color: "rgba(255,255,255,0.05)" },
              },
            },
          }}
        />
      </div>
    </div>
  );
}

function RangeButton({ label, value, current, setRange }) {
  return (
    <button
      onClick={() => setRange(value)}
      className={`px-4 py-2 rounded-xl transition-all duration-300 ${
        current === value
          ? "bg-green-500 text-black scale-105"
          : "bg-slate-800 hover:bg-slate-700"
      }`}
    >
      {label}
    </button>
  );
}