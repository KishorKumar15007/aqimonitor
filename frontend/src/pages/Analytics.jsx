import { useEffect, useRef, useState, useMemo } from "react";
import { ref, onValue } from "firebase/database";
import { app } from "../firebase";
import { getDatabase } from "firebase/database";
import zoomPlugin from "chartjs-plugin-zoom";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
  Filler,
  Title,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
  Filler,
  Title,
  zoomPlugin
);

const db = getDatabase(app);

export default function Analytics() {
  const chartRef = useRef(null);
  const [range, setRange] = useState("raw_10s");
  const [dataPoints, setDataPoints] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState({
    aqi: true,
    pm1: true,
    pm25: true,
    pm10: true,
  });

  const isBucket = range !== "raw_10s";

  useEffect(() => {
    const dataRef = ref(db, `devices/device01/${range}`);

    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (!snapshot.exists()) {
        setDataPoints([]);
        return;
      }

      const raw = snapshot.val();

      const formatted = Object.keys(raw)
        .map((k) => ({
          timestamp: parseInt(k),
          ...raw[k],
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      setDataPoints(formatted);
    });

    return () => unsubscribe();
  }, [range]);

  const labels = dataPoints.map(() => "");

  const metricColors = {
    aqi: "#22c55e",
    pm1: "#3b82f6",
    pm25: "#f59e0b",
    pm10: "#ef4444",
  };

  const metricNames = {
    aqi: "Air Quality Index",
    pm1: "PM1 (µg/m³)",
    pm25: "PM2.5 (µg/m³)",
    pm10: "PM10 (µg/m³)",
  };

  const activeMetrics = Object.keys(selectedMetrics).filter(
    (m) => selectedMetrics[m]
  );

  const datasets = activeMetrics
    .filter((metric) => !isBucket || metric === "aqi") // 🔥 only AQI in bucket
    .map((metric) => ({
      label: metricNames[metric],
      data: dataPoints.map((d) =>
        isBucket ? d.avg : d[metric]   // 🔥 bucket uses avg directly
      ),
      borderColor: metricColors[metric],
      backgroundColor: metricColors[metric] + "22",
      fill: true,
      tension: 0.3,
      borderWidth: 3,
      pointRadius: dataPoints.length <= 2 ? 5 : 0,
      pointHoverRadius: 6,
    }));

  const dynamicMax = useMemo(() => {
    const allValues = datasets.flatMap((d) =>
      d.data.filter((v) => typeof v === "number")
    );
    if (!allValues.length) return 100;
    return Math.max(...allValues) * 1.2;
  }, [datasets]);

  const dynamicTitle = `Analytics - ${
    range === "raw_10s"
      ? "Last 1 Hour"
      : range === "bucket_1min"
      ? "Last 24 Hours"
      : "Last 7 Days"
  }`;

  return (
    <div className="p-8 text-white">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-6 border-b border-slate-700 pb-3">
          Air Quality Dashboard
        </h1>

        {/* Range Buttons */}
        <div className="flex gap-4 mb-6">
          <RangeButton label="1 Hour" value="raw_10s" current={range} setRange={setRange} />
          <RangeButton label="24 Hours" value="bucket_1min" current={range} setRange={setRange} />
          <RangeButton label="7 Days" value="bucket_10min" current={range} setRange={setRange} />
        </div>

        {/* Metric Toggles */}
        {!isBucket && (
          <div className="flex gap-6 mb-6 flex-wrap">
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
                {metricNames[metric]}
              </label>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <Line
            ref={chartRef}
            data={{ labels, datasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: "index", intersect: false },
              plugins: {
                title: {
                  display: true,
                  text: dynamicTitle,
                  color: "white",
                  font: { size: 16, weight: "bold" },
                  padding: { bottom: 20 },
                },
                legend: {
                  labels: { color: "white" },
                },
                tooltip: {
                  callbacks: {
                    title: function (context) {
                      const index = context[0].dataIndex;
                      const epoch = dataPoints[index]?.timestamp;
                      const date = new Date(epoch * 1000);

                      return date.toLocaleString("en-GB");
                    },
                  },
                },
                zoom: {
                  pan: { enabled: true, mode: "x" },
                  zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: "x",
                  },
                },
              },
              scales: {
                x: {
                  ticks: { display: false },
                  grid: { display: false },
                },
                y: {
                  beginAtZero: true,
                  suggestedMax: dynamicMax,
                  ticks: { color: "white" },
                  grid: { color: "rgba(255,255,255,0.08)" },
                },
              },
            }}
            height={420}
          />
        </div>
      </div>
    </div>
  );
}

function RangeButton({ label, value, current, setRange }) {
  return (
    <button
      onClick={() => setRange(value)}
      className={`px-4 py-2 rounded-lg transition ${
        current === value
          ? "bg-green-500 text-black"
          : "bg-slate-700 hover:bg-slate-600"
      }`}
    >
      {label}
    </button>
  );
}