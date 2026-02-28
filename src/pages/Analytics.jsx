import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip
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

  const labels = dataPoints.map((d) =>
    new Date(d.timestamp * 1000).toLocaleTimeString()
  );

  const datasetBuilder = (key, color) => ({
    label: key.toUpperCase(),
    data: dataPoints.map((d) => d[key]),
    borderColor: color,
    backgroundColor: color,
    tension: 0.3,
  });

  const datasets = [];

  if (selectedMetrics.aqi)
    datasets.push(datasetBuilder("aqi", "#22c55e"));
  if (selectedMetrics.pm1)
    datasets.push(datasetBuilder("pm1", "#3b82f6"));
  if (selectedMetrics.pm25)
    datasets.push(datasetBuilder("pm25", "#f59e0b"));
  if (selectedMetrics.pm10)
    datasets.push(datasetBuilder("pm10", "#ef4444"));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>

      {/* Range Selector */}
      <div className="flex gap-4 mb-6">
        <RangeButton
          label="1 Hour"
          value="raw_10s"
          current={range}
          setRange={setRange}
        />
        <RangeButton
          label="24 Hours"
          value="bucket_1min"
          current={range}
          setRange={setRange}
        />
        <RangeButton
          label="7 Days"
          value="bucket_10min"
          current={range}
          setRange={setRange}
        />
      </div>

      {/* Metric Toggles */}
      <div className="flex gap-6 mb-6">
        {Object.keys(selectedMetrics).map((metric) => (
          <label key={metric} className="flex items-center gap-2 cursor-pointer">
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
      <div className="bg-slate-800 p-6 rounded-2xl shadow-xl">
        <Line
          data={{
            labels,
            datasets,
          }}
          options={{
            responsive: true,
            plugins: {
              legend: {
                labels: { color: "white" },
              },
            },
            scales: {
              x: {
                ticks: { color: "white" },
              },
              y: {
                ticks: { color: "white" },
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
      className={`px-4 py-2 rounded-xl transition ${
        current === value
          ? "bg-green-500 text-black"
          : "bg-slate-800 hover:bg-slate-700"
      }`}
    >
      {label}
    </button>
  );
}