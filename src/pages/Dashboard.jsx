import { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "../firebase";

const db = getDatabase(app);

export default function Dashboard() {
  const [live, setLive] = useState(null);

  useEffect(() => {
    const liveRef = ref(db, "devices/device01/live");

    const unsubscribe = onValue(liveRef, (snapshot) => {
      if (snapshot.exists()) {
        setLive(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);

  const formattedAQI = Math.round(live?.aqi ?? 0);
  const formattedPressure = Math.round(live?.pressure ?? 0);
  const formattedTemp = live?.temp
    ? Number(live.temp).toFixed(1)
    : "0.0";

  // ✅ FULL DATE + TIME
  const lastUpdated = live?.timestamp
    ? new Date(live.timestamp * 1000).toLocaleString()
    : "--";

  // ✅ LIVE DETECTION (20 second freshness window)
  const isLive = () => {
    if (!live?.timestamp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now - live.timestamp < 20;
  };

  function getAQIColor(aqi) {
    if (aqi <= 50) return "bg-green-500";
    if (aqi <= 100) return "bg-yellow-500";
    if (aqi <= 200) return "bg-orange-500";
    if (aqi <= 300) return "bg-red-500";
    return "bg-purple-600";
  }

  function getAQIStatus(aqi) {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  }

  return (
    <div className="p-8 text-white">

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold">AQI Dashboard</h1>
          <p className="text-gray-400 text-sm">
            Real-time Air Quality Monitoring
          </p>
        </div>

        <div className="text-sm text-gray-400 text-right">
          <div>Last updated:</div>
          <div className="font-medium text-white">{lastUpdated}</div>
        </div>
      </div>

      {/* AQI Main Card */}
      <div className="bg-slate-900 rounded-2xl p-10 shadow-xl mb-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-green-500 to-blue-500 blur-3xl"></div>

        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-sm mb-2">Current AQI</div>

            <div className="flex items-center gap-6">
              <div className="relative">
                {isLive() && (
                  <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping"></div>
                )}
                <div className="relative text-6xl font-bold">
                  {formattedAQI}
                </div>
              </div>

              <div
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${getAQIColor(
                  formattedAQI
                )}`}
              >
                {getAQIStatus(formattedAQI)}
              </div>
            </div>
          </div>

          <div className="text-right text-sm">
            <div className="text-gray-400">Device: device01</div>
            <div className="text-gray-400">Interval: 10s</div>

            <div className="mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isLive() ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {isLive() ? "LIVE" : "OFFLINE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">

        <StatCard label="PM1" value={Math.round(live?.pm1 ?? 0)} unit="µg/m³" />
        <StatCard label="PM2.5" value={Math.round(live?.pm25 ?? 0)} unit="µg/m³" />
        <StatCard label="PM10" value={Math.round(live?.pm10 ?? 0)} unit="µg/m³" />
        <StatCard label="Temperature" value={formattedTemp} unit="°C" />
        <StatCard label="Pressure" value={formattedPressure} unit="hPa" />
        <StatCard label="CO Status" value={live?.co_status ?? "--"} unit="" />

      </div>

      {/* System Panel */}
      <div className="bg-slate-900 p-6 rounded-2xl mt-10 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">System Status</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-gray-400">
          <div>Device ID: device01</div>
          <div>
            Connection:{" "}
            <span className={isLive() ? "text-green-400" : "text-red-400"}>
              {isLive() ? "Active" : "Disconnected"}
            </span>
          </div>
          <div>Data Source: ESP32</div>
          <div>Backend: Firebase RTDB</div>
        </div>
      </div>

    </div>
  );
}

function StatCard({ label, value, unit }) {
  return (
    <div className="bg-slate-900 p-6 rounded-2xl shadow-lg hover:scale-105 transition-transform duration-200">
      <div className="text-gray-400 text-sm mb-2">{label}</div>
      <div className="text-2xl font-semibold">
        {value} {unit}
      </div>
    </div>
  );
}